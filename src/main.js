// src/main.js
import { startGame } from './game.js';
import { Player } from './player.js';
import { inputState, configurarControlesToque } from './input.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

configurarControlesToque();

// Cria o seu personagem no meio da tela
const player = new Player(460, 200);

const dependenciasDoJogo = {
  readActions: () => inputState,

  updatePlayer: (actions, deltaTime) => {
    // Atualiza a física do seu código
    player.atualizar(deltaTime, () => true);

    // CHÃO FALSO PARA TESTE (Simulando o código do Dudu)
    // Se o personagem passar da altura 400, ele trava ali e pode pular de novo
    if (player.y > 400) {
      player.y = 400;
      player.vy = 0;
      player.noChao = true;
    }
  },

  resolveCollisions: () => { },

  drawScene: (ctx, cvs) => {
    // Desenha o chão falso (um bloco cinza)
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 480, 960, 60);

    // Desenha o seu personagem (o retângulo azul)
    player.desenhar(ctx);
  }
};

startGame(canvas, context, dependenciasDoJogo);