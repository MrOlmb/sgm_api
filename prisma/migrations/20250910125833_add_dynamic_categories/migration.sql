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

-- DropEnum
DROP TYPE "TypeDocumentOfficiel";

-- AlterTable
ALTER TABLE "TexteOfficiel" DROP COLUMN "type_document",
ADD COLUMN     "id_categorie" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TexteOfficiel" ADD CONSTRAINT "TexteOfficiel_id_categorie_fkey" FOREIGN KEY ("id_categorie") REFERENCES "CategorieTexteOfficiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
