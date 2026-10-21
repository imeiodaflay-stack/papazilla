import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS = join(__dirname, '..', 'supabase', 'migrations');
const PHOTO_BUCKETS = ['pet-photos', 'cook-photos', 'avatars'];

/** Regras de SELECT em storage.objects que valem depois de aplicar todas as migrations em ordem. */
function effectiveSelectPolicies(): Map<string, string> {
  const policies = new Map<string, string>();
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8').replace(/--[^\n]*/g, '');
    for (const statement of sql.split(';')) {
      const created = /create\s+policy\s+"([^"]+)"\s+on\s+storage\.objects\b([\s\S]*)/i.exec(statement);
      if (created && /\bfor\s+select\b/i.test(created[2]!)) policies.set(created[1]!, created[2]!);
      const dropped = /drop\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+storage\.objects\b/i.exec(statement);
      if (dropped) policies.delete(dropped[1]!);
    }
  }
  return policies;
}

describe('leitura das fotos no Storage', () => {
  it('nenhuma regra de SELECT deixa listar fotos de outros usuários ou sem login', () => {
    for (const [name, body] of effectiveSelectPolicies()) {
      const touchesPhotos = PHOTO_BUCKETS.some((bucket) => body.includes(`'${bucket}'`));
      if (!touchesPhotos) continue;
      expect(body, `${name} deve valer só para o dono, logado`).toMatch(/\bto\s+authenticated\b/i);
      expect(body, `${name} deve filtrar pela pasta do dono`).toMatch(/auth\.uid\(\)/i);
    }
  });

  it('os três buckets continuam públicos, então as URLs das fotos seguem funcionando', () => {
    const sql = readdirSync(MIGRATIONS).sort().map((f) => readFileSync(join(MIGRATIONS, f), 'utf8')).join('\n');
    for (const bucket of PHOTO_BUCKETS) {
      expect(sql).toMatch(new RegExp(`'${bucket}'`));
    }
    expect(sql).not.toMatch(/update\s+storage\.buckets\s+set\s+public\s*=\s*false/i);
  });
});
