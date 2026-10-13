import { AnimacaoGIF } from './player.js';
import { interseca } from './collisions.js';

const PASTA_INIMIGOS = 'assets/characters/Imagens_Personagens/05_inimigos/';
const animacaoSentinela = new AnimacaoGIF(`${PASTA_INIMIGOS}03_robo_sentinela_andando.gif`);
const animacaoSentinelaMorrendo = new AnimacaoGIF(`${PASTA_INIMIGOS}04_robo_sentinela_morrendo.gif`);
const animacaoPlanta = new AnimacaoGIF(`${PASTA_INIMIGOS}01_planta_parada.gif`);
const animacaoPlantaMorrendo = new AnimacaoGIF(`${PASTA_INIMIGOS}02_planta_morrendo.gif`);

// Duração da morte enquanto o GIF ainda não foi decodificado, em segundos.
const DURACAO_MORTE_PADRAO = 1;
// Distância horizontal até a área do inimigo em que a pergunta aparece.
const ALCANCE_DESAFIO = 120;
// Altura acima do chão do inimigo em que a pergunta ainda aparece: pega quem tenta passar pulando
// (por exemplo, de parede em parede até a saída).
const ALTURA_DESAFIO = 120;

/**
 * Regras comuns aos inimigos com desafio (campo `desafio` em level.js).
 * Estados: ativo → alvo (acertou a pergunta; o poder do Byte está a caminho)
 * → derrotado (GIF de morte) → removido (some do mapa).
 * Só o inimigo ativo causa dano.
 */
class Inimigo {
  constructor(desafio, animacaoMorte) {
    this.desafio = desafio;
    this.animacaoMorte = animacaoMorte;
  }

  reiniciarEstado() {
    this.estado = 'ativo';
    this.desafioFeito = false;
    this.tempoMorte = 0;
  }

  /** Limites horizontais em que o inimigo age, para medir a aproximação do personagem. */
  areaDesafio() {
    return { inicioX: this.x, fimX: this.x + this.largura };
  }

  /** Verdadeiro quando o personagem chega perto, andando ou pulando, de uma pergunta ainda não feita. */
  pedeDesafio(personagem) {
    if (!this.desafio || this.desafioFeito || this.estado !== 'ativo') return false;
    const { inicioX, fimX } = this.areaDesafio();
    const pes = personagem.y + personagem.altura;
    return pes <= this.superficieY + 2 && pes > this.superficieY - ALTURA_DESAFIO
      && personagem.x + personagem.largura > inicioX - ALCANCE_DESAFIO
      && personagem.x < fimX + ALCANCE_DESAFIO;
  }

  /** Pergunta respondida certo: o inimigo para e deixa de causar dano até o poder chegar. */
  marcarAlvo() {
    this.estado = 'alvo';
  }

  /** Atingido pelo poder: mostra a animação de morte e depois some. */
  derrotar() {
    this.estado = 'derrotado';
    this.tempoMorte = 0;
  }

  /** Centro do corpo, para onde o poder voa. */
  centro() {
    return { x: this.x + this.largura / 2, y: this.y + this.altura / 2 };
  }

  /** Avança a morte. Devolve true enquanto o inimigo não estiver ativo (sem patrulha nem animação normal). */
  atualizarMorte(deltaTime) {
    if (this.estado === 'ativo' || this.estado === 'alvo') return this.estado === 'alvo';
    this.tempoMorte += deltaTime;
    if (this.estado === 'derrotado' && this.tempoMorte >= this.duracaoMorte()) this.estado = 'removido';
    return true;
  }

  duracaoMorte() {
    return this.animacaoMorte.tempoTotal || DURACAO_MORTE_PADRAO;
  }

  toca(personagem) {
    if (this.estado !== 'ativo') return false;
    return interseca(
      this.x, this.y, this.largura, this.altura,
      personagem.x, personagem.y, personagem.largura, personagem.altura,
    );
  }

  /** Desenha a morte parando no último quadro. Devolve true se já desenhou (ou se o inimigo sumiu). */
  desenharMorte(ctx, dx, dy, tamanho, flip = false) {
    if (this.estado === 'removido') return true;
    if (this.estado !== 'derrotado') return false;
    const tempo = Math.min(this.tempoMorte, this.duracaoMorte() - 0.001);
    this.animacaoMorte.desenhar(ctx, tempo, dx, dy, tamanho, tamanho, flip);
    return true;
  }
}

/** Planta fixa no chão, animada e perigosa ao contato. */
export class Planta extends Inimigo {
  constructor({ x, superficieY, desafio = null }) {
    super(desafio, animacaoPlantaMorrendo);
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
    this.reiniciarEstado();
  }

  atualizar(deltaTime) {
    if (this.atualizarMorte(deltaTime) && this.estado !== 'alvo') return;
    this.tempoAnimacao += deltaTime;
  }

  desenhar(ctx) {
    const tamanhoSprite = 72;
    const dx = Math.round(this.x + this.largura / 2 - tamanhoSprite / 2);
    const dy = Math.round(this.superficieY - tamanhoSprite);
    if (this.desenharMorte(ctx, dx, dy, tamanhoSprite)) return;
    animacaoPlanta.desenhar(
      ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite,
    );
  }
}

/** Robô que patrulha um trecho fixo, em coordenadas do mundo. */
export class Sentinela extends Inimigo {
  constructor({ inicioX, fimX, superficieY, velocidade = 80, desafio = null }) {
    super(desafio, animacaoSentinelaMorrendo);
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
    this.reiniciarEstado();
  }

  areaDesafio() {
    return { inicioX: this.inicioX, fimX: this.fimX };
  }

  atualizar(deltaTime) {
    // Como alvo, o robô para no lugar e continua animado até o poder chegar.
    if (this.atualizarMorte(deltaTime)) {
      if (this.estado === 'alvo') this.tempoAnimacao += deltaTime;
      return;
    }

    // Reflete o percurso nas duas extremidades, preservando o tempo excedente.
    const ciclo = this.distanciaPatrulha * 2;
    this.progresso = (this.progresso + this.velocidade * deltaTime) % ciclo;
    this.direcao = this.progresso < this.distanciaPatrulha ? 1 : -1;
    this.x = this.inicioX + (this.direcao === 1
      ? this.progresso
      : ciclo - this.progresso);
    this.tempoAnimacao += deltaTime;
  }

  desenhar(ctx) {
    const tamanhoSprite = 72;
    const dx = Math.round(this.x + this.largura / 2 - tamanhoSprite / 2);
    const dy = Math.round(this.superficieY - 70);
    // O GIF original olha para a esquerda.
    if (this.desenharMorte(ctx, dx, dy, tamanhoSprite, this.direcao === 1)) return;

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

    animacaoSentinela.desenhar(
      ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite, this.direcao === 1,
    );
  }
}
