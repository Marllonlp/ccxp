// src/main.js
import { startGame } from './game.js';
import { Player, desenharVidas } from './player.js';
import { inputState, setInput, configurarControlesToque, limparAcoes } from './input.js';
import {
  LIMITE_QUEDA,
  obterPosicaoInicial,
  obterPontoSeguro,
  verificarCheckpoints,
  limparCheckpoints,
  desenharFase,
  calcularCamera,
  aplicarCameraMundo,
} from './level.js';
import { resolverColisoes, verificarEspaco } from './collisions.js';
import { registrarEfeito, registrarGanhoMusica, removerGanhoMusica, definirVolume } from './audio.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const botaoPausar = document.getElementById('botao-pausar');
const menuPausa = document.getElementById('menu-pausa');
const botaoRetomar = document.getElementById('botao-retomar');
const botaoReiniciar = document.getElementById('botao-reiniciar');
const telaInicio = document.getElementById('tela-inicio');
const botaoJogar = document.getElementById('botao-jogar');
const botaoOrientacao = document.getElementById('botao-orientacao');
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

async function solicitarTelaHorizontal() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch {
    // Alguns navegadores só permitem a rotação pelas configurações do aparelho.
  }
}

botaoOrientacao?.addEventListener('click', solicitarTelaHorizontal);

const inicio = obterPosicaoInicial();
const player = new Player(inicio.x, inicio.y);

const status = document.getElementById('game-status');
if (status) {
  status.textContent = 'Setas ou A/D para andar, W/espaço para pular, S para agachar. P para pausar, R para reiniciar. Use o botão Pausar para abrir o menu.';
}

// --- Integração (vidas, queda e reinício) -------------------
let mensagem = '';
let mensagemAte = 0;
// Estados da partida:
// - inicio: tela inicial, aberta ao carregar o jogo e quando as vidas acabam.
// - jogando, pausado: partida em andamento ou com o menu de pausa aberto.
let estadoDaPartida = 'inicio';

function reposicionar(ponto) {
  player.retornar(ponto.x, ponto.y);
}

/** Zera a partida: vidas, checkpoints e posição inicial. Não mexe nos menus. */
function prepararNovaPartida() {
  limparCheckpoints();
  const pontoInicial = obterPosicaoInicial();
  player.vidas = 3;
  player.retornar(pontoInicial.x, pontoInicial.y);
  limparAcoes();
}

/** Esconde a tela inicial e os menus, e começa a partida do zero. */
function iniciarPartida() {
  prepararNovaPartida();
  estadoDaPartida = 'jogando';
  telaInicio.hidden = true;
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  controleDoJogo.start();
  botaoPausar.focus({ preventScroll: true });
}

/** Abre a tela inicial e para o jogo. Usada ao carregar a página e ao perder todas as vidas. */
function mostrarTelaInicio() {
  estadoDaPartida = 'inicio';
  controleDoJogo.stop();
  limparAcoes();
  botaoPausar.hidden = true;
  menuPausa.hidden = true;
  telaInicio.hidden = false;
  pararMusicaFundo();
  botaoJogar.focus({ preventScroll: true });
}

function reiniciarJogo() {
  // Na tela inicial não há fase em andamento para reiniciar.
  if (estadoDaPartida === 'inicio') return;

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
  },

  resolveCollisions: (deltaTime) => {
    resolverColisoes(player, deltaTime);

    const checkpoint = verificarCheckpoints(player);
    if (checkpoint) {
      mensagem = 'Checkpoint salvo';
      mensagemAte = performance.now() + 1500;
    }

    if (player.y > LIMITE_QUEDA) {
      reposicionar(obterPontoSeguro());
      mensagem = 'Queda: retorno ao ponto seguro';
      mensagemAte = performance.now() + 1500;
    }
  },

  drawScene: (ctx) => {
    const cameraX = calcularCamera(player.x, player.largura);
    desenharFase(ctx, cameraX);

    // O personagem usa coordenadas do mundo, então é desenhado com a mesma câmera.
    ctx.save();
    aplicarCameraMundo(ctx, cameraX);
    player.desenhar(ctx);
    ctx.restore();

    // Vidas e mensagens ficam fixas na tela.
    desenharVidas(ctx, player.vidas);

    if (mensagem && performance.now() < mensagemAte) {
      ctx.fillStyle = '#1d3557';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(mensagem, 24, 80);
    }
  },
};

const controleDoJogo = startGame(canvas, context, dependenciasDoJogo);
// O jogo começa parado: a tela inicial é exibida até o jogador clicar em Jogar.
mostrarTelaInicio();

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
  botaoRetomar.focus({ preventScroll: true });
}

function retomarPartida() {
  if (estadoDaPartida !== 'pausado') return;

  limparAcoes();
  estadoDaPartida = 'jogando';
  menuPausa.hidden = true;
  botaoPausar.hidden = false;
  controleDoJogo.start();
  retomarMusicaFundo();
  botaoPausar.focus({ preventScroll: true });
}

// O evento click atende tanto ao mouse quanto ao toque nos botões.
botaoJogar.addEventListener('click', () => {
  tocarSomApertarPlay();
  iniciarMusicaFundo();
  iniciarPartida();
});
botaoPausar.addEventListener('click', pausarPartida);
botaoRetomar.addEventListener('click', retomarPartida);

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
window.addEventListener('keydown', (evento) => {
  // Com o painel de som aberto, Esc só fecha o painel: não pausa nem retoma o jogo.
  if (!menuSom.hidden) {
    if (evento.key === 'Escape') fecharMenuSom();
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
