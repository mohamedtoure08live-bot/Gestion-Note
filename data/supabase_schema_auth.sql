-- ==============================================================================
-- GHIM PRO — EPS Notation & Barèmes
-- Migration SQL : Table Professeurs, Index d'Unicité E-mail & Politiques RLS
-- ==============================================================================

-- 1. Table des Professeurs (Espace Enseignant EPS)
CREATE TABLE IF NOT EXISTS public.professeurs (
    id TEXT PRIMARY KEY, -- Correspond à auth.uid() de Supabase Auth
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    email VARCHAR(255) NOT NULL,
    etablissement VARCHAR(150) NOT NULL,
    telephone VARCHAR(30),
    role VARCHAR(30) DEFAULT 'professeur' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Index d'unicité strict sur l'e-mail normalisé (Anti-Doublon au niveau Base de Données)
-- Empêche deux inscriptions avec la même adresse e-mail, quelle que soit la casse ou les espaces
CREATE UNIQUE INDEX IF NOT EXISTS idx_professeurs_email_unique 
ON public.professeurs (LOWER(TRIM(email)));

-- 3. Activation de la Sécurité au Niveau des Lignes (Row Level Security - RLS)
ALTER TABLE public.professeurs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : Un professeur peut lire son propre profil
CREATE POLICY "Les professeurs peuvent lire leur propre profil"
ON public.professeurs
FOR SELECT
USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- Politique d'insertion : Un professeur ne peut insérer que son propre enregistrement correspondant à son UID Auth
CREATE POLICY "Les professeurs peuvent créer leur propre profil"
ON public.professeurs
FOR INSERT
WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

-- Politique de mise à jour : Un professeur ne peut modifier que ses propres données
CREATE POLICY "Les professeurs peuvent mettre à jour leur profil"
ON public.professeurs
FOR UPDATE
USING (auth.uid()::text = id OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = id OR auth.role() = 'service_role');

-- 4. Protection et Isolation des Données Enseignant dans les tables associées

-- Table Classes : Isolation stricte par professeur
ALTER TABLE IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Isolation des classes par professeur"
ON public.classes
FOR ALL
USING (professeur_id = auth.uid()::text OR auth.role() = 'service_role');

-- Table Élèves : Isolation stricte par professeur
ALTER TABLE IF EXISTS public.eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Isolation des eleves par professeur"
ON public.eleves
FOR ALL
USING (professeur_id = auth.uid()::text OR auth.role() = 'service_role');

-- Table Évaluations : Isolation stricte par professeur
ALTER TABLE IF EXISTS public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Isolation des evaluations par professeur"
ON public.evaluations
FOR ALL
USING (professeur_id = auth.uid()::text OR auth.role() = 'service_role');

-- Table Barèmes : Sanctuaire officiel + Barèmes personnalisés privés
ALTER TABLE IF EXISTS public.baremes ENABLE ROW LEVEL SECURITY;

-- Tout le monde authentifié ou invité peut lire les barèmes officiels
CREATE POLICY IF NOT EXISTS "Lecture des baremes officiels pour tous"
ON public.baremes
FOR SELECT
USING (is_official = TRUE OR professeur_id = auth.uid()::text);

-- Seul le propriétaire peut modifier ou supprimer son barème personnalisé
CREATE POLICY IF NOT EXISTS "Gestion des baremes personnalises"
ON public.baremes
FOR ALL
USING (is_official = FALSE AND professeur_id = auth.uid()::text);

-- 5. Trigger d'auto-création de profil depuis Supabase Auth (Optionnel)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.professeurs (id, nom, prenom, email, etablissement, telephone, role)
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'nom', 'Enseignant'),
    COALESCE(new.raw_user_meta_data->>'prenom', 'Professeur'),
    LOWER(TRIM(new.email)),
    COALESCE(new.raw_user_meta_data->>'etablissement', 'Établissement Scolaire'),
    NULLIF(TRIM(new.raw_user_meta_data->>'telephone'), ''),
    'professeur'
  )
  ON CONFLICT (LOWER(TRIM(email))) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
