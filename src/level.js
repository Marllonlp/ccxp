// Responsável: Dudu. Dados do cenário, obstáculos e checkpoints da fase de teste.
// Convenções acordadas: x cresce para a direita, y cresce para baixo.
// Todo obstáculo é um retângulo com x, y, width e height, em coordenadas do mundo.
// A fase tem LARGURA_FASE de comprimento; a câmera mostra uma janela de LARGURA_TELA.

export const LARGURA_TELA = 960;
export const ALTURA_FASE = 540;
export const LARGURA_FASE = 3200;

// Zoom do mundo: plataformas, totens e chão aparecem 1,5× maiores na tela.
// A física continua nas unidades originais; só o desenho é ampliado.
export const ESCALA_MUNDO = 1.5;
const LARGURA_VISAO = LARGURA_TELA / ESCALA_MUNDO;
const ALTURA_VISAO = ALTURA_FASE / ESCALA_MUNDO;
// A câmera mostra a faixa de baixo da fase: o chão continua encostado na parte de baixo da tela.
const Y_CAMERA = ALTURA_FASE - ALTURA_VISAO;

// Limite inferior da fase (RF04). Pedro usa este valor para detectar a queda.
export const LIMITE_QUEDA = 620;

// Canto superior esquerdo do personagem em pé sobre o chão inicial.
const POSICAO_INICIAL = { x: 40, y: 414 };

// Superfície do chão. Com a colisão em y=480, o personagem fica em pé com os pés em 480.
const SUPERFICIE_CHAO = 480;

// Alcance do pulo: 500 px/s de impulso e 1200 px/s² de gravidade dão cerca de 104 px de altura.
// Por isso plataformas e paredes ficam até 90 px acima do chão, e vãos têm no máximo 100 px.

// Obstáculos sólidos. O campo "tipo" define o visual provisório ou a peça de cenário.
export const obstaculos = [
  // --- Trecho inicial ---
  { tipo: 'chao', x: 0, y: SUPERFICIE_CHAO, width: 340, height: 60 },
  { tipo: 'chao', x: 440, y: SUPERFICIE_CHAO, width: 520, height: 60 },
  { tipo: 'plataforma', x: 120, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 270, y: 310, width: 110, height: 20 },

  // Bloco suspenso: deixa 50 px livres até o chão, o que só permite passar agachado.
  { tipo: 'teto', x: 620, y: 330, width: 160, height: 100 },

  // Degrau baixo: alto o bastante para exigir o pulo, baixo o bastante para ser vencido.
  { tipo: 'parede', x: 860, y: 400, width: 40, height: 80 },

  // --- Escadaria de plataformas ---
  { tipo: 'chao', x: 960, y: SUPERFICIE_CHAO, width: 340, height: 60 },
  { tipo: 'plataforma', x: 1000, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 1160, y: 310, width: 110, height: 20 },
  { tipo: 'plataforma', x: 1320, y: 390, width: 110, height: 20 },

  // --- Chão de cristais e teto baixo ---
  { tipo: 'chao_cristal', x: 1300, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'chao', x: 1800, y: SUPERFICIE_CHAO, width: 500, height: 60 },
  { tipo: 'teto', x: 1950, y: 330, width: 200, height: 100 },

  // --- Trecho final com degraus e paredes baixas ---
  { tipo: 'chao_cristal', x: 2400, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'plataforma', x: 2500, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 2650, y: 310, width: 110, height: 20 },
  { tipo: 'chao', x: 2800, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'parede', x: 2900, y: 400, width: 40, height: 80 },
  { tipo: 'parede', x: 3050, y: 400, width: 40, height: 80 },
];

// Vãos com água. O personagem cai neles e volta ao ponto seguro.
export const vaos = [
  { x: 340, y: SUPERFICIE_CHAO, width: 100, height: 60 },
  { x: 1700, y: SUPERFICIE_CHAO, width: 100, height: 60 },
  { x: 2300, y: SUPERFICIE_CHAO, width: 100, height: 60 },
];

// Checkpoints (RF08) são totens de 32 × 64 em pé sobre o chão (superfície em y=480).
// A área é apenas de contato: eles não bloqueiam a passagem.
// posicaoSegura é o canto superior esquerdo do personagem em pé sobre o chão.
// totem indica o modelo do pacote plataformas_totens_pacote.
export const checkpoints = [
  {
    id: 'cp1',
    x: 280, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 275, y: 414 },
    totem: 'tela',
    ativo: false,
  },
  {
    id: 'cp2',
    x: 500, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 495, y: 414 },
    totem: 'obelisco',
    ativo: false,
  },
  {
    id: 'cp3',
    x: 1480, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 1475, y: 414 },
    totem: 'terminal',
    ativo: false,
  },
  {
    id: 'cp4',
    x: 2420, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 2415, y: 414 },
    totem: 'antena',
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

/**
 * Câmera horizontal: mantém o personagem perto do centro da tela e não deixa
 * a janela sair dos limites da fase.
 */
export function calcularCamera(xPersonagem, larguraPersonagem) {
  const centro = xPersonagem + larguraPersonagem / 2 - LARGURA_VISAO / 2;
  const maximo = LARGURA_FASE - LARGURA_VISAO;
  return Math.round(Math.min(Math.max(centro, 0), maximo));
}

/**
 * Aplica zoom e câmera no contexto. Use com save/restore para desenhar elementos
 * do mundo (o personagem, por exemplo) na mesma escala do cenário.
 */
export function aplicarCameraMundo(ctx, cameraX) {
  // Pixel art ampliada: sem suavização, para as bordas continuarem nítidas.
  ctx.imageSmoothingEnabled = false;
  ctx.scale(ESCALA_MUNDO, ESCALA_MUNDO);
  ctx.translate(-cameraX, -Y_CAMERA);
}

const CORES = {
  chao: '#4a4e69',
  chao_cristal: '#4a4e69',
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
const pecaCristal = new Image();
pecaCristal.src = `${PASTA_PECAS}chao_cristais_256x80.png`;
const pecaAgua = new Image();
pecaAgua.src = `${PASTA_PECAS}chao_agua_256x80.png`;

// Plataformas e totens do pacote plataformas_totens_pacote.
// A plataforma terra (96 × 24) é esticada até a largura da colisão. Cada totem tem a versão
// inativa (1 quadro) e a ativa (4 quadros lado a lado, 32 × 64 cada).
const PASTA_PLATAFORMAS = 'assets/characters/Imagens_Personagens/02_cenario/plataformas_totens_pacote/';
const ALTURA_PLATAFORMA = 24;
// A grama fica no topo da peça: sobe a imagem para que a superfície fique sobre a colisão.
const SOBRA_PLATAFORMA = 4;
const FPS_TOTEM_ATIVO = 8;
const QUADROS_TOTEM_ATIVO = 4;

function carregarImagem(arquivo) {
  const imagem = new Image();
  imagem.src = `${PASTA_PLATAFORMAS}${arquivo}`;
  return imagem;
}

const plataformaTerra = carregarImagem('plataforma_terra_96x24_1f.png');

const totens = {
  antena: {
    inativo: carregarImagem('totem_antena_inativo_32x64.png'),
    ativo: carregarImagem('totem_antena_ativo_32x64_4f.png'),
  },
  obelisco: {
    inativo: carregarImagem('totem_obelisco_inativo_32x64.png'),
    ativo: carregarImagem('totem_obelisco_ativo_32x64_4f.png'),
  },
  tela: {
    inativo: carregarImagem('totem_tela_inativo_32x64.png'),
    ativo: carregarImagem('totem_tela_ativo_32x64_4f.png'),
  },
  terminal: {
    inativo: carregarImagem('totem_terminal_inativo_32x64.png'),
    ativo: carregarImagem('totem_terminal_ativo_32x64_4f.png'),
  },
};

// Obstáculos do pacote obstaculo_pilha_pacote: pilhas de computadores animadas em 4 quadros.
// Parede (40 × 80) usa a torre (44 × 80). Teto (160 × 100) é montado com pilhas médias e baixas.
const PASTA_PILHA = 'assets/characters/Imagens_Personagens/02_cenario/obstaculo_pilha_pacote/';
const FPS_PILHA = 6;
const QUADROS_PILHA = 4;

function carregarPilha(arquivo) {
  const imagem = new Image();
  imagem.src = `${PASTA_PILHA}${arquivo}`;
  return imagem;
}

const pilhaTorre = carregarPilha('obstaculo_pilha_torre_44x80_4f.png');
const pilhaMedia = carregarPilha('obstaculo_pilha_media_40x52_4f.png');
const pilhaBaixa = carregarPilha('obstaculo_pilha_baixa_40x40_4f.png');

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

// Fator de rolagem de cada camada: quanto menor, mais distante ela parece.
const FATOR_NUVENS = 0.1;
// Velocidade própria das nuvens, em px/s: andam devagar para a esquerda, mesmo com o Byte parado.
const VELOCIDADE_NUVENS = 8;
const FATOR_MONTANHAS = 0.25;
const FATOR_FLORESTA = 0.5;

function pecaCarregada(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

/**
 * Céu: estica uma coluna da imagem por toda a tela. A coluna não tem o sol,
 * então as faixas de cor ficam uniformes e sem repetir o sol.
 */
function desenharCeu(ctx) {
  if (pecaCarregada(fundoCeu)) {
    ctx.drawImage(fundoCeu, 0, 0, 1, ALTURA_FUNDO, 0, 0, LARGURA_TELA, ALTURA_FASE);
    return;
  }
  const gradiente = ctx.createLinearGradient(0, 0, 0, ALTURA_FASE);
  gradiente.addColorStop(0, '#9fd3f5');
  gradiente.addColorStop(1, '#dfe7fd');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_FASE);
}

/**
 * Repete uma camada de fundo na horizontal, na altura y. A camada anda mais
 * devagar que a câmera conforme o fator; o deslocamento volta a zero a cada peça.
 */
function desenharCamada(ctx, imagem, y, cameraX, fator, velocidadeAutomatica = 0) {
  if (!pecaCarregada(imagem)) return;
  // velocidadeAutomatica (px/s) faz a camada andar sozinha, mesmo com a câmera parada.
  const tempo = performance.now() / 1000;
  const deslocamento = (cameraX * fator + tempo * velocidadeAutomatica) % LARGURA_PECA;
  for (let x = -deslocamento; x < LARGURA_TELA; x += LARGURA_PECA) {
    ctx.drawImage(imagem, Math.round(x), y);
  }
}

/** Chão de um obstáculo, repetindo a peça e cortando o que passa das bordas. */
function desenharTrechoChao(ctx, obstaculo, peca) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height);
  ctx.clip();
  for (let x = obstaculo.x; x < obstaculo.x + obstaculo.width; x += LARGURA_PECA) {
    ctx.drawImage(peca, x, obstaculo.y - SUPERFICIE_PECA);
  }
  ctx.restore();
}

/** Água do vão, com a coluna de água centralizada no meio do vão. */
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

/** Desenha os elementos do mundo. Chamado com a câmera já aplicada no contexto. */
function desenharMundo(ctx) {
  const pecasCarregadas = pecaCarregada(pecaNormal) && pecaCarregada(pecaAgua);

  for (const vao of vaos) {
    if (pecasCarregadas) {
      desenharVao(ctx, vao);
    } else {
      ctx.fillStyle = '#2a6f97';
      ctx.fillRect(vao.x, vao.y, vao.width, vao.height);
    }
  }

  for (const obstaculo of obstaculos) {
    if (obstaculo.tipo === 'plataforma' && pecaCarregada(plataformaTerra)) {
      desenharPlataforma(ctx, obstaculo);
      continue;
    }

    if (obstaculo.tipo === 'parede' && pecaCarregada(pilhaTorre)) {
      desenharParedePilha(ctx, obstaculo);
      continue;
    }

    if (obstaculo.tipo === 'teto' && pecaCarregada(pilhaMedia) && pecaCarregada(pilhaBaixa)) {
      desenharTetoPilha(ctx, obstaculo);
      continue;
    }

    const peca = obstaculo.tipo === 'chao' ? pecaNormal
      : obstaculo.tipo === 'chao_cristal' ? pecaCristal
      : null;

    if (peca && pecaCarregada(peca)) {
      desenharTrechoChao(ctx, obstaculo, peca);
      continue;
    }
    ctx.fillStyle = CORES[obstaculo.tipo] || '#333333';
    ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height);
  }

  const tempo = performance.now() / 1000;
  for (const checkpoint of checkpoints) {
    desenharTotem(ctx, checkpoint, tempo);
  }
}

/** Plataforma flutuante: a peça de terra é esticada até a largura da colisão. */
function desenharPlataforma(ctx, obstaculo) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    plataformaTerra,
    obstaculo.x,
    obstaculo.y - SOBRA_PLATAFORMA,
    obstaculo.width,
    ALTURA_PLATAFORMA,
  );
  ctx.restore();
}

/** Desenha um quadro da animação de uma folha de sprites com 4 quadros lado a lado. */
function desenharQuadroPilha(ctx, imagem, larguraQuadro, alturaQuadro, dx, dy, tempo) {
  const quadro = Math.floor(tempo * FPS_PILHA) % QUADROS_PILHA;
  ctx.drawImage(imagem, quadro * larguraQuadro, 0, larguraQuadro, alturaQuadro,
    Math.round(dx), Math.round(dy), larguraQuadro, alturaQuadro);
}

/** Parede: a torre (44 × 80) fica centralizada na colisão de 40 px e apoiada no chão. */
function desenharParedePilha(ctx, obstaculo) {
  const tempo = performance.now() / 1000;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  desenharQuadroPilha(ctx, pilhaTorre, 44, 80,
    obstaculo.x + obstaculo.width / 2 - 22,
    obstaculo.y + obstaculo.height - 80,
    tempo);
  ctx.restore();
}

/** Teto suspenso (160 × 100): pilhas baixas em cima e médias embaixo, em colunas de 40 px. */
function desenharTetoPilha(ctx, obstaculo) {
  const tempo = performance.now() / 1000;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let x = obstaculo.x; x < obstaculo.x + obstaculo.width; x += 40) {
    desenharQuadroPilha(ctx, pilhaBaixa, 40, 40, x, obstaculo.y + 8, tempo);
    desenharQuadroPilha(ctx, pilhaMedia, 40, 52, x, obstaculo.y + obstaculo.height - 52, tempo);
  }
  ctx.restore();
}

/**
 * Totem do checkpoint. Inativo: imagem parada. Ativo (tocado): versão animada em 4 quadros.
 * A troca acontece quando verificarCheckpoints marca o checkpoint como ativo.
 */
function desenharTotem(ctx, checkpoint, tempo) {
  const modelo = totens[checkpoint.totem];
  const imagem = checkpoint.ativo ? modelo.ativo : modelo.inativo;

  if (!pecaCarregada(imagem)) {
    // Sem imagem carregada: mostra um retângulo simples, na mesma área de contato.
    ctx.fillStyle = checkpoint.ativo ? '#2a9d8f' : '#8d99ae';
    ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
    return;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (checkpoint.ativo) {
    const quadro = Math.floor(tempo * FPS_TOTEM_ATIVO) % QUADROS_TOTEM_ATIVO;
    ctx.drawImage(imagem, quadro * checkpoint.width, 0, checkpoint.width, checkpoint.height,
      checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
  } else {
    ctx.drawImage(imagem, checkpoint.x, checkpoint.y);
  }
  ctx.restore();
}

/**
 * Desenha o cenário inteiro para a câmera em cameraX: céu e camadas de fundo
 * (com rolagem em parallax) e, por último, o mundo. O personagem é desenhado
 * por quem chama, dentro da mesma translação da câmera.
 */
export function desenharFase(ctx, cameraX = 0) {
  desenharCeu(ctx);

  // Camadas do fundo, da mais distante para a mais próxima.
  const yFundo = ALTURA_FASE - ALTURA_FUNDO;
  desenharCamada(ctx, fundoNuvens, 0, cameraX, FATOR_NUVENS, VELOCIDADE_NUVENS);
  desenharCamada(ctx, fundoMontanhas, yFundo, cameraX, FATOR_MONTANHAS);
  desenharCamada(ctx, fundoFloresta, yFundo, cameraX, FATOR_FLORESTA);

  ctx.save();
  aplicarCameraMundo(ctx, cameraX);
  desenharMundo(ctx);
  ctx.restore();
}
