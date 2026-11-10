/**
 * Genera supabase/seed/catalog.sql a partir de data/catalog/institutions/*.json.
 * Uso: npm run catalog:sql
 *
 * El JSON es la fuente de verdad del catálogo durante el MVP (revisable en git,
 * con URL y fecha por dato). La base se carga desde acá, nunca a mano.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { CATALOG, CATALOG_VERSION } from "../src/domain/catalog/catalog";

const q = (s: string | null | undefined) => (s == null ? "null" : `'${s.replace(/'/g, "''")}'`);
const arr = (xs: string[]) => `array[${xs.map(q).join(",")}]::text[]`;
const lines: string[] = [`-- Generado por scripts/catalog-to-sql.ts · catálogo ${CATALOG_VERSION}`, "begin;"];

const sources = new Set<string>();
for (const p of CATALOG.programs) sources.add(p.source);
for (const i of CATALOG.institutions) for (const c of i.campuses) sources.add(c.source);
for (const url of sources) {
  lines.push(`insert into public.sources (url, retrieved_at) values (${q(url)}, ${q(CATALOG_VERSION)}) on conflict do nothing;`);
}

for (const i of CATALOG.institutions) {
  const status = i.status === "pendiente" ? "pendiente" : "verificado";
  lines.push(
    `insert into public.institutions (slug, name, short_name, kind, sector, website, status, verified_at, notes) values (` +
      `${q(i.id)}, ${q(i.name)}, ${q(i.shortName)}, ${q(i.kind === "instituto_universitario" ? "instituto_universitario" : "universidad")}, ` +
      `${q(i.sector)}, ${q(i.website)}, ${q(status)}, ${q(i.verifiedAt)}, ${arr(i.notes)});`,
  );
  for (const c of i.campuses) {
    lines.push(
      `insert into public.campuses (institution_id, name, address, zone, role, status, verified_at, source_id) select id, ${q(c.name)}, ${q(c.address)}, ${q(c.zone)}, ${q(c.role)}, 'verificado', ${q(i.verifiedAt)}, (select id from public.sources where url = ${q(c.source)} limit 1) from public.institutions where slug = ${q(i.id)};`,
    );
  }
}

for (const c of CATALOG.careers) {
  lines.push(
    `insert into public.careers (career_key, name, knowledge_area, field_ids, status) values (${q(c.id)}, ${q(c.name)}, ${q(c.fields[0] ?? "otro")}, ${arr(c.fields)}, 'verificado') on conflict (career_key) do nothing;`,
  );
}

const LEVEL: Record<string, string> = { grado: "grado", profesorado: "profesorado", tecnicatura: "tecnicatura", pregrado: "pregrado", ciclo: "ciclo", programa_conjunto: "programa_conjunto" };
for (const p of CATALOG.programs) {
  lines.push(
    `insert into public.programs (career_id, institution_id, institution_slug, official_name, level, level_inferred, field_ids, pending_fields, orientations, start_note, source_id, status, verified_at) select ` +
      `(select id from public.careers where career_key = ${q(p.careerId)}), i.id, ${q(p.institutionId)}, ${q(p.officialName)}, ${q(LEVEL[p.level])}, ${q(p.level)}, ${arr(p.fields)}, ${arr(p.pending)}, ${arr(p.orientations)}, ${q(p.startNote)}, ` +
      `(select id from public.sources where url = ${q(p.source)} limit 1), 'verificado', ${q(p.verifiedAt)} from public.institutions i where i.slug = ${q(p.institutionId)};`,
  );
  for (const u of p.units) {
    lines.push(
      `insert into public.academic_units (institution_id, name, kind) select id, ${q(u.name)}, ${q(u.kind)} from public.institutions where slug = ${q(p.institutionId)} on conflict do nothing;`,
      `insert into public.program_units (program_id, unit_id) select pr.id, u.id from public.programs pr join public.academic_units u on u.institution_id = pr.institution_id where pr.institution_slug = ${q(p.institutionId)} and pr.official_name = ${q(p.officialName)} and u.name = ${q(u.name)} on conflict do nothing;`,
    );
  }
}
lines.push("commit;");

mkdirSync("supabase/seed", { recursive: true });
writeFileSync("supabase/seed/catalog.sql", lines.join("\n") + "\n");
console.log(`catalog.sql: ${CATALOG.institutions.length} instituciones, ${CATALOG.careers.length} carreras, ${CATALOG.programs.length} ofertas`);
