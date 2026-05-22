import { describe, expect, test } from 'vitest';
import { signJwt, verifyJwt } from './jwt';

describe('JWT (HS256)', () => {
  const SECRET = 'test-secret-1234';

  test('sign → verify round-trip で payload を取り出せる', async () => {
    const token = await signJwt({ sub: 'u-1', handle: 'Alice' }, SECRET);
    const payload = await verifyJwt(token, SECRET);
    expect(payload?.sub).toBe('u-1');
    expect(payload?.handle).toBe('Alice');
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('別シークレットでは verify が null', async () => {
    const token = await signJwt({ sub: 'u-1', handle: 'Alice' }, SECRET);
    expect(await verifyJwt(token, 'other-secret')).toBeNull();
  });

  test('改ざんトークンは null', async () => {
    const token = await signJwt({ sub: 'u-1', handle: 'Alice' }, SECRET);
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}AAAA.${parts[2]}`;
    expect(await verifyJwt(tampered, SECRET)).toBeNull();
  });

  test('期限切れトークンは null', async () => {
    const token = await signJwt({ sub: 'u-1', handle: 'Alice' }, SECRET, -10);
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });

  test('壊れた形式のトークンは null', async () => {
    expect(await verifyJwt('not.a.jwt.really', SECRET)).toBeNull();
    expect(await verifyJwt('only.two', SECRET)).toBeNull();
    expect(await verifyJwt('', SECRET)).toBeNull();
  });
});
