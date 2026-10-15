// Poder do Byte: o ícone </> que sai do personagem quando ele acerta a pergunta de um monstro.
// Voa até o centro do inimigo e, ao chegar, o derrota.

import { sprites } from './sprites.js';

const animacaoPoder = sprites.poder;
// Sprite original de 16 × 15, desenhado com o dobro do tamanho.
const LARGURA = 32;
const ALTURA = 30;
const VELOCIDADE = 360; // px/s
// Posições anteriores desenhadas como rastro.
const TAMANHO_RASTRO = 6;

export class Poder {
  /** Sai do centro do personagem em direção ao `alvo` (inimigo com centro() e derrotar()). */
  constructor(personagem, alvo, onAcerto = () => {}) {
    this.x = personagem.x + personagem.largura / 2;
    this.y = personagem.y + personagem.altura / 2 - 6;
    this.alvo = alvo;
    this.onAcerto = onAcerto;
    this.tempo = 0;
    this.rastro = [];
    this.terminou = false;
  }

  atualizar(deltaTime) {
    if (this.terminou) return;
    this.tempo += deltaTime;
    this.rastro.push({ x: this.x, y: this.y });
    if (this.rastro.length > TAMANHO_RASTRO) this.rastro.shift();

    const destino = this.alvo.centro();
    const dx = destino.x - this.x;
    const dy = destino.y - this.y;
    const distancia = Math.hypot(dx, dy);
    const passo = VELOCIDADE * deltaTime;
    if (distancia <= passo) {
      this.terminou = true;
      this.alvo.derrotar();
      this.onAcerto();
      return;
    }
    this.x += (dx / distancia) * passo;
    this.y += (dy / distancia) * passo;
  }

  desenhar(ctx) {
    if (this.terminou) return;
    ctx.save();
    this.rastro.forEach((ponto, i) => {
      ctx.globalAlpha = ((i + 1) / (TAMANHO_RASTRO + 1)) * 0.5;
      ctx.fillStyle = '#3ce6ff';
      const lado = 4 + i;
      ctx.fillRect(Math.round(ponto.x - lado / 2), Math.round(ponto.y - lado / 2), lado, lado);
    });
    ctx.restore();
    animacaoPoder.desenhar(
      ctx, this.tempo, Math.round(this.x - LARGURA / 2), Math.round(this.y - ALTURA / 2), LARGURA, ALTURA,
    );
  }
}
