-- Up Migration
-- Esquema inicial de RepuSense (tarjeta C2).
-- Es el equivalente en SQL de backend/prisma/schema.prisma: mismos nombres de tablas, columnas,
-- tipos, enums e índices, para que Prisma Client funcione sin cambios sobre estas tablas.
-- Está escrito para poder correrse aunque las tablas ya existan (por ejemplo, bases locales que
-- se crearon antes con Prisma): en ese caso no pisa nada.

-- Enums (los nombres llevan mayúsculas porque así los espera Prisma)
DO $$ BEGIN
    CREATE TYPE "EstadoLead" AS ENUM ('nuevo', 'contactado', 'interesado', 'no_responde', 'ganado', 'perdido', 'descartado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "FuenteResena" AS ENUM ('google_maps', 'yelp', 'tripadvisor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- usuarios
CREATE TABLE IF NOT EXISTS "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");

-- leads
CREATE TABLE IF NOT EXISTS "leads" (
    "id" SERIAL NOT NULL,
    "place_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
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
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leads_contactado_por_fkey" FOREIGN KEY ("contactado_por")
        REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "leads_place_id_key" ON "leads"("place_id");

-- Índices de leads: los usan los filtros de GET /leads (país, ciudad, estado, rating) y el rubro
CREATE INDEX IF NOT EXISTS "leads_pais_idx" ON "leads"("pais");
CREATE INDEX IF NOT EXISTS "leads_ciudad_idx" ON "leads"("ciudad");
CREATE INDEX IF NOT EXISTS "leads_estado_idx" ON "leads"("estado");
CREATE INDEX IF NOT EXISTS "leads_rubro_idx" ON "leads"("rubro");
CREATE INDEX IF NOT EXISTS "leads_rating_idx" ON "leads"("rating");

-- busquedas (lat/long = rectángulo geográfico de la ciudad)
CREATE TABLE IF NOT EXISTS "busquedas" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "busquedas_search_key_key" ON "busquedas"("search_key");
CREATE INDEX IF NOT EXISTS "busquedas_pais_ciudad_idx" ON "busquedas"("pais", "ciudad");

-- resenas
CREATE TABLE IF NOT EXISTS "resenas" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "autor" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_extern" TEXT NOT NULL,
    "fuente" "FuenteResena" NOT NULL,
    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resenas_lead_id_fkey" FOREIGN KEY ("lead_id")
        REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Una misma reseña (lead + id externo) no se puede guardar dos veces
CREATE UNIQUE INDEX IF NOT EXISTS "resenas_lead_id_id_extern_key" ON "resenas"("lead_id", "id_extern");
CREATE INDEX IF NOT EXISTS "resenas_lead_id_fecha_idx" ON "resenas"("lead_id", "fecha");

-- Down Migration
-- Borra todo lo que creó el Up, en orden inverso por las claves foráneas.
DROP TABLE IF EXISTS "resenas";
DROP TABLE IF EXISTS "busquedas";
DROP TABLE IF EXISTS "leads";
DROP TABLE IF EXISTS "usuarios";
DROP TYPE IF EXISTS "FuenteResena";
DROP TYPE IF EXISTS "EstadoLead";
