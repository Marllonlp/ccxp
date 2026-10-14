// Responsável: Dudu. Dados do cenário, obstáculos e checkpoints da fase de teste.
// Convenções acordadas: x cresce para a direita, y cresce para baixo.
// Todo obstáculo é um retângulo com x, y, width e height, em coordenadas do mundo.
// A fase tem LARGURA_FASE de comprimento; a janela visível se adapta à tela.

import { calcularVisao } from './viewport.js';
import { AnimacaoGIF } from './player.js';
import { criarMecanica, ligarMecanicas } from './mecanicas.js';
import { FASES_EXTRA } from './fasesExtra.js';

export const LARGURA_TELA = 960;
export const ALTURA_FASE = 540;
export let LARGURA_FASE = 3200;

// A escala acompanha a altura disponível; a física mantém as unidades do mapa.
const VISAO_PADRAO = calcularVisao(LARGURA_TELA, ALTURA_FASE);

// Limite inferior da fase (RF04). Pedro usa este valor para detectar a queda.
export const LIMITE_QUEDA = 620;

// Canto superior esquerdo do personagem em pé sobre o chão inicial.
let posicaoInicial = { x: 40, y: 414 };

// Superfície do chão. Com a colisão em y=480, o personagem fica em pé com os pés em 480.
const SUPERFICIE_CHAO = 480;

// Alcance do pulo: 500 px/s de impulso e 1200 px/s² de gravidade dão cerca de 104 px de altura.
// Por isso plataformas e paredes ficam até 90 px acima do chão, e vãos têm no máximo 100 px.

// Obstáculos sólidos. O campo "tipo" define o visual provisório ou a peça de cenário.
const OBSTACULOS_FASE_1 = [
  // --- Trecho inicial ---
  { tipo: 'chao', x: 0, y: SUPERFICIE_CHAO, width: 340, height: 60 },
  { tipo: 'chao', x: 660, y: SUPERFICIE_CHAO, width: 520, height: 60 },
  // Sem plataformas sobre o primeiro vão: o jogador precisa passar pela pergunta da ponte.

  // Bloco suspenso: deixa 50 px livres até o chão, o que só permite passar agachado.
  { tipo: 'teto', x: 840, y: 330, width: 160, height: 100 },

  // Degrau baixo: alto o bastante para exigir o pulo, baixo o bastante para ser vencido.
  { tipo: 'parede', x: 1080, y: 400, width: 40, height: 80 },

  // --- Escadaria de plataformas ---
  { tipo: 'chao', x: 1180, y: SUPERFICIE_CHAO, width: 340, height: 60 },
  { tipo: 'plataforma', x: 1220, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 1380, y: 310, width: 110, height: 20 },
  { tipo: 'plataforma', x: 1540, y: 390, width: 110, height: 20 },

  // --- Chão de cristais e teto baixo ---
  { tipo: 'chao_cristal', x: 1520, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'chao', x: 2020, y: SUPERFICIE_CHAO, width: 500, height: 60 },
  { tipo: 'teto', x: 2170, y: 330, width: 200, height: 100 },

  // --- Trecho final com degraus e paredes baixas ---
  { tipo: 'chao_cristal', x: 2620, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'plataforma', x: 2720, y: 390, width: 110, height: 20 },
  { tipo: 'plataforma', x: 2870, y: 310, width: 110, height: 20 },
  { tipo: 'chao', x: 3020, y: SUPERFICIE_CHAO, width: 400, height: 60 },
  { tipo: 'parede', x: 3120, y: 400, width: 40, height: 80 },
];

// Vãos com água. O personagem cai neles e volta ao ponto seguro.
// `desafio` (opcional): pergunta de ponte feita na borda esquerda; acertar constrói a ponte.
const VAOS_FASE_1 = [
  // Rio largo (320 px): maior que o alcance do pulo (~250 px), só se atravessa pela ponte.
  { x: 340, y: SUPERFICIE_CHAO, width: 320, height: 60, desafio: 'F1-P1' },
  { x: 1920, y: SUPERFICIE_CHAO, width: 100, height: 60, desafio: 'F1-P2' },
  { x: 2520, y: SUPERFICIE_CHAO, width: 100, height: 60 },
];

// Plantas distribuídas pelo chão, pelas plataformas e pelo bloco suspenso inicial.
// superficieY é o topo da superfície em que cada planta fica apoiada.
const PLANTAS_FASE_1 = [
  { id: 'planta-2', x: 900, superficieY: 330 },
  { id: 'planta-4', x: 2040, superficieY: SUPERFICIE_CHAO },
  { id: 'planta-5', x: 2904, superficieY: 310 },
  // Guarda a saída da fase: a pergunta aparece ao chegar perto.
  { id: 'planta-6', x: 3340, superficieY: SUPERFICIE_CHAO, desafio: 'F1-M3' },
];

// Coletáveis: moedas ficam em caminhos de progressão e corações recompensam
// a exploração sem permitir ultrapassar o limite inicial de três vidas.
const MOEDAS_FASE_1 = [
  { id: 'moeda-3', x: 740, y: 430, coletado: false },
  { id: 'moeda-4', x: 1265, y: 350, coletado: false },
  { id: 'moeda-5', x: 1425, y: 270, coletado: false },
  { id: 'moeda-6', x: 1760, y: 430, coletado: false },
  { id: 'moeda-7', x: 2100, y: 430, coletado: false },
  { id: 'moeda-8', x: 2780, y: 350, coletado: false },
  { id: 'moeda-9', x: 2915, y: 270, coletado: false },
  { id: 'moeda-10', x: 3170, y: 430, coletado: false },
];

// `desafio`: pergunta feita ao tocar o coração. Acertar recupera a vida; errar faz o coração sumir.
const VIDAS_FASE_1 = [
  { id: 'vida-1', x: 2400, y: 448, coletado: false, desafio: 'F1-V1' },
  { id: 'vida-2', x: 3100, y: 448, coletado: false, desafio: 'F1-V2' },
];

const moedaSprite = new AnimacaoGIF('assets/characters/Imagens_Personagens/04_vidas_e_itens/07_moeda.gif');
const vidaItemSprite = new AnimacaoGIF('assets/characters/Imagens_Personagens/04_vidas_e_itens/06_vida_item.gif');

export function limparColetaveis() {
  for (const item of [...moedas, ...vidasItens]) item.coletado = false;
}

// Campo de patrulha: início e fim delimitam toda a área ocupada pelo robô.
// Cada campo fica sobre uma superfície contínua, sem invadir paredes ou vãos.
// `desafio` (opcional): pergunta feita ao chegar perto; acertar desativa o robô.
const PATRULHAS_FASE_1 = [
  {
    id: 'sentinela-1',
    desafio: 'F1-M1',
    inicioX: 1755,
    fimX: 1865,
    superficieY: SUPERFICIE_CHAO,
    velocidade: 80,
  },
  {
    id: 'sentinela-2',
    inicioX: 1228,
    fimX: 1322,
    superficieY: 390,
    velocidade: 65,
  },
  {
    id: 'sentinela-4',
    desafio: 'F1-M2',
    inicioX: 3005,
    fimX: 3090,
    superficieY: SUPERFICIE_CHAO,
    velocidade: 90,
  },
];

// Checkpoints (RF08) são totens de 32 × 64 em pé sobre o chão (superfície em y=480).
// A área é apenas de contato: eles não bloqueiam a passagem.
// posicaoSegura é o canto superior esquerdo do personagem em pé sobre o chão.
// totem indica o modelo do pacote plataformas_totens_pacote.
const CHECKPOINTS_FASE_1 = [
  {
    id: 'cp1',
    x: 280, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 275, y: 414 },
    totem: 'tela',
    missao: 1,
    ativo: false,
  },
  {
    id: 'cp2',
    x: 720, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 715, y: 414 },
    totem: 'obelisco',
    ativo: false,
  },
  {
    id: 'cp3',
    x: 1700, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 1695, y: 414 },
    totem: 'terminal',
    ativo: false,
  },
  {
    id: 'cp4',
    x: 2640, y: 416, width: 32, height: 64,
    posicaoSegura: { x: 2635, y: 414 },
    totem: 'antena',
    ativo: false,
  },
];

let ultimoCheckpoint = null;

// Dados que a fase carregada usa. Trocados por carregarFase().
export let obstaculos = [];
export let vaos = [];
export let checkpoints = [];
// Inimigos e coletáveis da fase carregada. Trocados por carregarFase().
export let plantas = [];
export let moedas = [];
export let vidasItens = [];
export let patrulhasSentinelas = [];
let metaAtual = null;
let indiceFase = 0;
// Mecânicas da fase carregada (perigos, plataformas móveis, máquinas). Trocadas por carregarFase().
export let mecanicasDaFase = [];

/** Volta as mecânicas ao início, para uma nova partida da mesma fase. */
export function reiniciarMecanicas() {
  for (const mecanica of mecanicasDaFase) mecanica.reiniciar();
}

/**
 * Fases do jogo, na ordem. A meta é o ponto de chegada: tocar nela conclui a fase.
 * `titulo` (opcional) e `texto` aparecem na caixa de texto da tela do nível, antes da partida.
 */
const FASES = [
  {
    nome: 'Nível 01',
    subtitulo: 'Byte',
    titulo: 'Laboratório das Variáveis',
    texto: 'Mostrar mensagens com print() e guardar valores em variáveis com =. Texto vai entre aspas; número, sem aspas.',
    larguraFase: 3420,
    posicaoInicial: { x: 40, y: 414 },
    obstaculos: OBSTACULOS_FASE_1,
    vaos: VAOS_FASE_1,
    checkpoints: CHECKPOINTS_FASE_1,
    plantas: PLANTAS_FASE_1,
    moedas: MOEDAS_FASE_1,
    vidasItens: VIDAS_FASE_1,
    patrulhas: PATRULHAS_FASE_1,
    meta: { x: 3340, y: 416, width: 32, height: 64 },
  },
  ...FASES_EXTRA,
];

/** Nome e texto de cada fase, para as telas de níveis e de início. */
export const infoFases = FASES.map(({ nome, subtitulo, titulo, texto }) => ({ nome, subtitulo, titulo, texto }));
export const quantidadeFases = FASES.length;

/** Carrega a fase de índice `indice` (0 = primeira): cenário, vãos, checkpoints, meta e início. */
export function carregarFase(indice) {
  const fase = FASES[indice];
  indiceFase = indice;
  // Cópias: as pontes construídas durante a partida não alteram o desenho original da fase.
  mecanicasDaFase = (fase.mecanicas ?? []).map((spec) => criarMecanica(spec));
  ligarMecanicas(mecanicasDaFase);
  obstaculos = [...fase.obstaculos, ...mecanicasDaFase.flatMap((mecanica) => mecanica.rects)];
  vaos = fase.vaos.map((vao) => ({ ...vao, ponte: false, desafioFeito: false }));
  checkpoints = fase.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    posicaoSegura: { ...checkpoint.posicaoSegura },
    ativo: false,
  }));
  plantas = fase.plantas.map((planta) => ({ ...planta }));
  moedas = fase.moedas.map((moeda) => ({ ...moeda, coletado: false }));
  vidasItens = fase.vidasItens.map((vida) => ({ ...vida, coletado: false }));
  patrulhasSentinelas = fase.patrulhas.map((patrulha) => ({ ...patrulha }));
  LARGURA_FASE = fase.larguraFase;
  posicaoInicial = { ...fase.posicaoInicial };
  metaAtual = { ...fase.meta };
  ultimoCheckpoint = null;
}

/** Índice (0 = primeira) da fase carregada. */
export function indiceFaseAtual() {
  return indiceFase;
}

/**
 * Verdadeiro quando o personagem alcança a meta da fase. Vale em qualquer altura: quem pula por cima
 * da antena também conclui, em vez de passar dela e cair no fim do mapa.
 */
export function verificarMeta(player) {
  return player.x + player.largura > metaAtual.x;
}

// Distância antes da borda do vão em que a pergunta de ponte aparece.
const ALCANCE_DESAFIO_PONTE = 50;

// Altura acima do chão em que a pergunta ainda aparece: pega também quem tenta pular o vão.
const ALTURA_DESAFIO_PONTE = 120;

/**
 * Vão com desafio ainda não feito, cuja borda esquerda o personagem alcançou, andando ou pulando.
 * Devolve o vão, ou null.
 */
export function verificarDesafioPonte(player) {
  const pes = player.y + player.altura;
  const direita = player.x + player.largura;
  return vaos.find((vao) => vao.desafio && !vao.desafioFeito
    && pes <= vao.y + 2 && pes > vao.y - ALTURA_DESAFIO_PONTE
    && direita > vao.x - ALCANCE_DESAFIO_PONTE && direita <= vao.x + 2) ?? null;
}

/** Cobre o vão com uma ponte sólida. */
export function construirPonte(vao) {
  vao.ponte = true;
  obstaculos.push({ tipo: 'ponte', x: vao.x, y: vao.y, width: vao.width, height: 20 });
}

/** Reinício da fase: desfaz as pontes e volta a perguntar nos vãos. */
export function limparPontes() {
  obstaculos = obstaculos.filter((obstaculo) => obstaculo.tipo !== 'ponte');
  for (const vao of vaos) {
    vao.ponte = false;
    vao.desafioFeito = false;
  }
}

/** Posição inicial da fase. Devolve uma copia para ninguém alterar o original. */
export function obterPosicaoInicial() {
  return { x: posicaoInicial.x, y: posicaoInicial.y };
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
export function calcularCamera(xPersonagem, larguraPersonagem, visao = VISAO_PADRAO) {
  const centro = xPersonagem + larguraPersonagem / 2 - visao.larguraMundo / 2;
  const maximo = Math.max(0, LARGURA_FASE - visao.larguraMundo);
  return Math.round(Math.min(Math.max(centro, 0), maximo));
}

// Acompanha saltos nas plataformas altas para manter o personagem visível.
export function calcularCameraVertical(yPersonagem, visao = VISAO_PADRAO, margemSuperior = 72) {
  return Math.max(0, Math.min(visao.cameraY, yPersonagem - margemSuperior / visao.escala));
}

/**
 * Aplica zoom e câmera no contexto. Use com save/restore para desenhar elementos
 * do mundo (o personagem, por exemplo) na mesma escala do cenário.
 */
export function aplicarCameraMundo(ctx, cameraX, visao = VISAO_PADRAO, cameraY = visao.cameraY) {
  // Pixel art ampliada: sem suavização, para as bordas continuarem nítidas.
  ctx.imageSmoothingEnabled = false;
  ctx.scale(visao.escala, visao.escala);
  ctx.translate(-cameraX, -cameraY);
}

const CORES = {
  chao: '#4a4e69',
  chao_cristal: '#4a4e69',
  plataforma: '#6d6875',
  parede: '#9a031e',
  teto: '#5f0f40',
  ponte: '#6b7280',
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
// Mesma peça de água, com a ponte por cima: usada nos vãos em que o desafio foi resolvido.
const pecaPonte = new Image();
pecaPonte.src = `${PASTA_PECAS}chao_ponte_256x80.png`;

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

// Outros estilos de plataforma (cristal, metal, holo). Cada largura tem a sua peça desenhada,
// então a imagem só é esticada quando a largura da colisão não existe no pacote.
// As peças são carregadas já ao abrir o jogo, para a plataforma não trocar de visual no meio da fase,
// e só o primeiro quadro é usado: a plataforma fica sempre igual, sem piscar.
const LARGURAS_PLATAFORMA = [32, 48, 64, 80, 96, 128];
const QUADROS_PLATAFORMA = { terra: 1, cristal: 1, metal: 2, holo: 4 };
const pecasPlataforma = new Map();
for (const [estilo, quadros] of Object.entries(QUADROS_PLATAFORMA)) {
  for (const tamanho of LARGURAS_PLATAFORMA) {
    pecasPlataforma.set(`${estilo}_${tamanho}`, { imagem: carregarImagem(`plataforma_${estilo}_${tamanho}x24_${quadros}f.png`), tamanho });
  }
}

function pecaPlataforma(estilo, largura) {
  const tamanho = LARGURAS_PLATAFORMA.includes(largura) ? largura : 96;
  return pecasPlataforma.get(`${estilo}_${tamanho}`) ?? null;
}

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
function desenharCeu(ctx, visao) {
  if (pecaCarregada(fundoCeu)) {
    ctx.drawImage(fundoCeu, 0, 0, 1, ALTURA_FUNDO, 0, 0, visao.largura, visao.altura);
    return;
  }
  const gradiente = ctx.createLinearGradient(0, 0, 0, visao.altura);
  gradiente.addColorStop(0, '#9fd3f5');
  gradiente.addColorStop(1, '#dfe7fd');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, visao.largura, visao.altura);
}

/**
 * Repete uma camada de fundo na horizontal, na altura y. A camada anda mais
 * devagar que a câmera conforme o fator; o deslocamento volta a zero a cada peça.
 */
function desenharCamada(ctx, imagem, y, cameraX, fator, visao, velocidadeAutomatica = 0) {
  if (!pecaCarregada(imagem)) return;
  // velocidadeAutomatica (px/s) faz a camada andar sozinha, mesmo com a câmera parada.
  const tempo = performance.now() / 1000;
  const escala = visao.altura / ALTURA_FASE;
  const larguraPeca = LARGURA_PECA * escala;
  const deslocamento = ((cameraX * fator + tempo * velocidadeAutomatica) * escala) % larguraPeca;
  for (let x = -deslocamento; x < visao.largura; x += larguraPeca) {
    ctx.drawImage(imagem, Math.round(x), y, larguraPeca, ALTURA_FUNDO * escala);
  }
}

/** Chão de um obstáculo, repetindo a peça e cortando o que passa das bordas. */
function desenharTrechoChao(ctx, obstaculo, peca, limiteInferior) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(obstaculo.x, obstaculo.y, obstaculo.width, Math.max(obstaculo.height, limiteInferior - obstaculo.y));
  ctx.clip();
  for (let x = obstaculo.x; x < obstaculo.x + obstaculo.width; x += LARGURA_PECA) {
    ctx.drawImage(peca, x, obstaculo.y - SUPERFICIE_PECA);
    // Repete apenas a textura de terra para completar a faixa sob os controles.
    for (let y = obstaculo.y + obstaculo.height; y < limiteInferior; y += 32) {
      ctx.drawImage(peca, 0, 48, LARGURA_PECA, 32, x, y, LARGURA_PECA, 32);
    }
  }
  ctx.restore();
}

// Colunas das peças de água e de ponte, em pixels nativos: a borda de cada margem e um trecho do meio
// que se repete para cobrir vãos de qualquer largura. O trecho de 48 px mantém os postes da ponte a cada 16 px.
const COLUNAS_AGUA = { esquerda: [92, 100], meio: [100, 148], direita: [156, 164] };
const COLUNAS_PONTE = { esquerda: [86, 100], meio: [100, 148], direita: [156, 170] };
// Altura da peça (80) e faixa de terra/água repetida abaixo dela (linhas 48 a 80).
const ALTURA_PECA = 80;

/** Água (ou ponte) do vão: margens nas bordas e o meio repetido até cobrir toda a largura. */
function desenharVao(ctx, vao, limiteInferior) {
  const ponte = vao.ponte && pecaCarregada(pecaPonte);
  const peca = ponte ? pecaPonte : pecaAgua;
  const colunas = ponte ? COLUNAS_PONTE : COLUNAS_AGUA;
  const topo = vao.y - SUPERFICIE_PECA;
  const fim = vao.x + vao.width;

  // Desenha as colunas [inicio, final) da peça em x, e a faixa de baixo repetida até o limite inferior.
  const coluna = ([inicio, final], x, largura = final - inicio) => {
    ctx.drawImage(peca, inicio, 0, largura, ALTURA_PECA, x, topo, largura, ALTURA_PECA);
    for (let y = topo + ALTURA_PECA; y < limiteInferior; y += 32) {
      ctx.drawImage(pecaAgua, inicio, 48, largura, 32, x, y, largura, 32);
    }
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(vao.x, topo, vao.width, Math.max(ALTURA_PECA, limiteInferior - topo));
  ctx.clip();
  const larguraEsquerda = colunas.esquerda[1] - colunas.esquerda[0];
  const larguraDireita = colunas.direita[1] - colunas.direita[0];
  const larguraMeio = colunas.meio[1] - colunas.meio[0];
  for (let x = vao.x + larguraEsquerda; x < fim - larguraDireita; x += larguraMeio) {
    coluna(colunas.meio, x, Math.min(larguraMeio, fim - larguraDireita - x));
  }
  coluna(colunas.esquerda, vao.x);
  coluna(colunas.direita, fim - larguraDireita);
  ctx.restore();
}

/** Desenha os elementos do mundo. Chamado com a câmera já aplicada no contexto. */
function desenharMundo(ctx, limiteInferior) {
  const pecasCarregadas = pecaCarregada(pecaNormal) && pecaCarregada(pecaAgua);

  for (const vao of vaos) {
    if (pecasCarregadas) {
      desenharVao(ctx, vao, limiteInferior);
    } else {
      ctx.fillStyle = '#2a6f97';
      ctx.fillRect(vao.x, vao.y, vao.width, Math.max(vao.height, limiteInferior - vao.y));
    }
  }

  for (const obstaculo of obstaculos) {
    // A ponte é desenhada junto com o vão, em desenharVao.
    if (obstaculo.tipo === 'ponte' && pecasCarregadas) continue;
    if (obstaculo.mecanica) continue;

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
      desenharTrechoChao(ctx, obstaculo, peca, limiteInferior);
      continue;
    }
    ctx.fillStyle = CORES[obstaculo.tipo] || '#333333';
    const altura = obstaculo.tipo.startsWith('chao')
      ? Math.max(obstaculo.height, limiteInferior - obstaculo.y)
      : obstaculo.height;
    ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.width, altura);
  }

  const tempo = performance.now() / 1000;
  for (const checkpoint of checkpoints) {
    desenharTotem(ctx, checkpoint, tempo);
  }

  for (const moeda of moedas) {
    if (!moeda.coletado) {
      moedaSprite.desenhar(ctx, tempo, moeda.x, moeda.y, 16, 16);
    }
  }
  for (const vida of vidasItens) {
    if (!vida.coletado) {
      vidaItemSprite.desenhar(ctx, tempo, vida.x, vida.y, 16, 16);
    }
  }
  if (metaAtual) {
    desenharTotem(ctx, { ...metaAtual, totem: 'antena', ativo: true }, tempo);
  }
}

/**
 * Plataforma flutuante. Sem estilo, a peça de terra é esticada até a largura da colisão;
 * com estilo (cristal, metal, holo), usa sempre o primeiro quadro da peça da mesma largura.
 */
function desenharPlataforma(ctx, obstaculo) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const peca = obstaculo.estilo ? pecaPlataforma(obstaculo.estilo, obstaculo.width) : null;
  if (peca) {
    // Enquanto a peça não carrega, não desenha nada: assim a plataforma nunca troca de visual.
    if (pecaCarregada(peca.imagem)) {
      ctx.drawImage(
        peca.imagem,
        0, 0, peca.tamanho, ALTURA_PLATAFORMA,
        obstaculo.x, obstaculo.y - SOBRA_PLATAFORMA, obstaculo.width, ALTURA_PLATAFORMA,
      );
    }
  } else {
    ctx.drawImage(
      plataformaTerra,
      obstaculo.x,
      obstaculo.y - SOBRA_PLATAFORMA,
      obstaculo.width,
      ALTURA_PLATAFORMA,
    );
  }
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
export function desenharFase(ctx, cameraX = 0, visao = VISAO_PADRAO, cameraY = visao.cameraY) {
  desenharCeu(ctx, visao);

  // Camadas do fundo, da mais distante para a mais próxima.
  const yFundo = visao.altura * (1 - ALTURA_FUNDO / ALTURA_FASE);
  desenharCamada(ctx, fundoNuvens, 0, cameraX, FATOR_NUVENS, visao, VELOCIDADE_NUVENS);
  desenharCamada(ctx, fundoMontanhas, yFundo, cameraX, FATOR_MONTANHAS, visao);
  desenharCamada(ctx, fundoFloresta, yFundo, cameraX, FATOR_FLORESTA, visao);

  ctx.save();
  aplicarCameraMundo(ctx, cameraX, visao, cameraY);
  desenharMundo(ctx, cameraY + visao.alturaMundo);
  ctx.restore();
}

// Começa no primeiro nível. O menu carrega outros níveis com carregarFase().
carregarFase(0);
