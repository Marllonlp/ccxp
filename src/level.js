// Responsável: Dudu. Dados do cenário, obstáculos e checkpoints da fase de teste.
// Convenções acordadas: x cresce para a direita, y cresce para baixo.
// Todo obstáculo é um retângulo com x, y, width e height, em pixels internos (960 × 540).

export const LARGURA_FASE = 960;
export const ALTURA_FASE = 540;

// Limite inferior da fase (RF04). Pedro usa este valor para detectar a queda.
export const LIMITE_QUEDA = 620;

// Canto superior esquerdo do personagem em pé sobre o Chão A.
const POSICAO_INICIAL = { x: 40, y: 400 };

// Obstáculos sólidos. O campo "tipo" só orienta o visual provisório.
export const obstaculos = [
  // Chão dividido em dois trechos: o vão entre eles serve para testar a queda.
  { tipo: 'chao', x: 0, y: 480, width: 340, height: 60 },
  { tipo: 'chao', x: 440, y: 480, width: 520, height: 60 },

  // Duas plataformas em degraus. A segunda também serve para bater a cabeça por baixo.
  { tipo: 'plataforma', x: 120, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 270, y: 310, width: 110, height: 20 },

  // Bloco suspenso: deixa 50 px livres até o chão, o que só permite passar agachado.
  { tipo: 'teto', x: 620, y: 330, width: 160, height: 100 },

  // Parede alta demais para ser pulada: bloqueia o movimento pelos dois lados.
  { tipo: 'parede', x: 830, y: 340, width: 40, height: 140 },
];

// Checkpoints (RF08). A área é apenas de contato: eles não bloqueiam a passagem.
// posicaoSegura é o canto superior esquerdo do personagem em pé sobre o chão.
export const checkpoints = [
  {
    id: 'cp1',
    x: 280, y: 400, width: 30, height: 80,
    posicaoSegura: { x: 275, y: 400 },
    ativo: false,
  },
  {
    id: 'cp2',
    x: 500, y: 400, width: 30, height: 80,
    posicaoSegura: { x: 495, y: 400 },
    ativo: false,
  },
];

let ultimoCheckpoint = null;

/** Posição inicial da fase. Devolve uma copia para ninguém alterar o original. */
export function obterPosicaoInicial() {
  return { x: POSICAO_INICIAL.x, y: POSICAO_INICIAL.y };
}

/**
 * Ponto de retorno atual: o último checkpoint ativado ou, antes da primeira
 * ativação, a posição inicial da fase.
 */
export function obterPontoSeguro() {
  if (!ultimoCheckpoint) return obterPosicaoInicial();
  const { x, y } = ultimoCheckpoint.posicaoSegura;
  return { x, y };
}

/** Último checkpoint ativado, ou null. Útil para a interface do Kelvis. */
export function obterUltimoCheckpoint() {
  return ultimoCheckpoint;
}

/**
 * Ativa por contato o checkpoint tocado pelo personagem.
 * Devolve o checkpoint recém-ativado, ou null. Um checkpoint já ativo não
 * responde de novo, então a mensagem não se repete a cada quadro.
 */
export function verificarCheckpoints(player) {
  for (const checkpoint of checkpoints) {
    const tocando = player.x < checkpoint.x + checkpoint.width
      && player.x + player.largura > checkpoint.x
      && player.y < checkpoint.y + checkpoint.height
      && player.y + player.altura > checkpoint.y;

    if (!tocando) continue;

    // O último ativado passa a ser o ponto de retorno.
    if (!checkpoint.ativo) {
      checkpoint.ativo = true;
      ultimoCheckpoint = checkpoint;
      return checkpoint;
    }
  }
  return null;
}

/** Limpeza usada no reinício da fase (RF07): desativa tudo e esquece o retorno. */
export function limparCheckpoints() {
  for (const checkpoint of checkpoints) {
    checkpoint.ativo = false;
  }
  ultimoCheckpoint = null;
}

const CORES = {
  chao: '#4a4e69',
  plataforma: '#6d6875',
  parede: '#9a031e',
  teto: '#5f0f40',
};

// Peças do pacote pedacos_de_chao_pacote. Tamanho nativo: 256 × 80.
const PASTA_PECAS = 'assets/characters/Imagens_Personagens/02_cenario/pedacos_de_chao_pacote/';
const LARGURA_PECA = 256;
// Linha em que a grama começa dentro da peça, em pixels nativos.
// Desenhamos a peça deslocada para que essa linha fique sobre a superfície da colisão.
const SUPERFICIE_PECA = 20;

const pecaNormal = new Image();
pecaNormal.src = `${PASTA_PECAS}chao_normal_256x80.png`;
const pecaAgua = new Image();
pecaAgua.src = `${PASTA_PECAS}chao_agua_256x80.png`;

// Camadas de fundo do pacote fundo_pecas_pacote (dia). Tamanho nativo: 256 × 240.
const PASTA_FUNDO = 'assets/characters/Imagens_Personagens/02_cenario/fundo_pecas_pacote/';
const ALTURA_FUNDO = 240;
const fundoCeu = new Image();
fundoCeu.src = `${PASTA_FUNDO}fundo_ceu_256x240.png`;
const fundoNuvens = new Image();
fundoNuvens.src = `${PASTA_FUNDO}fundo_nuvens_256x240.png`;
const fundoMontanhas = new Image();
fundoMontanhas.src = `${PASTA_FUNDO}fundo_distante_montanhas_256x240.png`;
const fundoFloresta = new Image();
fundoFloresta.src = `${PASTA_FUNDO}fundo_colinas_floresta_256x240.png`;

function pecaCarregada(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

/**
 * Céu: estica uma coluna da imagem por toda a tela. A coluna não tem o sol,
 * então as faixas de cor ficam uniformes e sem repetir o sol.
 */
function desenharCeu(ctx) {
  if (pecaCarregada(fundoCeu)) {
    ctx.drawImage(fundoCeu, 0, 0, 1, ALTURA_FUNDO, 0, 0, LARGURA_FASE, ALTURA_FASE);
    return;
  }
  const gradiente = ctx.createLinearGradient(0, 0, 0, ALTURA_FASE);
  gradiente.addColorStop(0, '#9fd3f5');
  gradiente.addColorStop(1, '#dfe7fd');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, LARGURA_FASE, ALTURA_FASE);
}

/** Repete uma camada de fundo na horizontal, na altura y. */
function desenharCamada(ctx, imagem, y) {
  if (!pecaCarregada(imagem)) return;
  for (let x = 0; x < LARGURA_FASE; x += 256) {
    ctx.drawImage(imagem, x, y);
  }
}

/** Peças de chão repetidas na horizontal. A grama fica na superfície y=480, igual à colisão. */
function desenharChao(ctx) {
  const superficie = 480;
  for (let x = 0; x < LARGURA_FASE; x += LARGURA_PECA) {
    ctx.drawImage(pecaNormal, x, superficie - SUPERFICIE_PECA);
  }
}

/** Água no vão do chão, centralizada no meio do vão. */
function desenharVao(ctx, vao) {
  const centro = vao.x + vao.width / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(vao.x, vao.y, vao.width, vao.height);
  ctx.clip();
  // Na peça de água, a coluna de água fica no centro horizontal (x = 128).
  ctx.drawImage(pecaAgua, centro - LARGURA_PECA / 2, vao.y - SUPERFICIE_PECA);
  ctx.restore();
}

/** Visual provisório da fase, até a aplicação dos assets do Kelvis. */
export function desenharFase(ctx) {
  desenharCeu(ctx);

  // Camadas do fundo, do mais distante para o mais próximo. Todas terminam em y=540,
  // com a mesma escala 1× das peças de chão.
  const yFundo = ALTURA_FASE - ALTURA_FUNDO;
  desenharCamada(ctx, fundoNuvens, 0);
  desenharCamada(ctx, fundoMontanhas, yFundo);
  desenharCamada(ctx, fundoFloresta, yFundo);

  if (pecaCarregada(pecaNormal) && pecaCarregada(pecaAgua)) {
    desenharChao(ctx);
    desenharVao(ctx, { x: 340, y: 480, width: 100, height: 60 });
  }

  for (const obstaculo of obstaculos) {
    if (obstaculo.tipo === 'chao' && pecaCarregada(pecaNormal)) {
      // O chão já foi desenhado pela faixa; só o trecho de colisão precisa existir.
      continue;
    }
    ctx.fillStyle = CORES[obstaculo.tipo] || '#333333';
    ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height);
  }

  for (const checkpoint of checkpoints) {
    // Forma e símbolo diferenciam inativo de ativo, não apenas a cor.
    ctx.lineWidth = 3;
    ctx.strokeStyle = checkpoint.ativo ? '#2a9d8f' : '#8d99ae';
    ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);

    if (checkpoint.ativo) {
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
    }

    ctx.fillStyle = checkpoint.ativo ? '#ffffff' : '#8d99ae';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      checkpoint.ativo ? '✓' : '○',
      checkpoint.x + checkpoint.width / 2,
      checkpoint.y + checkpoint.height / 2 + 7,
    );
    ctx.textAlign = 'left';
  }
}
