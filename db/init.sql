-- Create database (run this separately if needed)
-- CREATE DATABASE building_reports;

-- Connect to the database
-- \c building_reports

-- Create the main table for building reports
CREATE TABLE IF NOT EXISTS building_reports (
    id SERIAL PRIMARY KEY,
    building_name VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    commander_note TEXT,
    photo_caption TEXT,
    satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 10),
    fuel VARCHAR(100),
    water VARCHAR(100),
    provisions VARCHAR(100),
    armament VARCHAR(100),
    defibrillators_available VARCHAR(50),
    defibrillators_total VARCHAR(50),
    prevision_j1 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on building_name and report_date for faster queries
CREATE INDEX idx_building_reports_name_date ON building_reports(building_name, report_date);

-- Create an index on report_date for date-based queries
CREATE INDEX idx_building_reports_date ON building_reports(report_date);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before updates
CREATE TRIGGER update_building_reports_updated_at
    BEFORE UPDATE ON building_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer 15 jours de données pour 3 casernes (45 entrées au total)
INSERT INTO building_reports (
    building_name,
    report_date,
    commander_note,
    photo_caption,
    satisfaction,
    fuel,
    water,
    provisions,
    armament,
    defibrillators_available,
    defibrillators_total,
    prevision_j1
) VALUES
-- Charles de Gaulle - BON ÉTAT (satisfaction 8-10)
('Charles de Gaulle', CURRENT_DATE - INTERVAL '1 day', 'Tous les systèmes opérationnels, journée sans incident', 'Inspection matinale du poste de garde', 9, '15', '16', '12', 'Inventaire complet', '3', '3', 'Maintenance de routine prévue'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '2', 'Exercice incendie réalisé avec succès', 'Point de rassemblement', 9, '14', '15', '11', 'Tout le matériel comptabilisé', '3', '3', 'Aucune action requise'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '3', 'Tous les systèmes fonctionnent normalement', 'Salle des machines', 8, '13', '14', '10', 'Complet', '3', '3', 'Opérations standard'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '4', 'Formation premiers secours dispensée à 12 sapeurs', 'Salle de formation', 9, '15', '16', '13', 'Armurerie sécurisée', '3', '3', 'Programmer prochaine session'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '5', 'Inspection de la citerne d''eau effectuée, tout conforme', 'Local technique eau', 8, '12', '17', '9', 'Inventaire à jour', '3', '3', 'Surveillance routine'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '6', 'Réception et stockage du carburant hebdomadaire', 'Dépôt carburant', 9, '18', '15', '14', 'Matériel complet', '3', '3', 'Opérations standard'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '7', 'Contrôle de sécurité trimestriel réussi', 'Ensemble de la caserne', 9, '16', '16', '13', 'Tout opérationnel', '3', '3', 'Aucune action requise'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '8', 'Tous les équipements en excellent état', 'Bâtiment principal', 9, '14', '14', '11', 'Complet', '3', '3', 'Entretien régulier'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '9', 'Exercice de manœuvre nocturne effectué sans problème', 'Cour de la caserne', 8, '13', '15', '10', 'Armurerie sécurisée', '3', '3', 'Débriefing excellent'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '10', 'Entretien des véhicules d''intervention réalisé', 'Parc véhicules', 9, '17', '13', '12', 'Matériel comptabilisé', '3', '3', 'Prochaine révision dans 30 jours'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '11', 'Infrastructure en très bon état', 'Vestiaires', 8, '14', '12', '9', 'Complet', '3', '3', 'Aménagement parfait'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '12', 'Tous systèmes au vert, moral des troupes excellent', 'Réfectoire', 9, '15', '16', '13', 'Tout opérationnel', '3', '3', 'Maintenir les standards'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '13', 'Révision du système de climatisation réussie', 'Locaux techniques', 8, '13', '14', '10', 'Inventaire à jour', '3', '3', 'Performance optimale'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '14', 'Test des groupes électrogènes de secours concluant', 'Salle électrique', 9, '16', '15', '12', 'Armurerie sécurisée', '3', '3', 'Prochain test dans 3 mois'),
('Charles de Gaulle', CURRENT_DATE - INTERVAL '15', 'Journée portes ouvertes, accueil du public réussi', 'Hall d''accueil', 9, '14', '17', '14', 'Matériel complet', '3', '3', 'Organiser prochaine JPO'),

-- PHA Mistral - ÉTAT MOYEN (satisfaction 5-7)
('PHA Mistral', CURRENT_DATE - INTERVAL '1 day', 'Plusieurs problèmes mineurs signalés', 'Sanitaires RDC', 6, '7', '6', '4', 'Inventaire complet', '2', '3', 'Réparations à programmer'),
('PHA Mistral', CURRENT_DATE - INTERVAL '2', 'Système de vidéosurveillance partiellement opérationnel', 'Poste de sécurité', 6, '8', '7', '5', 'Complet', '2', '3', 'Dépannage prévu'),
('PHA Mistral', CURRENT_DATE - INTERVAL '3', 'Manœuvre effectuée mais avec quelques soucis de coordination', 'Terrain de manœuvre', 6, '9', '8', '6', 'Matériel partiellement comptabilisé', '2', '3', 'Amélioration requise'),
('PHA Mistral', CURRENT_DATE - INTERVAL '4', 'Contrôle sanitaire de la cuisine, résultats acceptables', 'Cuisine', 6, '8', '10', '6', 'Armurerie sécurisée', '2', '3', 'Amélioration hygiène'),
('PHA Mistral', CURRENT_DATE - INTERVAL '5', 'Porte du hangar nord réparée mais éclairages défaillants', 'Hangar nord', 5, '9', '9', '5', 'Inventaire partiel', '2', '3', 'Travaux électriques urgents'),
('PHA Mistral', CURRENT_DATE - INTERVAL '6', 'Livraison de matériel médical, stocks insuffisants', 'Infirmerie', 6, '7', '9', '4', 'Matériel incomplet', '2', '3', 'Commande urgente'),
('PHA Mistral', CURRENT_DATE - INTERVAL '7', 'Peinture des bureaux effectuée mais qualité médiocre', 'Bureaux admin', 5, '8', '6', '3', 'Complet', '1', '3', 'Retouches nécessaires'),
('PHA Mistral', CURRENT_DATE - INTERVAL '8', 'Participation faible aux activités de sport collectif', 'Salle de sport', 6, '10', '11', '7', 'Armurerie sécurisée', '2', '3', 'Motivation du personnel'),
('PHA Mistral', CURRENT_DATE - INTERVAL '9', 'Deux incidents mineurs rapportés aujourd''hui', 'Ronde de sécurité', 6, '8', '8', '6', 'Opérationnel avec lacunes', '2', '3', 'Vigilance accrue'),
('PHA Mistral', CURRENT_DATE - INTERVAL '10', 'Nettoyage des filtres du système de ventilation nécessaire', 'Toiture', 5, '7', '10', '5', 'Inventaire incomplet', '2', '3', 'Maintenance urgente'),
('PHA Mistral', CURRENT_DATE - INTERVAL '11', 'Audit de sécurité passé avec recommandations importantes', 'Tous secteurs', 5, '9', '7', '5', 'Complet', '1', '3', 'Appliquer recommandations rapidement'),
('PHA Mistral', CURRENT_DATE - INTERVAL '12', 'Cérémonie réussie mais problèmes d''organisation', 'Cour d''honneur', 6, '8', '9', '6', 'Armurerie sécurisée', '2', '3', 'Améliorer protocoles'),
('PHA Mistral', CURRENT_DATE - INTERVAL '13', 'Réparation du toit terminée mais suivi nécessaire', 'Garage', 6, '9', '8', '5', 'Matériel comptabilisé', '2', '3', 'Surveillance étroite'),
('PHA Mistral', CURRENT_DATE - INTERVAL '14', 'Formation aux procédures radio, compréhension partielle', 'Salle de briefing', 6, '7', '11', '7', 'Opérationnel', '2', '3', 'Formations supplémentaires'),
('PHA Mistral', CURRENT_DATE - INTERVAL '15', 'Installation de douches inachevée, retard accumulé', 'Vestiaire B', 5, '8', '5', '2', 'Inventaire à jour', '1', '3', 'Accélérer fin travaux'),

-- La Provence - MAUVAIS ÉTAT (satisfaction 3-5)
('La Provence', CURRENT_DATE - INTERVAL '1 day', 'État critique détecté lors inspection, multiples défaillances', 'Vue d''ensemble', 3, '5', '4', '2', 'Très insuffisant', '0', '3', 'Intervention urgente requise'),
('La Provence', CURRENT_DATE - INTERVAL '2', 'Maintenance des pompes à incendie non effectuée', 'Local pompes', 4, '6', '5', '3', 'Matériel incomplet', '1', '3', 'Inspection critique'),
('La Provence', CURRENT_DATE - INTERVAL '3', 'Problème électrique récurrent dans l''aile est non résolu', 'Aile est', 3, '5', '6', '4', 'Incomplet', '0', '3', 'Électricien urgence'),
('La Provence', CURRENT_DATE - INTERVAL '4', 'Exercice d''évacuation chaotique, beaucoup de confusion', 'Points de rassemblement', 4, '7', '8', '5', 'Armurerie désorganisée', '1', '3', 'Réentraînement immédiat'),
('La Provence', CURRENT_DATE - INTERVAL '5', 'Distribution de nouveaux uniformes incomplète', 'Magasin d''habillement', 3, '6', '7', '4', 'Inventaire confus', '1', '3', 'Reorganiser stocks'),
('La Provence', CURRENT_DATE - INTERVAL '6', 'Locaux sales, standard d''hygiène non respecté', 'Tous bâtiments', 3, '5', '8', '4', 'Comptabilité lacunaire', '0', '3', 'Nettoyage professionnel urgent'),
('La Provence', CURRENT_DATE - INTERVAL '7', 'Test du système d''alarme incendie en échec', 'Centrale d''alarme', 2, '6', '6', '3', 'Matériel défaillant', '0', '3', 'Remplacement système immédiat'),
('La Provence', CURRENT_DATE - INTERVAL '8', 'Visite délégation annulée, caserne non présentable', 'Salle de réception', 3, '5', '7', '4', 'Armurerie insécurisée', '1', '3', 'Interventions prioritaires'),
('La Provence', CURRENT_DATE - INTERVAL '9', 'Changement des filtres non effectué, air pollué', 'Système ventilation', 3, '7', '5', '3', 'Complet', '1', '3', 'Nettoyage système urgence'),
('La Provence', CURRENT_DATE - INTERVAL '10', 'Formation continue peu suivie, absentéisme signalé', 'Centre de formation', 4, '5', '9', '5', 'Inventaire défaillant', '1', '3', 'Renforcer discipline'),
('La Provence', CURRENT_DATE - INTERVAL '11', 'Inspection des extincteurs, beaucoup non conformes', 'Tous secteurs', 3, '7', '6', '4', 'Peu opérationnel', '0', '3', 'Remplacement complet'),
('La Provence', CURRENT_DATE - INTERVAL '12', 'Clôture périmétrique endommagée, sécurité compromise', 'Périmètre', 2, '8', '7', '3', 'Matériel comptabilisé', '0', '3', 'Réparation critique'),
('La Provence', CURRENT_DATE - INTERVAL '13', 'Moral des troupes très bas, ambiance détériorée', 'Espace détente', 3, '6', '10', '4', 'Armurerie mal entretenue', '1', '3', 'Intervention management'),
('La Provence', CURRENT_DATE - INTERVAL '14', 'Logiciel de gestion des interventions ne fonctionne plus', 'Salle informatique', 3, '5', '6', '4', 'Inventaire désorganisé', '1', '3', 'Support informatique urgent'),
('La Provence', CURRENT_DATE - INTERVAL '15', 'Situation dégradée, plusieurs systèmes défaillants', 'Inspection quotidienne', 2, '6', '5', '2', 'Peu opérationnel', '0', '3', 'Plan de redressement requis');

-- Vérifier les données
/*
SELECT COUNT(*) as nombre_total_enregistrements FROM building_reports;
SELECT building_name, COUNT(*) as nombre_rapports FROM building_reports GROUP BY building_name;
SELECT MIN(report_date) as rapport_plus_ancien, MAX(report_date) as rapport_plus_recent FROM building_reports;
*/