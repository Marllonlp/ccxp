// Tiro de energia do Byte, compartilhado pelas fases e pela luta do chefão.
// Voa até o centro do alvo e aplica o acerto quando chega.
import { tocarEfeitoEletronico } from './audio.js';

const VELOCIDADE = 360; // px/s
// Posições anteriores desenhadas como rastro.
const TAMANHO_RASTRO = 10;

export class Tiro {
  /** Sai do personagem em direção ao `alvo` (inimigo com centro() e derrotar()). */
  constructor(personagem, alvo, onAcerto = () => {}) {
    this.x = personagem.x + personagem.largura / 2;
    this.y = personagem.y + personagem.altura / 2 - 6;
    this.alvo = alvo;
    this.onAcerto = onAcerto;
    this.tempo = 0;
    this.rastro = [];
    this.terminou = false;
    tocarEfeitoEletronico('tiro');
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
    // Cauda contínua: o azul destaca o disparo e o centro claro mostra a trajetória.
    if (this.rastro.length) {
      const inicio = this.rastro[0];
      const cauda = ctx.createLinearGradient(inicio.x, inicio.y, this.x, this.y);
      cauda.addColorStop(0, 'rgba(71, 79, 255, 0)');
      cauda.addColorStop(0.45, 'rgba(71, 111, 255, 0.5)');
      cauda.addColorStop(1, '#55edff');
      ctx.beginPath();
      ctx.moveTo(inicio.x, inicio.y);
      for (const ponto of this.rastro) ctx.lineTo(ponto.x, ponto.y);
      ctx.lineTo(this.x, this.y);
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = cauda;
      ctx.stroke();
      const nucleo = ctx.createLinearGradient(inicio.x, inicio.y, this.x, this.y);
      nucleo.addColorStop(0, 'rgba(209, 255, 255, 0)');
      nucleo.addColorStop(1, '#f4ffff');
      ctx.strokeStyle = nucleo;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    this.rastro.forEach((ponto, i) => {
      if (i % 3 !== 0) return;
      ctx.globalAlpha = ((i + 1) / TAMANHO_RASTRO) * 0.7;
      ctx.fillStyle = '#b7b5ff';
      ctx.fillRect(Math.round(ponto.x) - 1, Math.round(ponto.y) + (i % 2 ? -7 : 5), 3, 2);
    });
    const destino = this.alvo.centro();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(Math.atan2(destino.y - this.y, destino.x - this.x));
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#4bdfff';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-8, -11);
    ctx.lineTo(8, -11);
    ctx.lineTo(20, 0);
    ctx.lineTo(8, 11);
    ctx.lineTo(-8, 11);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Carcaça escura e núcleo branco continuam legíveis nos cenários claros.
    ctx.fillStyle = '#071d43';
    ctx.fillRect(-14, -5, 25, 10);
    ctx.fillRect(-9, -8, 17, 16);
    ctx.fillRect(11, -2, 5, 4);
    ctx.fillStyle = '#3884ff';
    ctx.fillRect(-12, -4, 23, 8);
    ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = '#58f1ff';
    ctx.fillRect(-8, -4, 18, 8);
    ctx.fillRect(-4, -6, 8, 12);
    ctx.fillStyle = '#ffffe9';
    ctx.fillRect(-4, -3, 15, 6);
    ctx.fillRect(11, -1, 4, 2);
    // Anéis segmentados e contatos dourados dão a aparência de um pulso de circuito.
    const pulso = Math.floor(this.tempo * 12) % 2;
    for (const lado of [-1, 1]) {
      ctx.fillStyle = '#092653';
      ctx.fillRect(-9, lado * 10 - 1, 16, 3);
      ctx.fillStyle = pulso ? '#86faff' : '#b9bcff';
      ctx.fillRect(-7, lado * 10, 11, 1);
      ctx.fillRect(-11, lado * 7, 3, 2);
      ctx.fillRect(6, lado * 8, 3, 2);
    }
    ctx.fillStyle = '#ffe27b';
    ctx.fillRect(-12, -3, 3, 2);
    ctx.fillRect(-12, 1, 3, 2);
    ctx.restore();
  }
}
