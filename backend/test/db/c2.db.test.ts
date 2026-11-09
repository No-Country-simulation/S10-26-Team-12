// Tests de la tarjeta C2 contra la base REAL (PostgreSQL).
// Se corren con: npm run test:db   (hace falta la base levantada y las migraciones aplicadas)
// No están en "npm test" a propósito, para que ese comando siga sin depender de la base.
// Todo lo que crean tiene place_id que empieza con "c2-test-" y se borra al terminar.
import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";

import { prisma } from "../../prisma-client";
import { guardarLead } from "../../services/lead.service";
import { sembrarUsuarios, USUARIOS_SEMILLA, PASSWORD_DEV } from "../../prisma/seed";
// @ts-ignore (password.js es JavaScript)
import { verifyPassword } from "../../src/utils/password";

const PREFIJO = "c2-test-";

// Limpia los datos de prueba (primero las reseñas por la clave foránea, después los leads).
async function limpiar() {
  await prisma.resena.deleteMany({ where: { lead: { place_id: { startsWith: PREFIJO } } } });
  await prisma.lead.deleteMany({ where: { place_id: { startsWith: PREFIJO } } });
}

after(async () => {
  await limpiar();
  await prisma.$disconnect();
});

// la migración crea los índices 
test("la base tiene los índices del schema (leads, busquedas, resenas, usuarios)", async () => {
  const filas = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  const existentes = new Set(filas.map((f) => f.indexname));

  const esperados = [
    "leads_pais_idx",
    "leads_ciudad_idx",
    "leads_estado_idx",
    "leads_rubro_idx",
    "leads_rating_idx",
    "leads_place_id_key",
    "busquedas_pais_ciudad_idx",
    "busquedas_search_key_key",
    "resenas_lead_id_fecha_idx",
    "resenas_lead_id_id_extern_key",
    "usuarios_email_key",
  ];

  for (const indice of esperados) {
    assert.ok(existentes.has(indice), `falta el índice ${indice}`);
  }
});

// ---------- Criterio 1b: el seed carga usuarios de prueba ----------
test("el seed crea los usuarios de prueba, no los duplica y guarda la contraseña hasheada", async () => {
  await sembrarUsuarios();
  await sembrarUsuarios(); // segunda vez: no debe duplicar

  const emails = USUARIOS_SEMILLA.map((u) => u.email);
  const usuarios = await prisma.usuario.findMany({ where: { email: { in: emails } } });
  assert.equal(usuarios.length, USUARIOS_SEMILLA.length);

  const password = process.env.SEED_PASSWORD || PASSWORD_DEV;
  for (const usuario of usuarios) {
    assert.notEqual(usuario.passwordHash, password, "la contraseña no puede estar guardada en texto plano");
    assert.ok(usuario.passwordHash.startsWith("scrypt$"));
    assert.equal(verifyPassword(password, usuario.passwordHash), true);
    assert.equal(verifyPassword("otra-clave", usuario.passwordHash), false);
  }
});

// ---------- Criterio 2: el upsert no pisa estado ni fecha_ultimo_contacto ----------
test("guardarLead actualiza rating y reseñas pero no pisa estado ni fecha_ultimo_contacto", async () => {
  await limpiar();
  await sembrarUsuarios();
  const vendedor = await prisma.usuario.findUniqueOrThrow({ where: { email: USUARIOS_SEMILLA[0].email } });

  const datos = {
    place_id: `${PREFIJO}upsert-001`,
    nombre: "Negocio de prueba C2",
    pais: "Argentina",
    ciudad: "Neuquén",
    rubro: "restaurantes",
    rating: 3.4,
    review_count: 12,
  };

  // Las reseñas de prueba tienen rating 4 o 5 (no son negativas), así no se llama a la IA.
  const fecha = new Date("2026-10-01T12:00:00.000Z");
  const resenaA = { id_extern: "r-A", texto: "Texto original", rating: 5, fecha, autor: "Ana", fuente: "google_maps" as const };

  // 1) Primera vez: se crea como "nuevo".
  const creado = await guardarLead(datos, [resenaA]);
  assert.equal(creado.estado, "nuevo");

  // 2) El vendedor lo marca como contactado.
  const fechaContacto = new Date("2026-11-05T15:30:00.000Z");
  await prisma.lead.update({
    where: { id: creado.id },
    data: { estado: "contactado", fecha_ultimo_contacto: fechaContacto, contactado_por: vendedor.id },
  });

  // 3) El extractor vuelve a encontrar el negocio: rating nuevo, una reseña modificada y una reseña nueva.
  const resenaAModificada = { ...resenaA, texto: "Texto editado", rating: 4 };
  const resenaB = { id_extern: "r-B", texto: "Reseña nueva", rating: 5, fecha, autor: "Beto", fuente: "yelp" as const };
  await guardarLead({ ...datos, rating: 2.8, review_count: 40 }, [resenaAModificada, resenaB]);

  // 4) Lo que NO tiene que haber cambiado
  const despues = await prisma.lead.findUniqueOrThrow({ where: { id: creado.id } });
  assert.equal(despues.estado, "contactado");
  assert.equal(despues.fecha_ultimo_contacto?.getTime(), fechaContacto.getTime());
  assert.equal(despues.contactado_por, vendedor.id);

  // 5) Lo que SÍ tiene que haber cambiado
  assert.equal(despues.rating, 2.8);
  assert.equal(despues.review_count, 40);

  const resenas = await prisma.resena.findMany({ where: { lead_id: creado.id }, orderBy: { id_extern: "asc" } });
  assert.equal(resenas.length, 2, "la reseña existente se actualiza (no se duplica) y la nueva se agrega");
  assert.equal(resenas[0].id_extern, "r-A");
  assert.equal(resenas[0].texto, "Texto editado");
  assert.equal(resenas[0].rating, 4);
  assert.equal(resenas[1].id_extern, "r-B");
});

test("guardar el mismo lead dos veces no lo duplica", async () => {
  const datos = {
    place_id: `${PREFIJO}duplicado-001`,
    nombre: "Negocio repetido",
    pais: "Chile",
    ciudad: "Santiago",
    rubro: "peluquerías",
    rating: 3.0,
    review_count: 20,
  };
  await guardarLead(datos);
  await guardarLead({ ...datos, rating: 3.1 });

  const cantidad = await prisma.lead.count({ where: { place_id: datos.place_id } });
  assert.equal(cantidad, 1);
});
