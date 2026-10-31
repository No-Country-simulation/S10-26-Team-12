-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('nuevo', 'contactado', 'interesado', 'no_responde', 'ganado', 'perdido', 'descartado');

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "place_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "estado" "EstadoLead" NOT NULL DEFAULT 'nuevo',
    "rating" DOUBLE PRECISION NOT NULL,
    "review_count" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_ultimo_contacto" TIMESTAMP(3),
    "contactado_por" INTEGER,
    "problema" TEXT,
    "problema_resumen" TEXT,
    "hash_resenas" TEXT,
    "asunto_mail" TEXT,
    "contenido_mail" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "busquedas" (
    "id" SERIAL NOT NULL,
    "search_key" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "lat_min" DOUBLE PRECISION NOT NULL,
    "long_min" DOUBLE PRECISION NOT NULL,
    "lat_max" DOUBLE PRECISION NOT NULL,
    "long_max" DOUBLE PRECISION NOT NULL,
    "ultima_corrida" TIMESTAMP(3),

    CONSTRAINT "busquedas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_place_id_key" ON "leads"("place_id");

-- CreateIndex
CREATE INDEX "leads_pais_idx" ON "leads"("pais");

-- CreateIndex
CREATE INDEX "leads_ciudad_idx" ON "leads"("ciudad");

-- CreateIndex
CREATE INDEX "leads_estado_idx" ON "leads"("estado");

-- CreateIndex
CREATE INDEX "leads_rating_idx" ON "leads"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "busquedas_search_key_key" ON "busquedas"("search_key");

-- CreateIndex
CREATE INDEX "busquedas_pais_ciudad_idx" ON "busquedas"("pais", "ciudad");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactado_por_fkey" FOREIGN KEY ("contactado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
