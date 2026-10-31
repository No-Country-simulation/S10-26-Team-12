// Cargamos las variables de entorno del archivo .env

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg"; //permite que prisma se conecte a postgre
import { PrismaClient } from "./generated/prisma/client";

// Configuramos el adaptador para conectarnos a PostgreSQL
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

// Creamos una instancia de Prisma Client
export const prisma = new PrismaClient({
    adapter,
});