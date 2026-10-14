// src/main.js
import { startGame } from './game.js';
import { Player, desenharVidas } from './player.js';
import { Planta, Sentinela } from './enemies.js';
import { inputState, setInput, configurarControlesToque, limparAcoes } from './input.js';
import {
  LIMITE_QUEDA,
  obterPosicaoInicial,
  obterPontoSeguro,
  verificarCheckpoints,
  limparCheckpoints,
  desenharFase,
  calcularCamera,
  calcularCameraVertical,
  aplicarCameraMundo,
  patrulhasSentinelas,
  plantas,
  moedas,
  limparColetaveis,
  carregarFase,
  indiceFaseAtual,
  verificarMeta,
  infoFases,
  quantidadeFases,
  checkpoints,
  verificarDesafioPonte,
  construirPonte,
  limparPontes,
  mecanicasDaFase,
  reiniciarMecanicas,
} from './level.js';
import { resolverColisoes, verificarEspaco, verificarColetaveis } from './collisions.js';
import { registrarEfeito, registrarGanhoMusica, removerGanhoMusica, definirVolume } from './audio.js';
import { calcularVisao, ajustarCanvas } from './viewport.js';
import { criarTelaNiveis } from './telaNiveis.js';
import { iniciarDemoTitulo } from './demoTitulo.js';
import { abrirPortasDaMissao } from './mecanicas.js';
import { criarTerminal, carregarMissoes } from './terminal.js';
import { criarJanelaDesafio } from './desafio.js';
import { BANCO_DESAFIOS } from './bancoDesafios.js';
import { Poder } from './poder.js';
import { criarCutscene } from './cutscene.js';
import { criarChefe } from './chefe.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const gameShell = document.querySelector('.game-shell');
const controlesToque = document.querySelector('.mobile-controls');
const hud = document.getElementById('game-hud');
const canvasVidas = document.getElementById('hud-vidas');
const contextoVidas = canvasVidas.getContext('2d');
const canvasMoedas = document.getElementById('hud-moedas');
const contextoMoedas = canvasMoedas.getContext('2d');
const moedaHUD = new Image();
moedaHUD.src = 'assets/characters/Imagens_Personagens/04_vidas_e_itens/07_moeda.gif';
const mensagemHUD = document.getElementById('hud-mensagem');
const tecladoPrincipal = window.matchMedia('(hover: hover) and (pointer: fine)');
const retratoMovel = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
let visao = calcularVisao(960, 540);
let pixelRatio = 1;
let margemSuperior = 72;
const botaoPausar = document.getElementById('botao-pausar');
const menuPausa = document.getElementById('menu-pausa');
const botaoRetomar = document.getElementById('botao-retomar');
const botaoReiniciar = document.getElementById('botao-reiniciar');
const botaoMenuPausa = document.getElementById('botao-menu-pausa');
const telaInicio = document.getElementById('tela-inicio');
const botaoJogar = document.getElementById('botao-jogar');
const botaoSair = document.getElementById('botao-sair');
const avisoOrientacao = document.getElementById('aviso-orientacao');

const telaTitulo = document.getElementById('tela-titulo');
const botaoTituloJogar = document.getElementById('botao-titulo-jogar');
const botaoTituloComo = document.getElementById('botao-titulo-como');
const botaoTituloSobre = document.getElementById('botao-titulo-sobre');
const botoesTitulo = [botaoTituloJogar, botaoTituloComo, botaoTituloSobre];
const cursorTitulo = document.getElementById('cursor-titulo');
const painelTitulo = document.getElementById('painel-titulo');
const tituloPainel = document.getElementById('titulo-painel');
const textoPainel = document.getElementById('texto-painel');
const botaoFecharPainel = document.getElementById('botao-fechar-painel');
const botaoApagarDados = document.getElementById('botao-apagar-dados');
const botaoConfirmarApagar = document.getElementById('botao-confirmar-apagar');
let indiceTitulo = 0;

const telaNiveis = document.getElementById('tela-niveis');
const rotuloInicio = document.getElementById('rotulo-nivel-inicio');
const textoInicio = document.getElementById('texto-nivel-inicio');
const somVitoria = new Audio('./assets/sound/vadim_makes_sound-retro-arcade-level-up-552982.mp3');
registrarEfeito(somVitoria);

const PASTA_NIVEIS = './assets/characters/Imagens_Personagens/02_cenario/tela_niveis_editavel_pacote/';
const NIVEIS_NA_TELA = 5;
const ESTRELAS_MAXIMAS = 3;
let dadosJsonNiveis = [];
fetch(PASTA_NIVEIS + 'niveis.json')
  .then((resposta) => resposta.json())
  .then((json) => { dadosJsonNiveis = json.niveis ?? []; })
  .catch((erro) => console.error('Falha ao carregar niveis.json:', erro));

// Progresso: níveis liberados e estrelas de cada um. Fica salvo no navegador.
const CHAVE_PROGRESSO = 'byte-progresso';
function carregarProgresso() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_PROGRESSO));
    if (salvo && Number.isInteger(salvo.liberados)) {
      return {
        liberados: Math.min(Math.max(salvo.liberados, 1), NIVEIS_NA_TELA),
        estrelas: Array.isArray(salvo.estrelas) ? salvo.estrelas : [],
        intro_nivel1_vista: salvo.intro_nivel1_vista === true,
        chefe_derrotado: salvo.chefe_derrotado === true,
      };
    }
  } catch {
    // Progresso ilegível ou sem armazenamento: começa do primeiro nível.
  }
  return { liberados: 1, estrelas: [], intro_nivel1_vista: false, chefe_derrotado: false };
}
function salvarProgresso() {
  try {
    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
  } catch {
    // Sem armazenamento disponível: o progresso vale só enquanto a página estiver aberta.
  }
}
let progresso = carregarProgresso();

// Cutscene de introdução do Nível 1 (roteiro em cutscene_intro_nivel1.json).
const telaCutscene = document.getElementById('tela-cutscene');
const cutsceneIntro = criarCutscene(document.getElementById('canvas-cutscene'), {
  pasta: './assets/cutscenes/intro_nivel1/',
});
const ROTEIRO_INTRO_NIVEL1 = './assets/cutscenes/intro_nivel1/cutscene_intro_nivel1.json';

const seletorNiveis = criarTelaNiveis(document.getElementById('canvas-niveis'), {
  onEscolher: (indice) => escolherNivel(indice),
  onVoltar: () => mostrarTitulo(),
  onSair: () => mostrarTitulo(),
  implementados: quantidadeFases,
});

// Terminal do totem: abre a missão do totem ativo em que o Byte está.
const telaTerminal = document.getElementById('tela-terminal');
const imagemBotaoTerminal = new Image();
imagemBotaoTerminal.src = './assets/characters/Imagens_Personagens/02_cenario/terminal_python_pacote/botao_abrir_terminal_normal_150x28.png';
let missoesTerminal = [];
carregarMissoes()
  .then((lista) => { missoesTerminal = lista; })
  .catch((erro) => console.error('Falha ao carregar missoes.json:', erro));
let totemProximo = null;
let areaBotaoTerminal = null;
const terminal = criarTerminal(document.getElementById('canvas-terminal'), {
  onFechar: () => fecharTerminal(),
  onResolvido: (idMissao) => abrirPortasDaMissao(mecanicasDaFase, idMissao),
});

// Luta contra o Kernel Panic (fim do último nível). Usa o mesmo terminal, com as missões do chefe.
const telaChefe = document.getElementById('tela-chefe');
const lutaChefe = criarChefe(document.getElementById('canvas-chefe'), {
  pasta: './assets/chefe/',
  terminal,
  telaTerminal,
  onVitoria: () => aoVencerChefe(),
  onSair: () => sairDoChefe(),
});

function abrirTerminal() {
  const missao = missoesTerminal.find((item) => item.id === totemProximo?.missao);
  if (!missao) return;
  estadoDaPartida = 'terminal';
  controleDoJogo.stop();
  limparAcoes();
  telaTerminal.hidden = false;
  terminal.abrir(missao);
  atualizarInterface();
}

function fecharTerminal() {
  if (estadoDaPartida !== 'terminal') return;
  terminal.fechar();
  telaTerminal.hidden = true;
  estadoDaPartida = 'jogando';
  limparAcoes();
  controleDoJogo.start();
  atualizarInterface();
}

// Desafios do banco de perguntas: abrem nos corações, monstros e vãos que têm um id de desafio.
const telaDesafio = document.getElementById('tela-desafio');
const janelaDesafio = criarJanelaDesafio(telaDesafio);
// Poderes </> em voo, lançados pelo Byte nos monstros cujas perguntas ele acertou.
let poderes = [];
const somAcertoPoder = new Audio('./assets/sound/bannythecoolio-impactful-damage-425132.mp3');
registrarEfeito(somAcertoPoder, 0.6);

/** Lança o poder do Byte no monstro: ele para na hora e é derrotado quando o poder chega. */
function lancarPoder(monstro) {
  monstro.marcarAlvo();
  player.olhandoDireita = monstro.centro().x >= player.x + player.largura / 2;
  poderes.push(new Poder(player, monstro, () => {
    somAcertoPoder.currentTime = 0;
    somAcertoPoder.play().catch((erro) => console.error('Falha ao tocar o som do poder:', erro));
  }));
}

/**
 * Para o jogo e mostra a pergunta `id`. onFim(acertou) aplica a consequência quando o jogador continua.
 * Devolve false se o id não estiver no banco: o elemento segue sem pergunta.
 */
function abrirDesafio(id, { textoAcerto, textoErro, insistir, onFim }) {
  const desafio = BANCO_DESAFIOS[id];
  if (!desafio) {
    console.error(`Desafio ${id} não encontrado em bancoDesafios.js`);
    return false;
  }
  estadoDaPartida = 'desafio';
  controleDoJogo.stop();
  limparAcoes();
  atualizarInterface();
  janelaDesafio.abrir(id, desafio, {
    textoAcerto,
    textoErro,
    insistir,
    onFim: (acertou) => {
      estadoDaPartida = 'jogando';
      limparAcoes();
      onFim(acertou);
      atualizarInterface();
      controleDoJogo.start();
      botaoPausar.focus({ preventScroll: true });
    },
  });
  return true;
}

/** Coração com desafio: acertar recupera a vida; errar deixa o coração perdido (já foi coletado). */
function desafioDeVida(item) {
  return abrirDesafio(item.desafio, {
    textoAcerto: player.vidas < 3 ? 'Você recuperou uma vida.' : 'Suas vidas já estão completas.',
    textoErro: 'O coração se perdeu.',
    onFim: (acertou) => {
      if (acertou) player.vidas = Math.min(3, player.vidas + 1);
      mensagem = acertou ? 'Coração coletado' : 'Coração perdido';
      mensagemAte = performance.now() + 1500;
    },
  });
}

/** Verifica monstros e vãos com desafio perto do Byte. Devolve true se abriu uma pergunta. */
function verificarDesafiosDoCaminho() {
  const monstro = inimigos.find((inimigo) => inimigo.pedeDesafio(player));
  if (monstro) {
    monstro.desafioFeito = true;
    const robo = monstro instanceof Sentinela;
    return abrirDesafio(monstro.desafio, {
      textoAcerto: `O Byte lança o poder e derrota ${robo ? 'o robô' : 'a planta'}.`,
      textoErro: robo ? 'O robô continua patrulhando.' : 'A planta continua no caminho.',
      onFim: (acertou) => {
        if (acertou) lancarPoder(monstro);
        mensagem = acertou ? 'Poder lançado!' : `Cuidado com ${robo ? 'o sentinela' : 'a planta'}`;
        mensagemAte = performance.now() + 1500;
      },
    });
  }

  const vao = verificarDesafioPonte(player);
  if (vao) {
    vao.desafioFeito = true;
    // Sem a ponte a fase não continua: o jogador tenta até acertar.
    return abrirDesafio(vao.desafio, {
      textoAcerto: 'A ponte foi construída.',
      insistir: true,
      onFim: () => {
        construirPonte(vao);
        mensagem = 'Ponte construída';
        mensagemAte = performance.now() + 1500;
      },
    });
  }
  return false;
}

/** Botão ABRIR TERMINAL sobre o totem, em coordenadas de tela (escala da visão). */
function desenharBotaoTerminal(ctx, cameraX, cameraY) {
  areaBotaoTerminal = null;
  if (estadoDaPartida !== 'jogando' || !totemProximo || !imagemBotaoTerminal.complete) return;
  const escala = visao.escala;
  const s = escala / 1.5;
  const centroX = (totemProximo.x + totemProximo.width / 2 - cameraX) * escala;
  const topo = (totemProximo.y - cameraY) * escala;
  const largura = 150 * s;
  const altura = 28 * s;
  const balanco = Math.floor(performance.now() / 400) % 2 === 0 ? 0 : s;
  const x = centroX - largura / 2;
  const y = topo - 37 * s + balanco;
  ctx.drawImage(imagemBotaoTerminal, x, y, largura, altura);
  areaBotaoTerminal = { x, y, largura, altura };
}
const somApertarPlay = new Audio('./assets/sound/apertar_play.mp3');
registrarEfeito(somApertarPlay);
const somPerder = new Audio('./assets/sound/perder.mp3');
registrarEfeito(somPerder);

const botaoSomInicio = document.getElementById('botao-som-inicio');
const botaoSomPausa = document.getElementById('botao-som-pausa');
const menuSom = document.getElementById('menu-som');
const controleMusica = document.getElementById('volume-musica');
const controleEfeitos = document.getElementById('volume-efeitos');
const valorMusica = document.getElementById('valor-musica');
const valorEfeitos = document.getElementById('valor-efeitos');
const botaoVoltarSom = document.getElementById('botao-voltar-som');
let botaoOrigemSom = null;

// Música de fundo: começa no segundo 10, fica baixa e repete a partir do mesmo ponto.
// Usa Web Audio com o arquivo inteiro em memória, para o loop não depender de pular dentro do MP3 no servidor.
const SEGUNDO_INICIO_MUSICA = 10;
let bytesMusica = null;
let bufferMusica = null;
let contextoAudio = null;
let fonteMusica = null;
let ganhoMusica = null;

fetch('./assets/sound/musica_fundo.mp3')
  .then((resposta) => resposta.arrayBuffer())
  .then((bytes) => { bytesMusica = bytes; })
  .catch((erro) => console.error('Falha ao carregar musica_fundo.mp3:', erro));

configurarControlesToque();

/** Toca a faixa do botão Jogar uma vez. Falhas de reprodução são registradas no console e não travam o jogo. */
function tocarSomApertarPlay() {
  try {
    somApertarPlay.currentTime = 0;
    somApertarPlay.play().catch((erro) => console.error('Falha ao tocar apertar_play.mp3:', erro));
  } catch (erro) {
    console.error('Falha ao tocar apertar_play.mp3:', erro);
  }
}

/** Toca o som de derrota uma vez, do início. Falhas são registradas no console. */
function tocarSomPerder() {
  try {
    somPerder.currentTime = 0;
    somPerder.play().catch((erro) => console.error('Falha ao tocar perder.mp3:', erro));
  } catch (erro) {
    console.error('Falha ao tocar perder.mp3:', erro);
  }
}

/** Começa a música de fundo do segundo 10, em loop. Falhas são registradas no console. */
async function iniciarMusicaFundo() {
  try {
    if (!contextoAudio) contextoAudio = new AudioContext();
    if (!bufferMusica && bytesMusica) bufferMusica = await contextoAudio.decodeAudioData(bytesMusica.slice(0));
    if (!bufferMusica) return;

    pararMusicaFundo();
    const fonte = contextoAudio.createBufferSource();
    const ganho = contextoAudio.createGain();
    fonte.buffer = bufferMusica;
    fonte.loop = true;
    fonte.loopStart = SEGUNDO_INICIO_MUSICA;
    fonte.loopEnd = bufferMusica.duration;
    registrarGanhoMusica(ganho);
    fonte.connect(ganho).connect(contextoAudio.destination);
    fonte.start(0, SEGUNDO_INICIO_MUSICA);
    fonteMusica = fonte;
    ganhoMusica = ganho;
    retomarMusicaFundo();
  } catch (erro) {
    console.error('Falha ao tocar musica_fundo.mp3:', erro);
  }
}

function pausarMusicaFundo() {
  contextoAudio?.suspend();
}

function retomarMusicaFundo() {
  // A decodificação pode terminar depois de o jogador pausar ou minimizar o app.
  if (document.hidden || !['jogando', 'terminal', 'desafio'].includes(estadoDaPartida)) return;
  contextoAudio?.resume();
}

/** Para a música de fundo. Ao próximo Jogar ela recomeça do segundo 10. */
function pararMusicaFundo() {
  if (fonteMusica) {
    fonteMusica.stop();
    fonteMusica = null;
  }
  if (ganhoMusica) {
    removerGanhoMusica(ganhoMusica);
    ganhoMusica = null;
  }
}

const inicio = obterPosicaoInicial();
const player = new Player(inicio.x, inicio.y);
// Inimigos da fase carregada: recriados ao começar cada partida, porque cada fase tem os seus.
let inimigos = [];
function criarInimigos() {
  return [
    ...patrulhasSentinelas.map((campo) => new Sentinela(campo)),
    ...plantas.map((posicao) => new Planta(posicao)),
  ];
}
inimigos = criarInimigos();

const status = document.getElementById('game-status');
if (status) {
  status.textContent = 'Setas ou A/D para andar, W/espaço para pular, S para agachar. P para pausar, R para reiniciar. Use o botão Pausar para abrir o menu.';
}

// --- Integração (vidas, queda e reinício) -------------------
let mensagem = '';
let mensagemAte = 0;
// Estados da partida:
// - titulo: tela de título, aberta ao carregar o jogo.
// - inicio: tela inicial, aberta quando as vidas acabam.
// - jogando, pausado: partida em andamento ou com o menu de pausa aberto.
// - terminal, desafio: jogo parado com o terminal do totem ou uma pergunta do banco aberta.
let estadoDaPartida = 'inicio';

function atualizarInterface() {
  hud.hidden = ['inicio', 'cutscene', 'chefe'].includes(estadoDaPartida);
  controlesToque.hidden = estadoDaPartida !== 'jogando' && estadoDaPartida !== 'chefe';
  gameShell.dataset.estado = estadoDaPartida;
}

function atualizarHUD() {
  for (const ctx of [contextoVidas, contextoMoedas]) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  desenharVidas(contextoVidas, player.vidas, performance.now() / 1000, { x: 0, y: 0 });
  const rotulo = `${player.vidas} de 3 vidas`;
  if (canvasVidas.getAttribute('aria-label') !== rotulo) canvasVidas.setAttribute('aria-label', rotulo);

  if (moedaHUD.complete && moedaHUD.naturalWidth > 0) {
    contextoMoedas.imageSmoothingEnabled = false;
    contextoMoedas.drawImage(moedaHUD, 0, 8, 16, 16);
  }
  const moedasColetadas = moedas.filter((moeda) => moeda.coletado).length;
  contextoMoedas.fillStyle = '#f3f4f6';
  contextoMoedas.font = 'bold 16px system-ui, sans-serif';
  contextoMoedas.textBaseline = 'middle';
  contextoMoedas.fillText(String(moedasColetadas), 24, 16);
  const rotuloMoedas = `${moedasColetadas} de ${moedas.length} moedas`;
  if (canvasMoedas.getAttribute('aria-label') !== rotuloMoedas) {
    canvasMoedas.setAttribute('aria-label', rotuloMoedas);
  }
  const texto = mensagem && performance.now() < mensagemAte ? mensagem : '';
  if (mensagemHUD.textContent !== texto) mensagemHUD.textContent = texto;
  mensagemHUD.hidden = !texto;
}

function redimensionarJogo() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const botao = controlesToque.querySelector('button');
  const tamanhoBotao = parseFloat(getComputedStyle(botao).height) || 56;
  const margemRodape = parseFloat(getComputedStyle(controlesToque).bottom) || 12;
  const margemControles = tecladoPrincipal.matches ? 0 : tamanhoBotao + margemRodape + 20;
  visao = calcularVisao(width, height, margemControles);
  pixelRatio = ajustarCanvas(canvas, visao);
  ajustarCanvas(canvasVidas, { largura: 114, altura: 32 }, pixelRatio);
  ajustarCanvas(canvasMoedas, { largura: 74, altura: 32 }, pixelRatio);
  margemSuperior = Math.max(72, hud.querySelector('.hud-stats').getBoundingClientRect().bottom + 12);
  document.querySelector('.game-area').inert = retratoMovel.matches;
  if (retratoMovel.matches && estadoDaPartida === 'jogando') pausarPartida();
  if (retratoMovel.matches && document.activeElement !== avisoOrientacao) {
    avisoOrientacao.focus({ preventScroll: true });
  } else if (!retratoMovel.matches && document.activeElement === avisoOrientacao) {
    const proximoFoco = !menuSom.hidden ? controleMusica
      : estadoDaPartida === 'titulo' ? botoesTitulo[indiceTitulo]
      : estadoDaPartida === 'inicio' ? botaoJogar : botaoRetomar;
    proximoFoco.focus({ preventScroll: true });
  }
  controleDoJogo.draw();
}

function reposicionar(ponto) {
  player.retornar(ponto.x, ponto.y);
}

/** Zera a partida: vidas, checkpoints e posição inicial. Não mexe nos menus. */
function prepararNovaPartida() {
  limparCheckpoints();
  limparColetaveis();
  limparPontes();
  inimigos = criarInimigos();
  poderes = [];
  reiniciarMecanicas();
  const pontoInicial = obterPosicaoInicial();
  player.vidas = 3;
  player.tempoInvulneravel = 0;
  player.retornar(pontoInicial.x, pontoInicial.y);
  limparAcoes();
  mensagem = '';
  mensagemAte = 0;
}

/** Esconde a tela inicial e os menus, e começa a partida do zero. */
function iniciarPartida() {
  if (retratoMovel.matches) return;
  prepararNovaPartida();
  estadoDaPartida = 'jogando';
  telaTitulo.hidden = true;
  telaInicio.hidden = true;
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  atualizarInterface();
  redimensionarJogo();
  controleDoJogo.start();
  botaoPausar.focus({ preventScroll: true });
}

/** Abre a tela inicial e para o jogo. Usada ao carregar a página e ao perder todas as vidas. */
/** Abre a tela do nível atual (nome e texto da fase carregada) e para o jogo. */
function mostrarTelaInicio() {
  estadoDaPartida = 'inicio';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaTitulo.hidden = true;
  telaNiveis.hidden = true;
  seletorNiveis.esconder();
  const { nome, texto } = textosDoNivel(indiceFaseAtual());
  // Aba superior esquerda: "Nível 1 - Laboratório das Variáveis", ou só "Nível 1" sem título.
  // Fica sem maiúsculas forçadas: a Press Start 2P desenha Í e Ó maiúsculos como minúsculos.
  const tituloFase = infoFases[indiceFaseAtual()]?.titulo;
  const nomeNivel = nome.charAt(0) + nome.slice(1).toLowerCase();
  rotuloInicio.textContent = tituloFase ? `${nomeNivel} - ${tituloFase}` : nomeNivel;
  textoInicio.textContent = texto;
  telaInicio.hidden = false;
  atualizarInterface();
  pararMusicaFundo();
  botaoJogar.focus({ preventScroll: true });
}

/** Nome e texto de um nível: de niveis.json, com a fase como reserva. */
function textosDoNivel(indice) {
  const dados = dadosJsonNiveis[indice];
  const fase = infoFases[indice];
  const descricao = dados?.descricao;
  return {
    nome: dados?.nome ?? fase?.nome ?? `Nível ${indice + 1}`,
    texto: descricao && descricao !== '(a definir)' ? descricao : (fase?.texto ?? ''),
  };
}

/** Dados da tela de níveis: estado e estrelas vêm do progresso salvo. */
function montarDadosNiveis() {
  const total = dadosJsonNiveis.length || NIVEIS_NA_TELA;
  return Array.from({ length: total }, (_, i) => {
    let estado = 'bloqueado';
    if (i < progresso.liberados - 1) estado = 'completo';
    else if (i === progresso.liberados - 1) estado = 'disponivel';
    const { nome } = textosDoNivel(i);
    return {
      nome: nome.toUpperCase(),
      descricao: dadosJsonNiveis[i]?.descricao ?? '',
      estado,
      estrelas: progresso.estrelas[i] ?? 0,
    };
  });
}

/** Abre a tela de níveis, com o último nível liberado selecionado. */
function mostrarNiveis() {
  estadoDaPartida = 'niveis';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaTitulo.hidden = true;
  telaInicio.hidden = true;
  pararMusicaFundo();
  telaNiveis.hidden = false;
  seletorNiveis.mostrar(montarDadosNiveis(), Math.min(progresso.liberados, quantidadeFases) - 1);
  atualizarInterface();
}

/** Carrega a fase escolhida e abre a tela do nível. Níveis bloqueados ou sem fase não abrem. */
function escolherNivel(indice) {
  if (indice >= progresso.liberados || indice >= quantidadeFases) return;
  carregarFase(indice);
  mostrarTelaInicio();
}

/** Vitória: toca o som, guarda as estrelas (vidas restantes), libera a próxima fase e volta à tela de níveis. */
function concluirFase() {
  const concluida = indiceFaseAtual();
  // Último nível: o Kernel Panic aparece antes da conclusão, até ser derrotado.
  if (concluida === quantidadeFases - 1 && !progresso.chefe_derrotado) {
    iniciarChefe();
    return;
  }
  controleDoJogo.stop();
  limparAcoes();
  somVitoria.currentTime = 0;
  somVitoria.play().catch((erro) => console.error('Falha ao tocar vitoria:', erro));

  const estrelasGanhas = Math.min(Math.max(player.vidas, 1), ESTRELAS_MAXIMAS);
  progresso.estrelas[concluida] = Math.max(progresso.estrelas[concluida] ?? 0, estrelasGanhas);
  progresso.liberados = Math.max(progresso.liberados, Math.min(concluida + 2, NIVEIS_NA_TELA));
  salvarProgresso();
  mostrarNiveis();
}

/** Luta contra o Kernel Panic (fim do último nível). A arena usa o mesmo terminal do projeto. */
function iniciarChefe() {
  estadoDaPartida = 'chefe';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaTitulo.hidden = true;
  telaInicio.hidden = true;
  telaNiveis.hidden = true;
  seletorNiveis.esconder();
  pararMusicaFundo();
  telaChefe.hidden = false;
  atualizarInterface();
  lutaChefe.iniciar();
}

/** Chefe derrotado: salva a vitória e conclui o último nível. */
function aoVencerChefe() {
  lutaChefe.parar();
  telaChefe.hidden = true;
  progresso.chefe_derrotado = true;
  salvarProgresso();
  concluirFase();
}

/** Desistiu depois de perder todas as vidas da luta: volta à tela de níveis. */
function sairDoChefe() {
  telaChefe.hidden = true;
  mostrarNiveis();
}

/** Abre a tela de título, com o botão Jogar selecionado. Usada ao carregar a página. */
function mostrarTitulo() {
  estadoDaPartida = 'titulo';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaInicio.hidden = true;
  telaNiveis.hidden = true;
  seletorNiveis.esconder();
  telaTitulo.hidden = false;
  pararMusicaFundo();
  selecionarBotaoTitulo(0);
}

/** Marca o botão do título e posiciona o cursor ao lado dele. */
function selecionarBotaoTitulo(indice) {
  indiceTitulo = indice;
  botoesTitulo.forEach((botao, i) => botao.classList.toggle('selecionado', i === indice));

  const palco = telaTitulo.querySelector('.tela-titulo-palco');
  const alvo = botoesTitulo[indice].getBoundingClientRect();
  const area = palco.getBoundingClientRect();
  const centroY = alvo.top - area.top + alvo.height / 2;
  const topo = (centroY - cursorTitulo.offsetHeight / 2) / area.height * 100;
  cursorTitulo.style.top = `${topo}%`;
}

const PAINEIS_TITULO = {
  como: { titulo: 'Como jogar', linhas: ['SETAS ou A/D: andar', 'SETA PARA CIMA, W ou ESPAÇO: pular', 'SETA PARA BAIXO ou S: agachar', 'P ou ESC: pausar', 'R: reiniciar a fase'] },
  sobre: { titulo: 'Sobre', linhas: ['As aventuras de Byte', 'Versão 1.0', 'Jogo de plataforma em desenvolvimento.'] },
  apagar: { titulo: 'Apagar dados', linhas: ['Isso apaga os níveis liberados, as estrelas e o chefe derrotado.', 'O jogo volta para o Nível 1. Não dá para desfazer.'] },
};

function abrirPainelTitulo(conteudo) {
  const { titulo, linhas } = PAINEIS_TITULO[conteudo];
  tituloPainel.textContent = titulo;
  botaoConfirmarApagar.hidden = conteudo !== 'apagar';
  textoPainel.replaceChildren(...linhas.map((linha) => {
    const paragrafo = document.createElement('p');
    paragrafo.textContent = linha;
    return paragrafo;
  }));
  painelTitulo.hidden = false;
  botaoFecharPainel.focus({ preventScroll: true });
}

function fecharPainelTitulo() {
  painelTitulo.hidden = true;
  botoesTitulo[indiceTitulo].focus({ preventScroll: true });
}

/** Apaga o progresso salvo e recarrega a página, para nenhuma tela ficar com dados antigos na memória. */
function apagarDadosDoJogo() {
  try {
    localStorage.removeItem(CHAVE_PROGRESSO);
  } catch {
    // Sem armazenamento disponível: não há nada salvo para apagar.
  }
  location.reload();
}

function reiniciarJogo() {
  // Na tela de título ou na tela inicial não há fase em andamento para reiniciar.
  if (estadoDaPartida === 'inicio' || estadoDaPartida === 'titulo' || estadoDaPartida === 'niveis') return;

  iniciarPartida();
  mensagem = 'Fase reiniciada';
  mensagemAte = performance.now() + 1500;
}

// ---------------------------------------------------------------------------

const dependenciasDoJogo = {
  readActions: () => inputState,

  updatePlayer: (actions, deltaTime) => {
    if (actions.pausa) {
      actions.pausa = false;
      pausarPartida();
      return;
    }
    player.atualizar(deltaTime, verificarEspaco, LIMITE_QUEDA, aguardarEscolhaDoJogador);
    if (estadoDaPartida === 'jogando') {
      inimigos.forEach((inimigo) => inimigo.atualizar(deltaTime));
      poderes.forEach((poder) => poder.atualizar(deltaTime));
      poderes = poderes.filter((poder) => !poder.terminou);
      mecanicasDaFase.forEach((mecanica) => mecanica.atualizar(deltaTime, player));
    }
  },

  resolveCollisions: (deltaTime) => {
    if (estadoDaPartida !== 'jogando') return;
    resolverColisoes(player, deltaTime);

    // Totem ativo com missão, encostado pelo Byte: mostra o botão ABRIR TERMINAL.
    totemProximo = checkpoints.find((c) => c.ativo && c.missao
      && player.x < c.x + c.width && player.x + player.largura > c.x
      && player.y < c.y + c.height && player.y + player.altura > c.y) ?? null;

    // As perguntas vêm antes da meta: a planta que guarda a saída sempre pergunta antes de a fase acabar.
    if (verificarDesafiosDoCaminho()) return;

    if (verificarMeta(player)) {
      concluirFase();
      return;
    }

    const checkpoint = verificarCheckpoints(player);
    if (checkpoint) {
      mensagem = 'Checkpoint salvo';
      mensagemAte = performance.now() + 1500;
    }

    if (player.y > LIMITE_QUEDA) {
      reposicionar(obterPontoSeguro());
      mensagem = 'Queda: retorno ao ponto seguro';
      mensagemAte = performance.now() + 1500;
      return;
    }

    const coletavel = verificarColetaveis(player);
    if (coletavel?.desafio && desafioDeVida(coletavel)) return;
    if (coletavel) {
      if (coletavel.id.startsWith('vida-')) {
        player.vidas = Math.min(3, player.vidas + 1);
        mensagem = player.vidas === 3 ? 'Vida recuperada' : 'Coração coletado';
      } else {
        mensagem = 'Moeda coletada';
      }
      mensagemAte = performance.now() + 1000;
    }

    // Inimigos e perigos das mecânicas machucam ao toque.
    const inimigoTocado = inimigos.find((inimigo) => inimigo.toca(player))
      ?? mecanicasDaFase.find((mecanica) => mecanica.toca(player));
    if (inimigoTocado && player.receberDano()) {
      if (player.vidas <= 0) {
        aguardarEscolhaDoJogador();
        return;
      }
      reposicionar(obterPontoSeguro());
      limparAcoes();
      mensagem = `${inimigoTocado.nome}: perdeu uma vida`;
      mensagemAte = performance.now() + 1500;
    }
  },

  drawScene: (ctx) => {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const cameraX = calcularCamera(player.x, player.largura, visao);
    const cameraY = calcularCameraVertical(player.y, visao, margemSuperior);
    desenharFase(ctx, cameraX, visao, cameraY);

    // Personagem e inimigos usam a mesma câmera, em coordenadas do mundo.
    ctx.save();
    aplicarCameraMundo(ctx, cameraX, visao, cameraY);
    inimigos.forEach((inimigo) => inimigo.desenhar(ctx));
    mecanicasDaFase.forEach((mecanica) => mecanica.desenhar(ctx));
    player.desenhar(ctx);
    poderes.forEach((poder) => poder.desenhar(ctx));
    ctx.restore();

    desenharBotaoTerminal(ctx, cameraX, cameraY);
    atualizarHUD();
  },
};

const controleDoJogo = startGame(canvas, context, dependenciasDoJogo);
// O jogo começa parado: a tela de título é exibida até o jogador escolher Jogar.
mostrarTitulo();
iniciarDemoTitulo(document.getElementById('canvas-demo-titulo'), {
  montanhas: document.querySelector('.titulo-montanhas'),
  cidade: document.querySelector('.titulo-cidade'),
  floresta: document.querySelector('.titulo-floresta'),
  chao: document.querySelector('.titulo-chao'),
});
redimensionarJogo();
new ResizeObserver(redimensionarJogo).observe(gameShell);
window.addEventListener('resize', redimensionarJogo);
retratoMovel.addEventListener('change', redimensionarJogo);
tecladoPrincipal.addEventListener('change', redimensionarJogo);

// Chamada pelo jogo quando as vidas acabam: toca o som de derrota e volta à tela inicial.
function aguardarEscolhaDoJogador() {
  if (estadoDaPartida !== 'jogando') return;
  tocarSomPerder();
  mostrarTelaInicio();
}

function pausarPartida() {
  if (estadoDaPartida !== 'jogando') return;

  estadoDaPartida = 'pausado';
  controleDoJogo.stop();
  limparAcoes();
  pausarMusicaFundo();
  botaoPausar.hidden = true;
  menuPausa.hidden = false;
  atualizarInterface();
  botaoRetomar.focus({ preventScroll: true });
}

function retomarPartida() {
  if (estadoDaPartida !== 'pausado' || retratoMovel.matches) return;

  limparAcoes();
  estadoDaPartida = 'jogando';
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  atualizarInterface();
  controleDoJogo.start();
  retomarMusicaFundo();
  botaoPausar.focus({ preventScroll: true });
}

// Ao trocar de aplicativo ou bloquear a tela, mantém a partida pausada ao voltar.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    limparAcoes();
    pausarPartida();
    pausarMusicaFundo();
  } else if (estadoDaPartida === 'terminal' || estadoDaPartida === 'desafio') {
    retomarMusicaFundo();
  }
});

// O evento click atende tanto ao mouse quanto ao toque nos botões.
// SAIR da tela do nível: volta à tela de níveis, sem iniciar a fase.
botaoSair.addEventListener('click', () => mostrarNiveis());

/** Toca a cutscene de introdução do Nível 1. aoTerminar roda ao acabar ou ao pular. */
function tocarIntroNivel1(aoTerminar) {
  estadoDaPartida = 'cutscene';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaTitulo.hidden = true;
  telaInicio.hidden = true;
  telaNiveis.hidden = true;
  seletorNiveis.esconder();
  telaCutscene.hidden = false;
  atualizarInterface();
  cutsceneIntro.tocar(ROTEIRO_INTRO_NIVEL1, {
    aoTerminar: () => {
      telaCutscene.hidden = true;
      aoTerminar();
    },
  });
}

botaoJogar.addEventListener('click', () => {
  if (retratoMovel.matches) return;
  tocarSomApertarPlay();
  // Primeira vez no Nível 1: a introdução toca antes da partida, e a música começa depois dela.
  if (indiceFaseAtual() === 0 && !progresso.intro_nivel1_vista) {
    tocarIntroNivel1(() => {
      progresso.intro_nivel1_vista = true;
      salvarProgresso();
      iniciarMusicaFundo();
      iniciarPartida();
    });
    return;
  }
  iniciarMusicaFundo();
  iniciarPartida();
});

/** Jogar na tela de título abre a tela de níveis. */
function iniciarPeloTitulo() {
  mostrarNiveis();
}

botoesTitulo.forEach((botao, i) => {
  botao.addEventListener('mouseenter', () => selecionarBotaoTitulo(i));
});
botaoTituloJogar.addEventListener('click', iniciarPeloTitulo);
botaoTituloComo.addEventListener('click', () => abrirPainelTitulo('como'));
botaoTituloSobre.addEventListener('click', () => abrirPainelTitulo('sobre'));
botaoFecharPainel.addEventListener('click', fecharPainelTitulo);
botaoApagarDados.addEventListener('click', () => abrirPainelTitulo('apagar'));
botaoConfirmarApagar.addEventListener('click', apagarDadosDoJogo);
window.addEventListener('resize', () => {
  if (estadoDaPartida === 'titulo') selecionarBotaoTitulo(indiceTitulo);
});
botaoPausar.addEventListener('click', pausarPartida);
botaoRetomar.addEventListener('click', retomarPartida);
// Menu: larga a fase pausada e volta para a tela de título.
botaoMenuPausa.addEventListener('click', () => {
  menuSom.hidden = true;
  mostrarTitulo();
  atualizarInterface();
  botoesTitulo[0].focus({ preventScroll: true });
});

/** Abre o painel de som. `botao` é o que abriu o painel e recebe o foco de volta ao fechar. */
function abrirMenuSom(botao) {
  botaoOrigemSom = botao;
  menuSom.hidden = false;
  controleMusica.focus({ preventScroll: true });
}

function fecharMenuSom() {
  menuSom.hidden = true;
  botaoOrigemSom?.focus({ preventScroll: true });
}

botaoSomInicio.addEventListener('click', () => abrirMenuSom(botaoSomInicio));
botaoSomPausa.addEventListener('click', () => abrirMenuSom(botaoSomPausa));
botaoVoltarSom.addEventListener('click', fecharMenuSom);

controleMusica.addEventListener('input', () => {
  valorMusica.textContent = `${controleMusica.value}%`;
  definirVolume('musica', controleMusica.value / 100);
});

controleEfeitos.addEventListener('input', () => {
  valorEfeitos.textContent = `${controleEfeitos.value}%`;
  definirVolume('efeitos', controleEfeitos.value / 100);
});

if (botaoReiniciar) {
  botaoReiniciar.disabled = false;
  botaoReiniciar.addEventListener('click', reiniciarJogo);
}

// Atalhos de teclado: P para pausar/retomar, R para reiniciar.
// Na tela inicial, nenhum atalho age: só o botão Jogar.
canvas.addEventListener('click', (evento) => {
  if (!areaBotaoTerminal || estadoDaPartida !== 'jogando') return;
  const area = canvas.getBoundingClientRect();
  const x = (evento.clientX - area.left) * visao.largura / area.width;
  const y = (evento.clientY - area.top) * visao.altura / area.height;
  const b = areaBotaoTerminal;
  if (x >= b.x && x < b.x + b.largura && y >= b.y && y < b.y + b.altura) abrirTerminal();
});

window.addEventListener('keydown', (evento) => {
  // Os controles de instalação usam o comportamento nativo de Enter e espaço.
  if (evento.target.closest?.('.pwa-controls')) return;
  // Os botões Apagar dados e Tela cheia não estão no menu de setas: Enter neles usa o clique nativo.
  if (evento.target === botaoApagarDados) return;
  if (evento.target.id === 'botao-tela-cheia' && (evento.key === 'Enter' || evento.key === ' ')) return;
  if (retratoMovel.matches) return;
  // Cutscene em andamento: ela trata as próprias teclas.
  if (estadoDaPartida === 'cutscene' || estadoDaPartida === 'chefe') return;
  // F8 (teste): revê a introdução do Nível 1 a partir da tela de níveis ou da tela do nível.
  if (evento.key === 'F8' && (estadoDaPartida === 'inicio' || estadoDaPartida === 'niveis')) {
    evento.preventDefault();
    const voltarPara = estadoDaPartida;
    tocarIntroNivel1(() => (voltarPara === 'niveis' ? mostrarNiveis() : mostrarTelaInicio()));
    return;
  }
  // Com o painel de som aberto, Esc só fecha o painel: não pausa nem retoma o jogo.
  if (!menuSom.hidden) {
    if (evento.key === 'Escape') fecharMenuSom();
    return;
  }

  // Desafio aberto: só as teclas da pergunta valem (A/B/C, setas, Enter e Esc depois da resposta).
  if (estadoDaPartida === 'desafio') {
    janelaDesafio.tratarTecla(evento);
    return;
  }

  // Terminal aberto: o próprio terminal trata as teclas (Esc fecha, Tab/Delete editam).
  if (estadoDaPartida === 'terminal') {
    terminal.tratarTecla(evento);
    return;
  }

  // E ou Enter abrem o terminal quando o Byte está num totem ativo com missão.
  if (estadoDaPartida === 'jogando' && totemProximo && ['e', 'E', 'Enter'].includes(evento.key)) {
    evento.preventDefault();
    abrirTerminal();
    return;
  }

  // Tela de níveis: a própria tela trata setas, Enter e Esc.
  if (estadoDaPartida === 'niveis') {
    seletorNiveis.tratarTecla(evento);
    return;
  }

  // Tela de título: setas escolhem o botão, Enter confirma, Esc fecha o painel aberto.
  if (estadoDaPartida === 'titulo') {
    if (!painelTitulo.hidden) {
      if (evento.key === 'Escape') fecharPainelTitulo();
      return;
    }
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      const passo = evento.key === 'ArrowDown' ? 1 : -1;
      selecionarBotaoTitulo((indiceTitulo + passo + botoesTitulo.length) % botoesTitulo.length);
    } else if (evento.key === 'Enter') {
      // Impede o Enter nativo de clicar de novo no botão que ganhar o foco depois deste clique.
      evento.preventDefault();
      botoesTitulo[indiceTitulo].click();
    }
    return;
  }

  // Durante a partida, espaço é o pulo: impede que ele acione o botão Pausar, que ganha o foco ao iniciar.
  if (evento.key === ' ' && estadoDaPartida === 'jogando') {
    evento.preventDefault();
  }

  if (evento.key === 'p' || evento.key === 'P' || evento.key === 'Escape') {
    if (estadoDaPartida === 'jogando') {
      pausarPartida();
    } else if (estadoDaPartida === 'pausado') {
      retomarPartida();
    }
  }

  if (evento.key === 'r' || evento.key === 'R') {
    reiniciarJogo();
  }
});
