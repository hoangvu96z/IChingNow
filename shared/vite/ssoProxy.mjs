import { getSsoWebBase } from '../src/utils/ssoConfig.mjs';

export function createSsoProxy(env = {}) {
  const target = getSsoWebBase(env);
  return Object.fromEntries(
    ['/sso', '/me', '/plans', '/readings', '/notes', '/uploads', '/contact', '/analytics']
      .map(route => [route, { target, changeOrigin: true, secure: true }]),
  );
}
