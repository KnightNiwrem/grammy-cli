import { ensureDir } from "@std/fs/ensure-dir";
import { join } from "@std/path/join";

export function resolveFromCwd(...segments: string[]): string {
  return join(Deno.cwd(), ...segments);
}

export async function ensureDirectory(path: string): Promise<void> {
  await ensureDir(path);
}

export async function prepareDirectory(...segments: string[]): Promise<string> {
  const path = resolveFromCwd(...segments);
  await ensureDirectory(path);
  return path;
}
