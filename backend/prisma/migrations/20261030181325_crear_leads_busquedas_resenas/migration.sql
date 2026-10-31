-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "autor" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_extern" TEXT NOT NULL,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resenas_lead_id_fecha_idx" ON "resenas"("lead_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "resenas_lead_id_id_extern_key" ON "resenas"("lead_id", "id_extern"); -- evitamos guardar la misma reseña 2 veces

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
