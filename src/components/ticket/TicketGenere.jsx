/**
 * Ticket Généré - Version horizontale avec affiche en fond
 * Règles NASA 1-10
 * CORRECTIONS :
 * - QR code plus grand
 * - Textes non coupés (height: auto, line-height, overflow visible)
 * - Toutes les informations visibles
 * - Téléchargement direct via l'URL (paramètre ?download=true)
 * - Détection du téléchargement automatique via WhatsApp
 * - CORRECTION : Import dynamique de html2canvas pour Netlify
 * - CORRECTION : Gestion des erreurs de chargement
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, Home, Ticket, Calendar, MapPin, User, Phone, 
  CreditCard, Loader, CheckCircle, AlertCircle, Crown, 
  Sparkles, Building2, Sofa, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TicketGenere = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [evenement, setEvenement] = useState(null);
  const [typeTicket, setTypeTicket] = useState(null);
  const [organisateur, setOrganisateur] = useState(null);
  const [estTelecharge, setEstTelecharge] = useState(false);
  const [estScanne, setEstScanne] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);

  const getSiteUrl = () => {
    return window.location.origin;
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr });
    } catch {
      return '';
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  const getIconeForCategorie = (categorie) => {
    const cat = categorie?.toLowerCase() || '';
    switch(cat) {
      case 'vip': return <Crown className="h-4 w-4" />;
      case 'vvip': return <Sparkles className="h-4 w-4" />;
      case 'stand': return <Building2 className="h-4 w-4" />;
      case 'salon': return <Sofa className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT AVEC IMPORT DYNAMIQUE DE html2canvas
  // ============================================================

  const handleDownload = async (force = false) => {
    // Si déjà téléchargé et pas de force (admin/organisateur), bloquer
    if (estTelecharge && !force) {
      setError('⚠️ Ce ticket a déjà été téléchargé.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (estScanne) {
      setError('⚠️ Ce ticket a déjà été scanné.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!ticketRef.current) {
      setError('❌ Référence du ticket non trouvée.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setDownloading(true);
    setError('');

    try {
      // ✅ CORRECTION : Import dynamique de html2canvas avec fallback
      let html2canvas;
      try {
        const module = await import('html2canvas');
        html2canvas = module.default || module;
      } catch (importError) {
        console.error('Erreur import html2canvas:', importError);
        setError('❌ Erreur lors du chargement de la bibliothèque de téléchargement.');
        setDownloading(false);
        return;
      }

      if (!html2canvas || typeof html2canvas !== 'function') {
        setError('❌ La bibliothèque de téléchargement n\'est pas disponible.');
        setDownloading(false);
        return;
      }

      // Mettre à jour uniquement si ce n'est pas un admin/organisateur qui force
      if (!force) {
        try {
          const { error: updateError } = await supabase
            .from('ventes')
            .update({
              est_telecharger: true,
              date_telechargement: new Date().toISOString()
            })
            .eq('id', id);

          if (updateError) {
            console.error('Erreur mise à jour:', updateError);
          }
        } catch (updateError) {
          console.error('Erreur mise à jour:', updateError);
        }
        setEstTelecharge(true);
      }

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#000000',
        logging: false,
        allowTaint: true,
        useClone: true,
        width: 850,
        height: 530,
        onclone: (document) => {
          const elements = document.querySelectorAll('.ticket-text');
          elements.forEach(el => {
            el.style.height = 'auto';
            el.style.lineHeight = '1.6';
            el.style.overflow = 'visible';
            el.style.paddingBottom = '6px';
          });
        }
      });
      
      const link = document.createElement('a');
      link.download = `ticket-${id}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('✅ Ticket téléchargé avec succès !');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setError('❌ Erreur lors du téléchargement: ' + (error.message || 'Veuillez réessayer'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT AVEC FORCE (POUR ADMIN/ORGANISATEUR PREMIUM)
  // ============================================================

  const handleForceDownload = async () => {
    await handleDownload(true);
  };

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Récupérer le ticket
        const { data: vente, error: venteError } = await supabase
          .from('ventes')
          .select('*')
          .eq('id', id)
          .single();

        if (venteError || !vente) {
          setError('Ticket non trouvé');
          setLoading(false);
          return;
        }

        setTicketData(vente);
        setEstTelecharge(vente.est_telecharger || false);
        setEstScanne(vente.est_scanner || false);

        // 2. Récupérer l'événement
        if (vente.evenement_id) {
          const { data: event, error: eventError } = await supabase
            .from('evenements')
            .select('*, organisateur:profiles(*)')
            .eq('id', vente.evenement_id)
            .single();

          if (!eventError && event) {
            setEvenement(event);
            if (event.organisateur) {
              setOrganisateur(event.organisateur);
            }
          }
        }

        // 3. Récupérer le type de ticket
        if (vente.type_ticket_id) {
          const { data: type, error: typeError } = await supabase
            .from('types_tickets')
            .select('*')
            .eq('id', vente.type_ticket_id)
            .single();

          if (!typeError && type) {
            setTypeTicket(type);
          }
        }

        // 4. Récupérer le rôle de l'utilisateur connecté
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, plan_id')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserRole(profile.role);
          }
        }

        // 5. Vérifier si téléchargement automatique demandé
        const params = new URLSearchParams(location.search);
        const downloadParam = params.get('download');
        
        if (downloadParam === 'true' && !autoDownloadTriggered) {
          setAutoDownloadTriggered(true);
          // Attendre que le composant soit rendu
          setTimeout(() => {
            handleDownload(true);
          }, 1500);
        }

      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur lors du chargement du ticket');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTicketData();
    }
  }, [id, location.search]);

  const getStatusInfo = () => {
    if (estScanne) {
      return { text: 'SCANNÉ', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' };
    }
    if (estTelecharge) {
      return { text: 'TÉLÉCHARGÉ', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' };
    }
    return { text: 'VALIDE', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' };
  };

  const status = getStatusInfo();
  const qrValue = `${getSiteUrl()}/verify/${id}`;

  // ============================================================
  // VÉRIFICATION SI L'UTILISATEUR PEUT RETÉLÉCHARGER
  // ============================================================

  const canRedownload = () => {
    // Admin peut toujours retélécharger
    if (userRole === 'admin') return true;
    // Organisateur Premium peut retélécharger
    if (userRole === 'organisateur' && organisateur?.plan_id === 'Premium') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Chargement du ticket...</p>
        </div>
      </div>
    );
  }

  if (error && !ticketData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket non trouvé</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (estScanne) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket déjà scanné</h2>
          <p className="text-gray-400">Ce ticket a déjà été utilisé.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              Votre <span className="text-yellow-400">Ticket</span>
            </h1>
            <p className="text-gray-500 text-xs">{typeTicket?.nom || 'Ticket'}</p>
          </div>
          <div className="w-20" />
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg mb-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-2 rounded-lg mb-3 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ============================================================
            TICKET HORIZONTAL
            ============================================================ */}
        <div 
          ref={ticketRef}
          className="relative rounded-xl overflow-hidden shadow-2xl w-full"
          style={{ 
            maxWidth: '800px', 
            marginLeft: 'auto', 
            marginRight: 'auto',
            aspectRatio: '16/9',
            minHeight: '280px'
          }}
        >
          {/* FOND : Affiche de l'événement */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: evenement?.affiche_url ? `url(${evenement.affiche_url})` : 'none',
              filter: 'blur(6px) brightness(0.25)',
              transform: 'scale(1.05)'
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Contenu */}
          <div className="relative z-10 p-3 md:p-4 h-full flex flex-col">
            
            {/* En-tête */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div 
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                  style={{ 
                    backgroundColor: typeTicket?.couleur || '#FFD700', 
                    color: '#000' 
                  }}
                >
                  {getIconeForCategorie(typeTicket?.categorie)}
                  <span>{typeTicket?.nom || 'TICKET'}</span>
                </div>
                {canRedownload() && (
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Admin/Pro
                  </span>
                )}
              </div>
              <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${status.bgColor} ${status.color} border ${status.borderColor}`}>
                {status.text}
              </div>
            </div>

            {/* Corps */}
            <div className="flex flex-1 gap-3 min-h-0">
              
              {/* Colonne gauche */}
              <div className="w-3/5 flex flex-col bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <h2 
                  className="text-white font-bold text-sm md:text-base lg:text-lg ticket-text"
                  style={{ 
                    lineHeight: '1.5',
                    height: 'auto',
                    overflow: 'visible',
                    paddingBottom: '2px',
                    wordBreak: 'break-word'
                  }}
                >
                  {evenement?.nom || 'Événement'}
                </h2>
                
                <div className="space-y-1 mt-1 text-gray-200 text-xs md:text-sm">
                  {evenement?.date && (
                    <div 
                      className="flex items-center gap-1.5 ticket-text"
                      style={{ lineHeight: '1.5', height: 'auto', overflow: 'visible' }}
                    >
                      <span className="text-yellow-400 text-sm">📅</span>
                      <span className="text-white font-medium text-xs md:text-sm">
                        {formatDate(evenement.date)} à {formatTime(evenement.date)}
                      </span>
                    </div>
                  )}
                  {evenement?.lieu && (
                    <div 
                      className="flex items-center gap-1.5 ticket-text"
                      style={{ lineHeight: '1.5', height: 'auto', overflow: 'visible' }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                      <span className="text-white font-medium text-xs md:text-sm">
                        {evenement.lieu}
                      </span>
                    </div>
                  )}
                  {evenement?.infos_lieu && (
                    <div 
                      className="text-yellow-400 text-[10px] md:text-xs font-medium mt-0.5 ticket-text"
                      style={{ lineHeight: '1.4', height: 'auto', overflow: 'visible', paddingBottom: '2px' }}
                    >
                      ℹ️ {evenement.infos_lieu}
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-yellow-400 text-[8px] flex items-center gap-1">
                      <CreditCard className="h-2.5 w-2.5" /> QR CODE
                    </p>
                    <p 
                      className="text-white/60 text-[8px] font-mono ticket-text"
                      style={{ lineHeight: '1.4', height: 'auto', overflow: 'visible', wordBreak: 'break-all' }}
                    >
                      {id}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl flex-shrink-0 ml-3">
                    <QRCodeSVG 
                      value={qrValue}
                      size={90}
                      level="H"
                      includeMargin={false}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="w-2/5 flex flex-col gap-2">
                <div className="flex-1 bg-black/40 backdrop-blur-sm rounded-xl p-2 border border-white/10 flex items-center justify-center min-h-[80px]">
                  {typeTicket?.image_url && !imageError ? (
                    <img 
                      src={typeTicket.image_url} 
                      alt={typeTicket.nom || 'Ticket'}
                      className="w-full h-full object-contain max-h-[100px]"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/40">
                      <Ticket className="h-8 w-8" />
                      <span className="text-[8px] mt-1">Image du ticket</span>
                    </div>
                  )}
                </div>

                {/* Infos acheteur */}
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2 border border-white/10">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {ticketData?.client_nom && (
                      <div className="col-span-2">
                        <p className="text-yellow-400 text-[8px]">ACHETEUR</p>
                        <p 
                          className="text-white text-xs font-medium ticket-text"
                          style={{ lineHeight: '1.5', height: 'auto', overflow: 'visible', wordBreak: 'break-word' }}
                        >
                          {ticketData.client_nom}
                        </p>
                      </div>
                    )}
                    {ticketData?.client_whatsapp && (
                      <div>
                        <p className="text-yellow-400 text-[8px]">WHATSAPP</p>
                        <p 
                          className="text-gray-300 text-[10px] ticket-text"
                          style={{ lineHeight: '1.4', height: 'auto', overflow: 'visible' }}
                        >
                          {ticketData.client_whatsapp}
                        </p>
                      </div>
                    )}
                    {ticketData?.montant && (
                      <div className="text-right">
                        <p className="text-yellow-400 text-[8px]">MONTANT</p>
                        <p 
                          className="text-yellow-400 font-bold text-xs ticket-text"
                          style={{ lineHeight: '1.4', height: 'auto', overflow: 'visible' }}
                        >
                          {ticketData.montant.toLocaleString()} FCFA
                        </p>
                      </div>
                    )}
                    {ticketData?.created_at && (
                      <div className="col-span-2">
                        <p className="text-yellow-400 text-[8px]">DATE D'ACHAT</p>
                        <p 
                          className="text-gray-300 text-[10px] ticket-text"
                          style={{ lineHeight: '1.4', height: 'auto', overflow: 'visible' }}
                        >
                          {formatDateTime(ticketData.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="mt-1.5 pt-1 border-t border-white/10 text-center">
              <p className="text-yellow-400 text-[10px] md:text-xs font-medium">
                FASO TICKET - Billetterie sécurisée
              </p>
              <p className="text-white/30 text-[7px]">
                Présentez ce ticket à l'entrée
              </p>
            </div>
          </div>
        </div>

        {/* ===== BOUTONS ===== */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          {/* Bouton Télécharger - Client normal */}
          {!canRedownload() && (
            <button
              onClick={handleDownload}
              disabled={downloading || estTelecharge || estScanne}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all text-sm ${
                estTelecharge || estScanne
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black'
              }`}
            >
              {downloading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Téléchargement...
                </>
              ) : estTelecharge ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Déjà téléchargé
                </>
              ) : estScanne ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Ticket scanné
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Télécharger le ticket
                </>
              )}
            </button>
          )}

          {/* Bouton Télécharger - Admin/Organisateur Premium (force) */}
          {canRedownload() && (
            <button
              onClick={handleForceDownload}
              disabled={downloading || estScanne}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all text-sm ${
                estScanne
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black'
              }`}
            >
              {downloading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Téléchargement...
                </>
              ) : estScanne ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Ticket scanné
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {estTelecharge ? 'Retélécharger' : 'Télécharger le ticket'}
                </>
              )}
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Accueil
          </button>
        </div>

        {estTelecharge && !canRedownload() && (
          <p className="text-gray-500 text-xs text-center mt-3">
            ⚠️ Ce ticket a déjà été téléchargé. Contactez l'organisateur si vous l'avez perdu.
          </p>
        )}
        {estTelecharge && canRedownload() && (
          <p className="text-blue-400 text-xs text-center mt-3">
            🔄 Téléchargement autorisé (Administrateur / Organisateur Premium)
          </p>
        )}
      </div>
    </div>
  );
};

export default TicketGenere;