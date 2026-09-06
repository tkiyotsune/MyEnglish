export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** For plain <a href> to static files in /public (next/link handles basePath itself). */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
