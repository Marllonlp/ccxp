// Build sem dependências: publica apenas o jogo e gera um cache versionado por conteúdo.
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const destino = join(raiz, 'dist');
const extensoes = new Set(['.js', '.css', '.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.mp3', '.wav', '.ogg', '.ttf', '.woff', '.woff2', '.json']);

async function listar(pasta) {
  const arquivos = [];
  for (const entrada of await readdir(join(raiz, pasta), { withFileTypes: true })) {
    const caminho = `${pasta}/${entrada.name}`;
    if (entrada.isDirectory()) arquivos.push(...await listar(caminho));
    else if (entrada.isFile() && extensoes.has(extname(entrada.name))) arquivos.push(caminho);
  }
  return arquivos;
}

const caminhos = ['index.html', 'manifest.webmanifest',
  ...await listar('src'), ...await listar('styles'), ...await listar('assets')].sort();
const modeloWorker = await readFile(join(raiz, 'pwa/service-worker.js'), 'utf8');
const hashVersao = createHash('sha256').update(modeloWorker);
const arquivos = [];
let totalBytes = 0;

await rm(destino, { recursive: true, force: true });
for (const caminho of caminhos) {
  let conteudo = await readFile(join(raiz, caminho));
  if (caminho === 'index.html') {
    let html = conteudo.toString();
    const marcador = '<meta name="pwa-build" content="development" />';
    if (!html.includes(marcador)) throw new Error('Marcador pwa-build ausente no HTML.');
    html = html.replace(marcador, '<meta name="pwa-build" content="production" />');
    // Analytics apenas nos deploys da Vercel, sem dependências no jogo.
    if (process.env.VERCEL === '1') {
      html = html.replace('</head>', `  <script>
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
</head>`);
    }
    conteudo = Buffer.from(html);
  }
  const digest = createHash('sha256').update(conteudo).digest('base64');
  hashVersao.update(caminho).update('\0').update(digest).update('\0');
  arquivos.push({ url: './' + caminho.split('/').map(encodeURIComponent).join('/'), integrity: `sha256-${digest}` });
  totalBytes += conteudo.length;
  await mkdir(dirname(join(destino, caminho)), { recursive: true });
  await writeFile(join(destino, caminho), conteudo);
}

const version = hashVersao.digest('hex').slice(0, 20);
const marcadorWorker = '/* PWA_MANIFEST */ null';
if (!modeloWorker.includes(marcadorWorker)) throw new Error('Marcador do manifesto ausente no worker.');
const worker = modeloWorker.replace(marcadorWorker, JSON.stringify({ version, files: arquivos }, null, 2));
await writeFile(join(destino, 'sw.js'), worker);
console.log(`PWA ${version}: ${arquivos.length} arquivos, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB em dist/.`);
