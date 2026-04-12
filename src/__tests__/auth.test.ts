import { describe, it, expect } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('test-secret');

describe('Auth — JWT', () => {
  it('creates a valid signed JWT', async () => {
    const token = await new SignJWT({ email: 'admin@kaaf.com', role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('verifies a valid JWT', async () => {
    const token = await new SignJWT({ email: 'admin@kaaf.com', role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET);

    const { payload } = await jwtVerify(token, SECRET);
    expect(payload.email).toBe('admin@kaaf.com');
    expect(payload.role).toBe('admin');
  });

  it('rejects an invalid JWT signature', async () => {
    const token = await new SignJWT({ email: 'admin@kaaf.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET);

    const wrongSecret = new TextEncoder().encode('wrong-secret');
    await expect(jwtVerify(token, wrongSecret)).rejects.toThrow();
  });

  it('rejects expired tokens', async () => {
    const token = await new SignJWT({ email: 'admin@kaaf.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1) // already expired
      .sign(SECRET);

    await expect(jwtVerify(token, SECRET)).rejects.toThrow();
  });
});

describe('Auth — Credentials', () => {
  it('accepts correct credentials', () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    expect(email).toBe('admin@kaaf.com');
    expect(password).toBe('password123');
  });
});
