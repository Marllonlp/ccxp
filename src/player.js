// Responsável: Pedro. Arquivo reservado para estado e movimentação do personagem.
// As posições e dimensões usam os pixels internos do Canvas (960 × 540).
// A atualização será chamada pelo ciclo com ações e deltaTime em segundos.

import { inputState } from './input.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.larguraNormal = 40;
    this.alturaNormal = 80;
    this.largura = this.larguraNormal;
    this.altura = this.alturaNormal;

    this.vx = 0;
    this.vy = 0;
    this.velocidadeMovimento = 300;
    this.forcaPulo = -500;
    this.gravidade = 1200;

    this.noChao = false;
    this.agachado = false;
  }

  atualizar(deltaTime, verificarEspacoTeto) {
    // 1. Movimento Horizontal
    if (inputState.esquerda && !inputState.direita) {
      this.vx = -this.velocidadeMovimento;
    } else if (inputState.direita && !inputState.esquerda) {
      this.vx = this.velocidadeMovimento;
    } else {
      this.vx = 0;
    }

    // 2. Lógica de Agachamento
    if (inputState.agachamento) {
      if (!this.agachado) {
        this.agachado = true;
        this.altura = this.alturaNormal / 2;
        this.y += this.alturaNormal / 2; // Mantém os pés na mesma posição
      }
    } else if (this.agachado) {
      // Se a função não for passada na integração, assume que tem espaço (fallback temporário)
      const temEspaco = verificarEspacoTeto
        ? verificarEspacoTeto(this.x, this.y - (this.alturaNormal / 2), this.largura, this.alturaNormal)
        : true;

      if (temEspaco) {
        this.agachado = false;
        this.y -= this.alturaNormal / 2;
        this.altura = this.alturaNormal;
      }
    }

    // 3. Lógica de Pulo
    if (inputState.pulo && this.noChao && !this.agachado) {
      this.vy = this.forcaPulo;
      this.noChao = false;
      inputState.pulo = false;
    }

    // 4. Aplicação da gravidade e atualização da posição teórica
    this.vy += this.gravidade * deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  desenhar(ctx) {
    // Visual temporário até a integração com os assets do Kelvis
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.largura, this.altura);
  }
}