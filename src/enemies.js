import { AnimacaoGIF } from './player.js';
import { interseca } from './collisions.js';

const animacaoSentinela = new AnimacaoGIF(
  'assets/characters/Imagens_Personagens/05_inimigos/03_robo_sentinela_andando.gif',
);
const animacaoPlanta = new AnimacaoGIF(
  'assets/characters/Imagens_Personagens/05_inimigos/01_planta_parada.gif',
);

/** Planta fixa no chão, animada e perigosa ao contato. */
export class Planta {
  constructor({ x, superficieY }) {
    this.nome = 'Planta';
    this.x = x;
    this.superficieY = superficieY;
    this.largura = 42;
    this.altura = 56;
    this.y = superficieY - this.altura;
    this.reiniciar();
  }

  reiniciar() {
    this.tempoAnimacao = 0;
  }

  atualizar(deltaTime) {
    this.tempoAnimacao += deltaTime;
  }

  toca(personagem) {
    return interseca(
      this.x, this.y, this.largura, this.altura,
      personagem.x, personagem.y, personagem.largura, personagem.altura,
    );
  }

  desenhar(ctx) {
    const tamanhoSprite = 72;
    const dx = Math.round(this.x + this.largura / 2 - tamanhoSprite / 2);
    const dy = Math.round(this.superficieY - tamanhoSprite);
    animacaoPlanta.desenhar(
      ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite,
    );
  }
}

/** Robô que patrulha um trecho fixo, em coordenadas do mundo. */
export class Sentinela {
  constructor({ inicioX, fimX, superficieY, velocidade = 80 }) {
    this.nome = 'Sentinela';
    this.inicioX = inicioX;
    this.fimX = fimX;
    this.superficieY = superficieY;
    this.velocidade = velocidade;
    this.largura = 36;
    this.altura = 56;
    this.y = superficieY - this.altura;

    // O limite direito inclui a largura do robô, para ele nunca sair do campo.
    this.distanciaPatrulha = fimX - inicioX - this.largura;
    if (this.distanciaPatrulha <= 0) {
      throw new RangeError('O campo de patrulha deve ser mais largo que o sentinela.');
    }
    this.reiniciar();
  }

  reiniciar() {
    this.x = this.inicioX;
    this.direcao = 1;
    this.progresso = 0;
    this.tempoAnimacao = 0;
  }

  atualizar(deltaTime) {
    // Reflete o percurso nas duas extremidades, preservando o tempo excedente.
    const ciclo = this.distanciaPatrulha * 2;
    this.progresso = (this.progresso + this.velocidade * deltaTime) % ciclo;
    this.direcao = this.progresso < this.distanciaPatrulha ? 1 : -1;
    this.x = this.inicioX + (this.direcao === 1
      ? this.progresso
      : ciclo - this.progresso);
    this.tempoAnimacao += deltaTime;
  }

  toca(personagem) {
    return interseca(
      this.x, this.y, this.largura, this.altura,
      personagem.x, personagem.y, personagem.largura, personagem.altura,
    );
  }

  desenhar(ctx) {
    // Dois marcos no chão mostram ao jogador até onde o robô patrulha.
    ctx.save();
    ctx.fillStyle = '#f4bf4f';
    ctx.strokeStyle = '#674c22';
    ctx.lineWidth = 1;
    for (const x of [this.inicioX, this.fimX]) {
      ctx.fillRect(x - 3, this.superficieY - 12, 6, 12);
      ctx.strokeRect(x - 3, this.superficieY - 12, 6, 12);
    }
    ctx.restore();

    const tamanhoSprite = 72;
    const dx = Math.round(this.x + this.largura / 2 - tamanhoSprite / 2);
    const dy = Math.round(this.superficieY - 70);
    // O GIF original olha para a esquerda.
    animacaoSentinela.desenhar(
      ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite, this.direcao === 1,
    );
  }
}
