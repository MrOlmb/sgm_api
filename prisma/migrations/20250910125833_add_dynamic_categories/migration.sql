-- CreateTable
CREATE TABLE "CategorieTexteOfficiel" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "cree_par" TEXT NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMP(3) NOT NULL,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategorieTexteOfficiel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategorieTexteOfficiel_nom_key" ON "CategorieTexteOfficiel"("nom");

-- AddForeignKey
ALTER TABLE "CategorieTexteOfficiel" ADD CONSTRAINT "CategorieTexteOfficiel_cree_par_fkey" FOREIGN KEY ("cree_par") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default categories based on existing enum values
INSERT INTO "CategorieTexteOfficiel" ("id", "nom", "description", "cree_par", "cree_le", "modifie_le", "est_actif")
SELECT 
    gen_random_uuid()::text as "id",
    CASE 
        WHEN "type_document" = 'STATUTS' THEN 'Statuts'
        WHEN "type_document" = 'REGLEMENT_INTERIEUR' THEN 'Règlement Intérieur'
        WHEN "type_document" = 'PROCES_VERBAL' THEN 'Procès-Verbal'
        WHEN "type_document" = 'CIRCULAIRE' THEN 'Circulaire'
        WHEN "type_document" = 'DECISION' THEN 'Décision'
        WHEN "type_document" = 'AUTRE' THEN 'Autre'
        ELSE 'Autre'
    END as "nom",
    CASE 
        WHEN "type_document" = 'STATUTS' THEN 'Statuts de l''association'
        WHEN "type_document" = 'REGLEMENT_INTERIEUR' THEN 'Règlement intérieur de l''association'
        WHEN "type_document" = 'PROCES_VERBAL' THEN 'Procès-verbaux des réunions'
        WHEN "type_document" = 'CIRCULAIRE' THEN 'Circulaires et communications'
        WHEN "type_document" = 'DECISION' THEN 'Décisions et résolutions'
        WHEN "type_document" = 'AUTRE' THEN 'Autres documents officiels'
        ELSE 'Autres documents officiels'
    END as "description",
    (SELECT "id" FROM "Utilisateur" WHERE "role" = 'SECRETAIRE_GENERALE' LIMIT 1) as "cree_par",
    CURRENT_TIMESTAMP as "cree_le",
    CURRENT_TIMESTAMP as "modifie_le",
    true as "est_actif"
FROM "TexteOfficiel" 
WHERE "type_document" IS NOT NULL
GROUP BY "type_document";

-- Add id_categorie column as nullable first
ALTER TABLE "TexteOfficiel" ADD COLUMN "id_categorie" TEXT;

-- Update existing records to link to appropriate categories
UPDATE "TexteOfficiel" 
SET "id_categorie" = (
    SELECT "id" FROM "CategorieTexteOfficiel" 
    WHERE "nom" = CASE 
        WHEN "TexteOfficiel"."type_document" = 'STATUTS' THEN 'Statuts'
        WHEN "TexteOfficiel"."type_document" = 'REGLEMENT_INTERIEUR' THEN 'Règlement Intérieur'
        WHEN "TexteOfficiel"."type_document" = 'PROCES_VERBAL' THEN 'Procès-Verbal'
        WHEN "TexteOfficiel"."type_document" = 'CIRCULAIRE' THEN 'Circulaire'
        WHEN "TexteOfficiel"."type_document" = 'DECISION' THEN 'Décision'
        WHEN "TexteOfficiel"."type_document" = 'AUTRE' THEN 'Autre'
        ELSE 'Autre'
    END
    LIMIT 1
)
WHERE "type_document" IS NOT NULL;

-- Make id_categorie NOT NULL after data migration
ALTER TABLE "TexteOfficiel" ALTER COLUMN "id_categorie" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "TexteOfficiel" ADD CONSTRAINT "TexteOfficiel_id_categorie_fkey" FOREIGN KEY ("id_categorie") REFERENCES "CategorieTexteOfficiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Now safe to drop the old column
ALTER TABLE "TexteOfficiel" DROP COLUMN "type_document";

-- DropEnum
DROP TYPE "TypeDocumentOfficiel";
