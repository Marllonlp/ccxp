// Responsável: Dudu. Detecção e resolução das colisões.
// O ciclo chama esta etapa após o movimento do personagem e antes do desenho.

import { obstaculos, moedas, vidasItens } from './level.js';

/** Sobreposição entre dois retângulos, sem contar o encosto exato. */
export function interseca(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Retorna o item coletado neste quadro, ou null. */
export function verificarColetaveis(player) {
  for (const item of [...moedas, ...vidasItens]) {
    if (!item.coletado && interseca(
      player.x, player.y, player.largura, player.altura,
      item.x, item.y, 16, 16,
    )) {
      item.coletado = true;
      return item;
    }
  }
  return null;
}

/**
 * Resolve o movimento do personagem contra os obstáculos, um eixo por vez.
 *
 * O personagem já somou vx e vy à sua posição, então reconstruímos o y anterior
 * a partir da velocidade vertical: assim o eixo horizontal é resolvido na altura
 * de antes do deslocamento, o que evita travar nos cantos.
 *
 * Ao final, player.noChao indica se existe apoio sob os pés.
 */
export function resolverColisoes(player, deltaTime) {
  const yNovo = player.y;
  const yAnterior = yNovo - player.vy * deltaTime;

  // --- Eixo horizontal: impede atravessar paredes ---
  player.y = yAnterior;
  for (const obstaculo of obstaculos) {
    if (!interseca(
      player.x, player.y, player.largura, player.altura,
      obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height,
    )) continue;

    if (player.vx > 0) {
      player.x = obstaculo.x - player.largura;
    } else if (player.vx < 0) {
      player.x = obstaculo.x + obstaculo.width;
    }
    player.vx = 0;
  }

  // --- Eixo vertical: pousar em cima e interromper a subida por baixo ---
  player.y = yNovo;
  player.noChao = false;

  for (const obstaculo of obstaculos) {
    if (!interseca(
      player.x, player.y, player.largura, player.altura,
      obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height,
    )) continue;

    if (player.vy > 0) {
      // Descendo: pousa sobre a superfície e ganha apoio.
      player.y = obstaculo.y - player.altura;
      player.vy = 0;
      player.noChao = true;
    } else if (player.vy < 0) {
      // Subindo: bate a cabeça e perde o impulso, sem ficar preso.
      player.y = obstaculo.y + obstaculo.height;
      player.vy = 0;
    }
  }

  // Fora de qualquer superfície o apoio não é reposto, então sair de uma borda
  // deixa a gravidade agir.
}

/**
 * Informa se um espaço está livre de obstáculos. Pedro usa esta verificação
 * para só deixar o personagem levantar quando houver altura disponível.
 */
export function verificarEspaco(x, y, largura, altura) {
  for (const obstaculo of obstaculos) {
    if (interseca(
      x, y, largura, altura,
      obstaculo.x, obstaculo.y, obstaculo.width, obstaculo.height,
    )) {
      return false;
    }
  }
  return true;
}
