const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  sub: 'admin';
  iat: number;
  exp: number;
  nonce: string;
}

function toBase64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let base64 = '';

  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    bytes.forEach((b) => {
      base64 += String.fromCharCode(b);
    });
    base64 = btoa(base64);
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  return decodeURIComponent(
    Array.prototype.map
      .call(atob(base64), (char: string) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: 'admin',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = await sign(encodedPayload, secret);
  if (providedSignature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return payload.sub === 'admin' && typeof payload.exp === 'number' && payload.exp > now;
  } catch {
    return false;
  }
}

export { SESSION_TTL_SECONDS };
