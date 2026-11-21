// Leonida Trophy Guide — entrypoint.
// Copies app/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with the vendored library.
// Node 22, standard library only, no network, no installs. Deterministic:
// two runs write identical bytes.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(path);
    else if (entry.isFile()) n += 1;
  }
  return n;
}

function main(): void {
  const outDir = resolve(OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });
  const appSrc = join(REPO_ROOT, 'app');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appSrc)) throw new Error('app/: no such directory in the repository');
  if (!existsSync(shotsSrc)) throw new Error('screenshots/: no such directory in the repository');
  // Clear any previous copy first, so a reused output directory never keeps
  // stale files: two runs then write identical bytes.
  rmSync(join(outDir, 'app'), { recursive: true, force: true });
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  rmSync(join(outDir, 'dossier.json'), { force: true });
  cpSync(appSrc, join(outDir, 'app'), { recursive: true });
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const appFiles = countFiles(join(outDir, 'app'));
  const shotFiles = readdirSync(join(outDir, 'screenshots')).filter((f) =>
    statSync(join(outDir, 'screenshots', f)).isFile(),
  ).length;
  console.log(
    `Leonida Trophy Guide: copied ${appFiles} app files and ${shotFiles} screenshots to ${outDir}; dossier.json written.`,
  );
}

try {
  main();
} catch (err) {
  console.error(`main.ts: ${(err as Error).message}`);
  process.exit(1);
}
