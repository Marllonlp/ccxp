// Preferências de acessibilidade: tamanho do texto, alto contraste e movimento reduzido.
// Ficam salvas à parte do progresso, então "Apagar dados" não as apaga.
// O CSS lê --escala-texto e os atributos data-contraste e data-movimento do <html>;
// os módulos que desenham em canvas usam escalaTexto(), altoContraste() e movimentoReduzido().

const CHAVE = 'byte-acessibilidade';
const ESCALAS = { normal: 1, grande: 1.25, muito_grande: 1.5 };
const OPCOES = { texto: Object.keys(ESCALAS), contraste: ['auto', 'ligado', 'desligado'], movimento: ['auto', 'ligado', 'desligado'] };
const PADRAO = { texto: 'normal', contraste: 'auto', movimento: 'auto' };

const sistemaContraste = window.matchMedia('(prefers-contrast: more), (forced-colors: active)');
const sistemaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
const ouvintes = new Set();

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    return Object.fromEntries(Object.entries(PADRAO).map(([nome, padrao]) => (
      [nome, OPCOES[nome].includes(salvo?.[nome]) ? salvo[nome] : padrao]
    )));
  } catch {
    // Preferências ilegíveis ou sem armazenamento: usa os padrões.
    return { ...PADRAO };
  }
}

const preferencias = carregar();

/** 'auto' segue o sistema; 'ligado' e 'desligado' valem sempre. */
function ativo(valor, sistema) {
  return valor === 'ligado' || (valor === 'auto' && sistema.matches);
}

export const escalaTexto = () => ESCALAS[preferencias.texto];
export const altoContraste = () => ativo(preferencias.contraste, sistemaContraste);
export const movimentoReduzido = () => ativo(preferencias.movimento, sistemaMovimento);
export const lerPreferencia = (nome) => preferencias[nome];

function aplicar() {
  const raiz = document.documentElement;
  raiz.style.setProperty('--escala-texto', String(escalaTexto()));
  raiz.dataset.contraste = altoContraste() ? 'alto' : 'normal';
  raiz.dataset.movimento = movimentoReduzido() ? 'reduzido' : 'normal';
  ouvintes.forEach((ouvinte) => ouvinte());
}

/** Muda uma preferência ('texto', 'contraste' ou 'movimento'), salva e aplica. */
export function definirPreferencia(nome, valor) {
  if (!OPCOES[nome]?.includes(valor)) return;
  preferencias[nome] = valor;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(preferencias));
  } catch {
    // Sem armazenamento disponível: a preferência vale só enquanto a página estiver aberta.
  }
  aplicar();
}

/** Chama `ouvinte` sempre que uma preferência ou a configuração do sistema mudar. */
export function aoMudarAcessibilidade(ouvinte) {
  ouvintes.add(ouvinte);
}

sistemaContraste.addEventListener('change', aplicar);
sistemaMovimento.addEventListener('change', aplicar);
aplicar();
