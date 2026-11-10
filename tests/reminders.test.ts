import { createDecipheriv, createECDH, createHmac, createPublicKey, randomBytes, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptPayload, vapidAuthorization } from '../api/_lib/webPush.js';
import { diffDays, pickReminder, todayInBrazil, type FornalhaForRules } from '../api/_lib/reminderRules.js';

function hmac(key: Buffer, data: Buffer): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

/** Decifra como o navegador faria (RFC 8291), para conferir o envio. */
function decrypt(body: Buffer, uaPrivate: ReturnType<typeof createECDH>, authSecret: Buffer): string {
  const salt = body.subarray(0, 16);
  const idlen = body[20]!;
  const asPublic = body.subarray(21, 21 + idlen);
  const ciphertext = body.subarray(21 + idlen);
  const uaPublic = uaPrivate.getPublicKey();
  const shared = uaPrivate.computeSecret(asPublic);
  const prkKey = hmac(authSecret, shared);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  expect(plain[plain.length - 1]).toBe(2);
  return plain.subarray(0, plain.length - 1).toString('utf8');
}

describe('Web Push', () => {
  it('cifra uma mensagem que o aparelho consegue abrir', () => {
    const ua = createECDH('prime256v1');
    ua.generateKeys();
    const auth = randomBytes(16);
    const body = Buffer.from(encryptPayload({ p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') }, '{"title":"Oi, Bolota"}'));
    expect(body.readUInt32BE(16)).toBe(4096);
    expect(decrypt(body, ua, auth)).toBe('{"title":"Oi, Bolota"}');
  });

  it('assina o VAPID com a chave privada e a origem do serviço', () => {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    const keys = { publicKey: ecdh.getPublicKey().toString('base64url'), privateKey: ecdh.getPrivateKey().toString('base64url'), subject: 'mailto:teste@papazilla.app' };
    const header = vapidAuthorization('https://web.push.apple.com/abc', keys, Date.UTC(2026, 10, 10));
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    expect(match).not.toBeNull();
    const [, h, c, sig, k] = match!;
    expect(k).toBe(keys.publicKey);
    const claims = JSON.parse(Buffer.from(c!, 'base64url').toString());
    expect(claims.aud).toBe('https://web.push.apple.com');
    expect(claims.sub).toBe('mailto:teste@papazilla.app');
    const pub = ecdh.getPublicKey();
    const key = createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') } });
    expect(verify('sha256', Buffer.from(`${h}.${c}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig!, 'base64url'))).toBe(true);
  });
});

describe('Regras dos avisos', () => {
  const today = '2026-11-10';
  const stocked = (endDate: string): FornalhaForRules => ({ id: 'f1', stage: 'stocked', endDate, createdAt: '2026-11-01T10:00:00Z', title: 'Frango', petNames: ['Bolota', 'Pipoca'] });
  const shopping = (createdAt: string): FornalhaForRules => ({ id: 'f2', stage: 'shopping', createdAt, title: 'Frango com batata', petNames: ['Bolota'] });

  it('dia no fuso de Brasília', () => {
    expect(todayInBrazil(new Date('2026-11-11T02:30:00Z'))).toBe('2026-11-10');
    expect(diffDays('2026-11-10', '2026-11-13')).toBe(3);
  });

  it('avisa para planejar faltando 3 dias ou menos, sem lista em andamento', () => {
    expect(pickReminder([stocked('2026-11-13')], new Set(), today)).toBeNull();
    expect(pickReminder([stocked('2026-11-12')], new Set(), today)?.title).toBe('Faltam 3 dias de comida');
    expect(pickReminder([stocked('2026-11-10')], new Set(), today)?.title).toBe('Hoje é o último dia de comida');
    expect(pickReminder([stocked('2026-11-12'), shopping('2026-11-10T09:00:00Z')], new Set(), today)).toBeNull();
  });

  it('não repete o que já saiu', () => {
    expect(pickReminder([stocked('2026-11-12')], new Set(['f1:plan_next']), today)).toBeNull();
  });

  it('passou da data tem prioridade e para depois de duas semanas', () => {
    const r = pickReminder([stocked('2026-11-09'), shopping('2026-11-05T09:00:00Z')], new Set(), today);
    expect(r?.kind).toBe('overdue');
    expect(r?.body).toContain('Bolota e Pipoca');
    expect(pickReminder([stocked('2026-10-20')], new Set(), today)).toBeNull();
  });

  it('lista parada há 2 dias', () => {
    expect(pickReminder([shopping('2026-11-09T09:00:00Z')], new Set(), today)).toBeNull();
    const r = pickReminder([shopping('2026-11-08T09:00:00Z')], new Set(), today);
    expect(r?.kind).toBe('shopping_waiting');
    expect(r?.path).toBe('/papa/compras');
  });
});
