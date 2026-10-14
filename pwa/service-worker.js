// O build substitui este marcador pela lista de arquivos e pela versão do conteúdo.
const PRECACHE = /* PWA_MANIFEST */ null;
const BASE = new URL('./', self.location.href);
const PREFIXO = `byte-pwa:${BASE.pathname}:`;
const CACHE = PREFIXO + PRECACHE.version;
const ARQUIVOS = new Set(PRECACHE.files.map(({ url }) => new URL(url, BASE).href));
const PAGINA = new URL('./index.html', BASE).href;

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // addAll é atômico: uma falha impede a instalação de uma versão incompleta.
      // A integridade também evita misturar arquivos de dois deploys.
      await cache.addAll(PRECACHE.files.map(({ url, integrity }) => new Request(new URL(url, BASE), {
        cache: 'reload',
        integrity,
      })));
    } catch (erro) {
      await caches.delete(CACHE);
      throw erro;
    }
    // Sem skipWaiting: uma atualização aguarda todas as janelas antigas fecharem.
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((nome) => nome.startsWith(PREFIXO) && nome !== CACHE)
      .map((nome) => caches.delete(nome)));
    await self.clients.claim();
  })());
});

// Elementos Audio podem pedir apenas parte de um MP3, inclusive no Safari.
async function responderIntervalo(resposta, intervalo) {
  const partes = /^bytes=(\d*)-(\d*)$/.exec(intervalo);
  if (!partes || (!partes[1] && !partes[2])) return resposta;
  const dados = await resposta.arrayBuffer();
  const tamanho = dados.byteLength;
  const inicio = partes[1] ? Number(partes[1]) : Math.max(0, tamanho - Number(partes[2]));
  const fim = partes[1] && partes[2] ? Math.min(Number(partes[2]), tamanho - 1) : tamanho - 1;
  if (!Number.isSafeInteger(inicio) || !Number.isSafeInteger(fim) || inicio > fim || inicio >= tamanho) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${tamanho}` } });
  }
  const headers = new Headers(resposta.headers);
  headers.delete('Content-Encoding');
  headers.set('Content-Range', `bytes ${inicio}-${fim}/${tamanho}`);
  headers.set('Content-Length', String(fim - inicio + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(dados.slice(inicio, fim + 1), { status: 206, headers });
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== BASE.origin) return;

  // Somente os endereços reais do jogo recebem o HTML, nunca um arquivo inexistente.
  const navegacao = pedido.mode === 'navigate'
    && (url.pathname === BASE.pathname || url.pathname === new URL(PAGINA).pathname);
  url.search = '';
  const chave = navegacao ? PAGINA : url.href;
  if (!ARQUIVOS.has(chave)) return;

  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const resposta = await cache.match(chave);
    if (!resposta) return fetch(pedido);
    const intervalo = pedido.headers.get('Range');
    return intervalo ? responderIntervalo(resposta, intervalo) : resposta;
  })());
});
