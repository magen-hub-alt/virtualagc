// The offline build embeds these same bytes as data URLs; the regular app serves them locally.
export function assetURL(name) {
  if (typeof __APOLLO_ASSETS__ !== "undefined") return __APOLLO_ASSETS__[name];
  return `${import.meta.env.BASE_URL}${name}`;
}
