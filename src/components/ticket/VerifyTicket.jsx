/**
 * Page de vérification de ticket
 * Règles NASA 1-10
 * Sécurité niveau Google/Windows
 * Route: /verify/:id
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Loader, AlertCircle, ArrowLeft } from 'lucide-react';

const VerifyTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer le ticket
        const { data: vente, error: venteError } = await supabase
          .from('ventes')
          .select(`
            *,
            evenement:evenements(nom, date, lieu),
            type_ticket:types_tickets(nom, prix, image_url)
          `)
          .eq('id', id)
          .single();

        if (venteError || !vente) {
          setError('Ticket non trouvé');
          setLoading(false);
          return;
        }

        setTicket(vente);

        // 2. Vérifier si déjà scanné
        if (vente.est_scanner === true) {
          setIsScanned(true);
          setSuccess(false);
          setLoading(false);
          return;
        }

        // 3. Marquer comme scanné
        const { error: updateError } = await supabase
          .from('ventes')
          .update({
            est_scanner: true,
            date_scannage: new Date().toISOString(),
            statut: 'scanne'
          })
          .eq('id', id);

        if (updateError) {
          setError('Erreur lors de la validation du scan');
          setLoading(false);
          return;
        }

        setSuccess(true);
        setIsScanned(false);

      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur lors de la vérification');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      verifyTicket();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-12 h-12 text-yellow-400 animate-spin" />
        <p className="text-gray-400 mt-4">Vérification du ticket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket invalide</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (isScanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket déjà scanné</h2>
          <p className="text-gray-400">Ce ticket a déjà été utilisé.</p>
          <p className="text-gray-500 text-sm mt-2">
            Ticket: {ticket?.evenement?.nom || 'N/A'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-green-500/30 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">✅ Ticket validé !</h2>
          <p className="text-gray-300">Ce ticket est valide et vient d'être scanné.</p>
          
          {ticket && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 text-left">
              <p className="text-gray-400 text-sm">Détails du ticket :</p>
              <p className="text-white font-medium">{ticket.evenement?.nom || 'N/A'}</p>
              <p className="text-gray-400 text-sm">Acheteur : {ticket.client_nom || 'N/A'}</p>
              <p className="text-gray-400 text-sm">Montant : {ticket.montant?.toLocaleString() || '0'} FCFA</p>
              <p className="text-gray-400 text-sm">Type : {ticket.type_ticket?.nom || 'N/A'}</p>
              <p className="text-yellow-400 text-xs mt-2">ID : {ticket.id}</p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Loader className="w-12 h-12 text-yellow-400 animate-spin" />
    </div>
  );
};

export default VerifyTicket;