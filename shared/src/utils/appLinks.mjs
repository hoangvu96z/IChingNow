const LOCAL_PORTS = {
  '/kinhdich/': '5173',
  '/tarot/': '5174',
  '/tuvi/': '5175',
  '/talk/': '5176',
  '/note/': '5177',
};

export function getAppLink(path, env, location) {
  if (!env?.DEV || !location || !LOCAL_PORTS[path]) return path;
  // Keep the current app's link on its actual port, including custom preview ports.
  if (location.pathname.startsWith(path)) return path;
  const target = new URL(path, location.href);
  target.port = LOCAL_PORTS[path];
  return target.toString();
}
