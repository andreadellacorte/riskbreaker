/** Vite dev server port for the docs app (keep in sync with any infra docs). */
export const DOCS_DEV_PORT = 5174;

export function docsServerConfig(): { port: number } {
  return { port: DOCS_DEV_PORT };
}
