// Seed: carga usuarios de prueba en la tabla "usuarios".
// Se corre con: npm run db:seed
// Se puede correr todas las veces que quieran: si el usuario ya existe, no se duplica ni se le cambia la contraseña.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
// @ts-ignore (password.js es JavaScript, lo comparte con el futuro login)
import { hashPassword } from "../src/utils/password";

// Usuarios inventados. La terminación ".test" no existe en internet, así que nunca le llegan correos a nadie real.
export const USUARIOS_SEMILLA = [
    { email: "vendedor1@repusense.test", nombre: "Vendedor Uno" },
    { email: "vendedor2@repusense.test", nombre: "Vendedor Dos" },
    { email: "vendedor3@repusense.test", nombre: "Vendedor Tres" },
];

// Contraseña SOLO PARA DESARROLLO. Se puede cambiar con la variable de entorno SEED_PASSWORD.
export const PASSWORD_DEV = "RepuSense-dev-2026";

export async function sembrarUsuarios() {
    const password = process.env.SEED_PASSWORD || PASSWORD_DEV;

    for (const usuario of USUARIOS_SEMILLA) {
        await prisma.usuario.upsert({
            where: { email: usuario.email },
            update: { nombre: usuario.nombre }, // no se toca passwordHash: si alguien la cambió, se respeta
            create: { ...usuario, passwordHash: hashPassword(password) },
        });
    }
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    // Protección: estos usuarios tienen una contraseña conocida, nunca deben crearse en producción.
    if (process.env.NODE_ENV === "production") {
        throw new Error("El seed no se puede correr con NODE_ENV=production");
    }

    await sembrarUsuarios();
    console.log(`Seed listo: ${USUARIOS_SEMILLA.length} usuarios de prueba`);

    console.log("Seed ejecutado correctamente.");
    console.log("Usuarios creados o existentes:", USUARIOS_SEMILLA.map(usuario => usuario.email));
}

// Solo se ejecuta si corrés este archivo directo (si lo importa un test, no corre solo).
main()
    .catch((error) => {
        console.error("Error al ejecutar el seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

