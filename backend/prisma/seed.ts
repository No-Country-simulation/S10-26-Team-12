import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    // Creamos un usuario de prueba
    const usuario = await prisma.usuario.upsert({
        where: {
            email: "admin@repusense.test",
        },
        update: {},
        create: {
            email: "admin@repusense.test",
            passwordHash: "hash-de-prueba-no-utilizable",
            nombre: "Usuario de prueba",
        },
    });

    // Creamos un negocio de prueba
    await prisma.lead.upsert({
        where: {
            place_id: "seed-restaurante-001",
        },
        update: {
            rating: 3.5,
            review_count: 20,
        },
        create: {
            place_id: "seed-restaurante-001",
            nombre: "Restaurante de prueba",
            pais: "Argentina",
            ciudad: "Neuquen",
            rubro: "Restaurante",
            rating: 3.5,
            review_count: 20,
        },
    });

    console.log("Seed ejecutado correctamente.");
    console.log("Usuario creado o existente:", usuario.email);
}

main()
    .catch((error) => {
        console.error("Error al ejecutar el seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });