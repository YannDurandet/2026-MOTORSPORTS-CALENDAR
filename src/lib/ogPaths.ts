/** Absolute URL of a page's generated share image (written after the build by src/integrations/og.ts). */
export const ogPath = (path: string) => `https://dord.racing/og/${path.replace(/^\/+/, '')}.png`;
