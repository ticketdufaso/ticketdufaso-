-- ============================================================
-- DONNÉES DE TEST - FASO TICKET
-- ============================================================

-- 1. Créer un admin (à adapter avec l'ID réel depuis Auth)
-- INSERT INTO profiles (id, email, role, statut)
-- VALUES ('VOTRE_UUID_ICI', 'admin@fasoticket.com', 'admin', true);

-- 2. Créer des organisateurs de test
-- INSERT INTO profiles (id, email, structure, telephone, role, plan_id, plan_expire, statut)
-- VALUES 
-- ('UUID_ORGANISATEUR_1', 'organisateur1@test.com', 'Structure Test 1', '70123456', 'organisateur', 'Basique', NOW() + INTERVAL '30 days', true),
-- ('UUID_ORGANISATEUR_2', 'organisateur2@test.com', 'Structure Test 2', '70234567', 'organisateur', 'Premium', NOW() + INTERVAL '90 days', true);

-- 3. Créer des événements de test
-- INSERT INTO evenements (organisateur_id, nom, description, lieu, date, affiche_url, actif)
-- VALUES 
-- ('UUID_ORGANISATEUR_1', 'Concert de Jazz', 'Un concert de jazz exceptionnel', 'Ouagadougou', NOW() + INTERVAL '7 days', '/images/event1.jpg', true),
-- ('UUID_ORGANISATEUR_2', 'Festival de la Culture', 'Festival annuel de la culture burkinabè', 'Bobo-Dioulasso', NOW() + INTERVAL '14 days', '/images/event2.jpg', true);

-- 4. Créer des types de tickets
-- INSERT INTO types_tickets (evenement_id, categorie, nom, prix, stock, stock_initial, image_url, couleur)
-- VALUES 
-- ('EVENEMENT_UUID_1', 'Simple', 'Entrée Simple', 5000, 100, 100, '/images/ticket-simple.png', '#FFD700'),
-- ('EVENEMENT_UUID_1', 'VIP', 'Entrée VIP', 15000, 50, 50, '/images/ticket-vip.png', '#FF0000');

-- 5. Créer des commentaires de test
-- INSERT INTO commentaires (nom, note, commentaire, statut)
-- VALUES 
-- ('Jean Dupont', 5, 'Super événement ! Je recommande.', 'approuve'),
-- ('Marie Koné', 4, 'Très bonne organisation, un peu cher mais ça vaut le coup.', 'approuve');

-- ============================================================
-- FIN DES DONNÉES DE TEST
-- ============================================================