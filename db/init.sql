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
-- Caserne Carnot - Jours 1-15
('Caserne Carnot', CURRENT_DATE - INTERVAL '1 day', 'Tous les systèmes opérationnels, journée sans incident', 'Inspection matinale du poste de garde', 8, '92%', '88%', 'Stock complet', 'Inventaire complet', '3', '3', 'Maintenance de routine prévue'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '2 days', 'Exercice incendie réalisé avec succès', 'Point de rassemblement', 9, '89%', '91%', 'Provisions adéquates', 'Tout le matériel comptabilisé', '3', '3', 'Aucune action requise'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '3 days', 'Panne mineure du système de chauffage en cours de réparation', 'Salle des machines', 6, '87%', '85%', 'Niveau standard', 'Complet', '2', '3', 'Technicien chauffage prévu demain'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '4 days', 'Formation premiers secours dispensée à 12 sapeurs', 'Salle de formation', 8, '90%', '89%', 'Bien approvisionné', 'Armurerie sécurisée', '3', '3', 'Programmer prochaine session'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '5 days', 'Inspection de la citerne d''eau effectuée', 'Local technique eau', 7, '85%', '82%', 'Provisions correctes', 'Inventaire à jour', '3', '3', 'Surveiller qualité eau'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '6 days', 'Réception et stockage du carburant hebdomadaire', 'Dépôt carburant', 9, '98%', '87%', 'Stock plein', 'Matériel complet', '3', '3', 'Opérations standard'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '7 days', 'Contrôle de sécurité trimestriel réussi', 'Ensemble de la caserne', 9, '91%', '90%', 'Inventaire complet', 'Tout opérationnel', '3', '3', 'Aucune action requise'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '8 days', 'Remplacement des ampoules dans le couloir principal', 'Bâtiment principal', 7, '88%', '88%', 'Niveau adéquat', 'Complet', '3', '3', 'Vérifier autres éclairages'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '9 days', 'Exercice de manœuvre nocturne effectué', 'Cour de la caserne', 8, '86%', '89%', 'Bien stocké', 'Armurerie sécurisée', '3', '3', 'Débriefing prévu'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '10 days', 'Entretien des véhicules d''intervention réalisé', 'Parc véhicules', 8, '93%', '87%', 'Provisions suffisantes', 'Matériel comptabilisé', '3', '3', 'Prochaine révision dans 30 jours'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '11 days', 'Installation de nouveaux casiers dans le vestiaire', 'Vestiaires', 7, '89%', '86%', 'Stock standard', 'Complet', '2', '3', 'Finaliser aménagement vestiaires'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '12 days', 'Tous systèmes au vert, moral des troupes excellent', 'Réfectoire', 9, '90%', '91%', 'Bien approvisionné', 'Tout opérationnel', '3', '3', 'Maintenir les standards'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '13 days', 'Révision du système de climatisation', 'Locaux techniques', 7, '87%', '88%', 'Niveau correct', 'Inventaire à jour', '3', '3', 'Surveiller performance clim'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '14 days', 'Test des groupes électrogènes de secours concluant', 'Salle électrique', 8, '91%', '89%', 'Provisions adéquates', 'Armurerie sécurisée', '3', '3', 'Prochain test dans 3 mois'),
('Caserne Carnot', CURRENT_DATE - INTERVAL '15 days', 'Journée portes ouvertes, accueil du public réussi', 'Hall d''accueil', 9, '88%', '90%', 'Stock plein', 'Matériel complet', '3', '3', 'Organiser prochaine JPO'),

-- Caserne Dupleix - Jours 1-15
('Caserne Dupleix', CURRENT_DATE - INTERVAL '1 day', 'Fuite d''eau réparée dans les douches du rez-de-chaussée', 'Sanitaires RDC', 6, '84%', '78%', 'Manque produits frais', 'Inventaire complet', '2', '3', 'Commander provisions fraîches'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '2 days', 'Installation d''un nouveau système de vidéosurveillance', 'Poste de sécurité', 8, '88%', '85%', 'Niveau standard', 'Complet', '3', '3', 'Formation sur nouveau système'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '3 days', 'Manœuvre conjointe avec Caserne Foch, excellente coordination', 'Terrain de manœuvre', 9, '90%', '87%', 'Bien approvisionné', 'Tout le matériel comptabilisé', '3', '3', 'Planifier prochain exercice'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '4 days', 'Contrôle sanitaire de la cuisine, résultats satisfaisants', 'Cuisine', 8, '86%', '89%', 'Provisions correctes', 'Armurerie sécurisée', '3', '3', 'Prochain contrôle dans 6 mois'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '5 days', 'Porte du hangar nord réparée suite aux intempéries', 'Hangar nord', 7, '87%', '86%', 'Stock adéquat', 'Inventaire à jour', '3', '3', 'Surveiller étanchéité'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '6 days', 'Livraison de matériel médical, inventaire mis à jour', 'Infirmerie', 8, '85%', '88%', 'Bien stocké', 'Matériel complet', '3', '3', 'Vérification stocks médicaux'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '7 days', 'Peinture des bureaux administratifs terminée', 'Bureaux admin', 7, '89%', '84%', 'Niveau correct', 'Complet', '2', '3', 'Aération des locaux 48h'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '8 days', 'Session de sport collectif, bonne participation', 'Salle de sport', 8, '91%', '90%', 'Provisions suffisantes', 'Armurerie sécurisée', '3', '3', 'Organiser événements réguliers'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '9 days', 'Tous les systèmes opérationnels, aucun incident', 'Ronde de sécurité', 8, '88%', '87%', 'Bien approvisionné', 'Tout opérationnel', '3', '3', 'Continuer surveillance'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '10 days', 'Nettoyage des filtres du système de ventilation', 'Toiture', 7, '86%', '89%', 'Stock standard', 'Inventaire complet', '3', '3', 'Prochain nettoyage dans 3 mois'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '11 days', 'Audit de sécurité passé avec recommandations mineures', 'Tous secteurs', 7, '90%', '85%', 'Niveau adéquat', 'Complet', '3', '3', 'Appliquer recommandations audit'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '12 days', 'Remise de médailles, cérémonie réussie', 'Cour d''honneur', 9, '87%', '88%', 'Provisions correctes', 'Armurerie sécurisée', '3', '3', 'Archiver photos cérémonie'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '13 days', 'Réparation du toit du garage, travaux achevés', 'Garage', 8, '89%', '86%', 'Bien stocké', 'Matériel comptabilisé', '3', '3', 'Vérifier étanchéité après pluie'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '14 days', 'Formation aux nouvelles procédures radio', 'Salle de briefing', 8, '85%', '90%', 'Stock plein', 'Tout opérationnel', '3', '3', 'Test procédures en situation'),
('Caserne Dupleix', CURRENT_DATE - INTERVAL '15 days', 'Installation de nouvelles douches dans le vestiaire B', 'Vestiaire B', 7, '88%', '82%', 'Provisions adéquates', 'Inventaire à jour', '2', '3', 'Finaliser travaux plomberie'),

-- Caserne Foch - Jours 1-15
('Caserne Foch', CURRENT_DATE - INTERVAL '1 day', 'État impeccable, inspection surprise réussie', 'Vue d''ensemble', 9, '94%', '92%', 'Inventaire complet', 'Tout opérationnel', '3', '3', 'Félicitations à l''équipe'),
('Caserne Foch', CURRENT_DATE - INTERVAL '2 days', 'Maintenance préventive des pompes à incendie', 'Local pompes', 8, '90%', '89%', 'Bien approvisionné', 'Matériel complet', '3', '3', 'Prochain contrôle dans 6 mois'),
('Caserne Foch', CURRENT_DATE - INTERVAL '3 days', 'Problème électrique résolu dans l''aile est', 'Aile est', 7, '87%', '88%', 'Niveau standard', 'Complet', '2', '3', 'Surveiller installation électrique'),
('Caserne Foch', CURRENT_DATE - INTERVAL '4 days', 'Exercice d''évacuation, temps record battu', 'Points de rassemblement', 9, '91%', '90%', 'Provisions correctes', 'Armurerie sécurisée', '3', '3', 'Documenter les meilleures pratiques'),
('Caserne Foch', CURRENT_DATE - INTERVAL '5 days', 'Réception de nouveaux uniformes, distribution effectuée', 'Magasin d''habillement', 8, '88%', '87%', 'Stock adéquat', 'Inventaire à jour', '3', '3', 'Mettre à jour registre vestimentaire'),
('Caserne Foch', CURRENT_DATE - INTERVAL '6 days', 'Nettoyage complet des locaux, excellente propreté', 'Tous bâtiments', 9, '89%', '91%', 'Bien stocké', 'Tout comptabilisé', '3', '3', 'Maintenir niveau de propreté'),
('Caserne Foch', CURRENT_DATE - INTERVAL '7 days', 'Test du système d''alarme incendie concluant', 'Centrale d''alarme', 8, '92%', '88%', 'Provisions suffisantes', 'Matériel complet', '3', '3', 'Prochain test dans 3 mois'),
('Caserne Foch', CURRENT_DATE - INTERVAL '8 days', 'Visite d''une délégation, présentation de la caserne', 'Salle de réception', 8, '86%', '89%', 'Niveau correct', 'Armurerie sécurisée', '3', '3', 'Préparer dossier de suivi'),
('Caserne Foch', CURRENT_DATE - INTERVAL '9 days', 'Changement des filtres à air dans tous les bâtiments', 'Système ventilation', 7, '90%', '85%', 'Stock standard', 'Complet', '3', '3', 'Commander nouveaux filtres'),
('Caserne Foch', CURRENT_DATE - INTERVAL '10 days', 'Formation continue du personnel, excellente assiduité', 'Centre de formation', 9, '87%', '90%', 'Bien approvisionné', 'Inventaire complet', '3', '3', 'Planifier module suivant'),
('Caserne Foch', CURRENT_DATE - INTERVAL '11 days', 'Inspection des extincteurs, tous conformes', 'Tous secteurs', 8, '89%', '87%', 'Provisions adéquates', 'Tout opérationnel', '3', '3', 'Prochain contrôle dans 1 an'),
('Caserne Foch', CURRENT_DATE - INTERVAL '12 days', 'Réparation de la clôture périmétrique achevée', 'Périmètre', 7, '91%', '88%', 'Niveau standard', 'Matériel comptabilisé', '2', '3', 'Surveiller intégrité clôture'),
('Caserne Foch', CURRENT_DATE - INTERVAL '13 days', 'Journée cohésion d''équipe, moral excellent', 'Espace détente', 9, '88%', '91%', 'Stock plein', 'Armurerie sécurisée', '3', '3', 'Organiser prochaine activité'),
('Caserne Foch', CURRENT_DATE - INTERVAL '14 days', 'Mise à jour du logiciel de gestion des interventions', 'Salle informatique', 8, '90%', '86%', 'Bien stocké', 'Inventaire à jour', '3', '3', 'Former personnel au nouveau logiciel'),
('Caserne Foch', CURRENT_DATE - INTERVAL '15 days', 'Tous les systèmes opérationnels, situation nominale', 'Inspection quotidienne', 8, '92%', '89%', 'Provisions correctes', 'Tout opérationnel', '3', '3', 'Poursuivre opérations standard');

-- Vérifier les données
/*
SELECT COUNT(*) as nombre_total_enregistrements FROM building_reports;
SELECT building_name, COUNT(*) as nombre_rapports FROM building_reports GROUP BY building_name;
SELECT MIN(report_date) as rapport_plus_ancien, MAX(report_date) as rapport_plus_recent FROM building_reports;
*/