// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output) and writes dossier.json
// there with buildDossier from the vendored library. Deterministic:
// two runs write identical bytes. No network, no installs.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps are the bounty's gate caps from the brief: text 163840 bytes,
// at most 4 screenshots of at most 262144 bytes each, app at most
// 993 files and directories and 50331648 bytes in all, paths at most
// 1000 bytes. Passing them makes this program fail exactly where
// the scorer would, instead of handing in a dossier it refuses.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function countEntries(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n++;
    if (entry.isDirectory()) n += countEntries(join(dir, entry.name));
  }
  return n;
}

function main(): void {
  const outDir = resolve(OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });
  const appSrc = join(REPO_ROOT, 'app');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appSrc) || !statSync(appSrc).isDirectory()) {
    throw new Error('app/: no such directory in the repository');
  }
  if (!existsSync(shotsSrc) || !statSync(shotsSrc).isDirectory()) {
    throw new Error('screenshots/: no such directory in the repository');
  }
  cpSync(appSrc, join(outDir, 'app'), { recursive: true });
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const appFiles = countEntries(join(outDir, 'app'));
  const shotFiles = readdirSync(join(outDir, 'screenshots')).filter((f) => statSync(join(outDir, 'screenshots', f)).isFile()).length;
  console.log(`Leonida Trophy Guide: copied ${appFiles} app entries and ${shotFiles} screenshots to ${outDir}; dossier.json written (${dossier.length} bytes).`);
}

try {
  main();
} catch (err) {
  console.error(`main.ts failed: ${(err as Error).message}`);
  process.exit(1);
}
