-- Agregar restricción CHECK para que el rating de leads esté entre 1 y 5
ALTER TABLE "leads" ADD CONSTRAINT "leads_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);

-- Agregar restricción CHECK para que el rating de resenas esté entre 1 y 5
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);

-- CreateEnum
CREATE TYPE "FuenteResena" AS ENUM ('google_maps', 'yelp', 'tripadvisor');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "rubro" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "resenas" ADD COLUMN     "fuente" "FuenteResena" NOT NULL;

-- CreateIndex
CREATE INDEX "leads_rubro_idx" ON "leads"("rubro");
