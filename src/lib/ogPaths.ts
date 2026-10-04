/** Absolute URL of a page's generated share image (see src/pages/og/[...path].png.ts). */
export const ogPath = (path: string) => `https://dord.racing/og/${path.replace(/^\/+/, '')}.png`;
