// Animação por quadros em PNG, sem depender de ImageDecoder.
import { registrarCarregamento } from './carregamento.js';

export class AnimacaoSprite {
  constructor({ arquivo, largura, altura, quadros, duracao }) {
    this.img = new Image();
    this.img.src = arquivo;
    // A tela de carregamento espera a imagem; erro também conta como pronto, para não travar.
    this.pronto = new Promise((resolve) => {
      if (this.img.complete) return resolve();
      this.img.addEventListener('load', resolve, { once: true });
      this.img.addEventListener('error', resolve, { once: true });
    });
    registrarCarregamento(this.pronto);
    this.largura = largura;
    this.altura = altura;
    this.quadros = quadros;
    this.duracao = duracao;
    this.tempoTotal = quadros * duracao / 1000;
  }

  desenhar(ctx, tempo, x, y, largura, altura, flip = false) {
    if (!this.img.complete || this.img.naturalWidth === 0) return;
    const quadro = Math.floor(Math.max(0, tempo) * 1000 / this.duracao) % this.quadros;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.translate(x + largura, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }
    ctx.drawImage(this.img, quadro * this.largura, 0, this.largura, this.altura, x, y, largura, altura);
    ctx.restore();
  }
}
