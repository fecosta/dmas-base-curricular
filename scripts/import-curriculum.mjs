import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function fail(message) {
  throw new Error(message);
}

const file = process.argv[2];
if (!file) fail("Uso: npm run db:import-curriculum -- <archivo.json>");

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) fail("Se requieren SUPABASE_URL y SUPABASE_SECRET_KEY del operador.");
if (!secret.startsWith("sb_secret_") && !secret.includes(".")) fail("SUPABASE_SECRET_KEY no parece una credencial administrativa.");
if (process.env.CURRICULUM_IMPORT_TARGET !== url) {
  fail("CURRICULUM_IMPORT_TARGET debe coincidir exactamente con SUPABASE_URL para confirmar el destino.");
}

const payload = JSON.parse(await readFile(resolve(file), "utf8"));
if (payload.version !== 1) fail("La versión del formato de importación debe ser 1.");
for (const group of ["axes", "identities", "revisions", "relationships"]) {
  if (!payload[group] || typeof payload[group] !== "object") fail(`Falta el grupo ${group}.`);
}

const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const result = await client.rpc("import_published_curriculum", { payload });
if (result.error) fail(`La importación se revirtió: ${result.error.message}`);
console.log(`Importación verificada: ${result.data.inserted} filas nuevas, ${result.data.unchanged} sin cambios.`);
