import { createECDH, createHmac, createCipheriv, createPrivateKey, randomBytes, sign } from 'node:crypto';

/**
 * Web Push sem dependência: criptografia `aes128gcm` (RFC 8291) e
 * autenticação VAPID (RFC 8292) com o `node:crypto`. Chaves no formato que o
 * `npx web-push generate-vapid-keys` gera (base64url, pública com 65 bytes,
 * privada com 32).
 */
export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export class PushGoneError extends Error {}

type Bytes = Uint8Array<ArrayBuffer>;

function b64url(data: Uint8Array): string {
  return Buffer.from(data).toString('base64url');
}

function fromB64url(value: string): Bytes {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

function text(value: string): Bytes {
  return new TextEncoder().encode(value);
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function hmac(key: Uint8Array, data: Uint8Array): Bytes {
  return new Uint8Array(createHmac('sha256', new Uint8Array(key)).update(new Uint8Array(data)).digest());
}

/** Corpo cifrado de uma mensagem (um registro só, sem preenchimento). */
export function encryptPayload(target: Pick<PushTarget, 'p256dh' | 'auth'>, payload: string, salt: Bytes = new Uint8Array(randomBytes(16))): Bytes {
  const uaPublic = fromB64url(target.p256dh);
  const authSecret = fromB64url(target.auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error('Chaves do aparelho inválidas.');

  const ecdh = createECDH('prime256v1');
  const asPublic = new Uint8Array(ecdh.generateKeys());
  const sharedSecret = new Uint8Array(ecdh.computeSecret(uaPublic));

  const prkKey = hmac(authSecret, sharedSecret);
  const ikm = hmac(prkKey, concat(text('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, text('Content-Encoding: aes128gcm\0\x01')).slice(0, 16);
  const nonce = hmac(prk, text('Content-Encoding: nonce\0\x01')).slice(0, 12);

  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const first = new Uint8Array(cipher.update(concat(text(payload), new Uint8Array([2]))));
  const last = new Uint8Array(cipher.final());
  const tag = new Uint8Array(cipher.getAuthTag());

  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, first, last, tag);
}

/** JWT ES256 do VAPID para a origem do serviço de push. */
export function vapidAuthorization(endpoint: string, keys: VapidKeys, now = Date.now()): string {
  const publicKey = fromB64url(keys.publicKey);
  const privateKey = fromB64url(keys.privateKey);
  if (publicKey.length !== 65 || privateKey.length !== 32) throw new Error('Chaves VAPID inválidas.');
  const key = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC', crv: 'P-256',
      d: b64url(privateKey), x: b64url(publicKey.slice(1, 33)), y: b64url(publicKey.slice(33, 65)),
    },
  });
  const header = b64url(text(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64url(text(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(now / 1000) + 12 * 60 * 60,
    sub: keys.subject,
  })));
  const signature = new Uint8Array(sign('sha256', text(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' }));
  return `vapid t=${header}.${claims}.${b64url(signature)}, k=${keys.publicKey}`;
}

export function vapidFromEnv(): VapidKeys | null {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT || 'mailto:contato@papazilla.app' };
}

/** Envia. `PushGoneError` quando o aparelho desinscreveu (apagar a inscrição). */
export async function sendPush(target: PushTarget, payload: object, keys: VapidKeys): Promise<void> {
  if (!target.endpoint.startsWith('https://')) throw new PushGoneError('Endereço de push inválido.');
  const res = await fetch(target.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuthorization(target.endpoint, keys),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(24 * 60 * 60),
      Urgency: 'normal',
    },
    body: encryptPayload(target, JSON.stringify(payload)),
  });
  if (res.status === 404 || res.status === 410) throw new PushGoneError(`Inscrição expirada (${res.status}).`);
  if (!res.ok) throw new Error(`Serviço de push recusou (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`);
}
