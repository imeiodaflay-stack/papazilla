#!/usr/bin/env node
/**
 * Gera a "Secret Key (for OAuth)" do Sign in with Apple para colar no Supabase.
 *
 * Uso (no Terminal, na pasta papazilla):
 *   node scripts/apple-client-secret.mjs TEAM_ID KEY_ID caminho/para/AuthKey_XXXX.p8 [SERVICES_ID]
 *
 * SERVICES_ID padrão: app.papazilla.web
 * O .p8 é lido só no seu computador; nada é enviado para lugar nenhum.
 * A chave gerada vale ~6 meses (limite da Apple). Depois, rode de novo.
 */
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [teamId, keyId, p8Path, servicesId = 'app.papazilla.web'] = process.argv.slice(2);
if (!teamId || !keyId || !p8Path) {
  console.error('Uso: node scripts/apple-client-secret.mjs TEAM_ID KEY_ID caminho/AuthKey.p8 [SERVICES_ID]');
  process.exit(1);
}

const b64url = (input) => Buffer.from(input).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 24 * 60 * 60 - 60; // um pouco menos de 6 meses

const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
const payload = { iss: teamId, iat: now, exp, aud: 'https://appleid.apple.com', sub: servicesId };
const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

const key = createPrivateKey(readFileSync(p8Path, 'utf8'));
const signature = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });

console.log(`${signingInput}.${signature.toString('base64url')}`);
console.error(`\nVale até ${new Date(exp * 1000).toLocaleDateString('pt-BR')}. Cole o texto acima (começa com eyJ) no Supabase.`);
