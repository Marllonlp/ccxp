// Tela de carregamento: cobre o jogo até as imagens, os GIFs e as fontes estarem prontos.
// Uso: registrarCarregamento(promessa) para cada recurso (feito pelo AnimacaoSprite)
// e iniciarTelaCarregamento() no final do main.js.

const promessas = new Set();
let concluidas = 0;
let carregando = true;

const DICAS = [
  'print() mostra uma mensagem na tela.',
  'Variáveis guardam valores: vidas = 3',
  'input() lê o que o jogador digita.',
  'Em Python, o recuo (os espaços) faz parte do código!',
  'if decide o caminho. else é o "senão".',
  'for repete um número de vezes. while repete enquanto for verdade.',
  'and exige as duas condições. or aceita qualquer uma.',
  'Errou? O console mostra onde. Errar faz parte de programar!',
];

export function registrarCarregamento(promessa) {
  if (!carregando || !promessa) return promessa;
  const p = Promise.resolve(promessa).catch(() => {}).finally(() => { concluidas++; });
  promessas.add(p);
  return promessa;
}

// Bloqueia teclado enquanto carrega (evita apertar Enter e começar o jogo por trás da tela).
function bloquearTeclas(e) {
  if (carregando) { e.preventDefault(); e.stopImmediatePropagation(); }
}
window.addEventListener('keydown', bloquearTeclas, true);
window.addEventListener('keyup', bloquearTeclas, true);

function carregarImagem(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
    if (img.complete) resolve();
  });
}

// Imagens usadas no CSS (fundos da tela de título, botões, HUD...).
function urlsDoCss() {
  const urls = new Set();
  for (const folha of document.styleSheets) {
    let regras;
    try { regras = folha.cssRules; } catch { continue; }
    for (const regra of regras || []) {
      const texto = regra.cssText || '';
      for (const m of texto.matchAll(/url\(["']?([^"')]+\.(?:png|gif|jpe?g|webp|svg))["']?\)/gi)) {
        try { urls.add(new URL(m[1], folha.href || location.href).href); } catch { /* ignora */ }
      }
    }
  }
  return [...urls];
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export async function iniciarTelaCarregamento({ minimo = 800, limite = 20000 } = {}) {
  const tela = document.getElementById('tela-carregamento');
  if (!tela) { carregando = false; return; }
  const barra = tela.querySelector('.carregamento-preenchimento');
  const porcentagem = document.getElementById('carregamento-porcentagem');
  const dica = document.getElementById('carregamento-dica-texto');

  // O load da página cobre as imagens que os módulos criam com new Image() (níveis, demo do título,
  // mecânicas...). Um arquivo com erro também dispara o load, então nada trava.
  if (document.readyState !== 'complete') {
    registrarCarregamento(new Promise((resolve) => window.addEventListener('load', resolve, { once: true })));
  }

  // Imagens do HTML e do CSS + fontes do jogo.
  document.querySelectorAll('img').forEach((img) => registrarCarregamento(carregarImagem(img.src)));
  urlsDoCss().forEach((url) => registrarCarregamento(carregarImagem(url)));
  if (document.fonts) {
    registrarCarregamento(document.fonts.load('16px "Press Start 2P"'));
    registrarCarregamento(document.fonts.ready);
  }

  // Dicas que trocam a cada 3,5 s.
  let indiceDica = Math.floor(Math.random() * DICAS.length);
  if (dica) dica.textContent = DICAS[indiceDica];
  const timerDica = setInterval(() => {
    indiceDica = (indiceDica + 1) % DICAS.length;
    if (dica) dica.textContent = DICAS[indiceDica];
  }, 3500);

  // Barra de progresso (nunca volta para trás).
  let mostrado = 0;
  const timerBarra = setInterval(() => {
    const alvo = promessas.size ? concluidas / promessas.size : 1;
    mostrado = Math.max(mostrado, Math.min(alvo, 1));
    tela.style.setProperty('--progresso', mostrado.toFixed(3));
    if (porcentagem) porcentagem.textContent = `${Math.round(mostrado * 100)}%`;
  }, 50);

  // Espera tudo (inclusive recursos registrados durante a espera), com tempo mínimo e limite.
  const tudo = (async () => {
    let tamanho = -1;
    while (tamanho !== promessas.size) {
      tamanho = promessas.size;
      await Promise.all([...promessas]);
    }
  })();
  await Promise.all([Promise.race([tudo, esperar(limite)]), esperar(minimo)]);

  // Completa a barra, espera um instante e some com fade.
  clearInterval(timerBarra);
  tela.style.setProperty('--progresso', '1');
  if (porcentagem) porcentagem.textContent = '100%';
  await esperar(250);
  clearInterval(timerDica);
  carregando = false;
  tela.classList.add('saindo');
  await esperar(450);
  tela.hidden = true;
  tela.classList.add('oculta');
  document.getElementById('botao-titulo-jogar')?.focus({ preventScroll: true });
  window.dispatchEvent(new Event('jogo-carregado'));
}
