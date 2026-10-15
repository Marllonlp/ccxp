// Responsável: Pedro. Arquivo reservado para estado e movimentação do personagem.
// As posições e dimensões usam os pixels internos do Canvas (960 × 540).
// A atualização será chamada pelo ciclo com ações e deltaTime em segundos.

import { inputState } from './input.js';
import { registrarEfeito } from './audio.js';
import { sprites } from './sprites.js';

export const byteSprites = {
  parado: sprites.byteParado,
  correndo: sprites.byteCorrendo,
  pulando: sprites.bytePulando,
  caindo: sprites.byteCaindo,
  agachado: sprites.byteAgachado,
  dano: sprites.byteDano,
  morte: sprites.byteMorte,
};

export const heartSprites = {
  cheia: sprites.vidaCheia,
  vazia: sprites.vidaVazia,
  ultima: sprites.vidaUltima,
};

export function desenharVidas(ctx, vidas, tempo = performance.now() / 1000, { x = 24, y = 20 } = {}) {
  const totalVidas = 3;
  const startX = x;
  const startY = y;
  const tamanho = 32;
  const espacamento = 38;

  for (let i = 0; i < totalVidas; i++) {
    const x = startX + i * espacamento;
    const y = startY;

    if (vidas > i) {
      if (vidas === 1 && i === 0) {
        heartSprites.ultima.desenhar(ctx, tempo, x, y, tamanho, tamanho);
      } else {
        heartSprites.cheia.desenhar(ctx, tempo, x, y, tamanho, tamanho);
      }
    } else {
      heartSprites.vazia.desenhar(ctx, tempo, x, y, tamanho, tamanho);
    }
  }
}

const somPulo = new Audio('assets/sound/pular.mp3');
registrarEfeito(somPulo);

/** Toca o som de pulo uma vez. Falhas de reprodução são registradas no console e não travam o jogo. */
function tocarSomPulo() {
  try {
    somPulo.currentTime = 0;
    somPulo.play().catch((erro) => console.error('Falha ao tocar pular.mp3:', erro));
  } catch (erro) {
    console.error('Falha ao tocar pular.mp3:', erro);
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.larguraNormal = 40;
    // Caixa de colisão igual ao desenho do Byte: em pé 66 px, agachado 49 px.
    // Em pé ela fica abaixo da plataforma (base em y=410); agachado passa pelo bloco suspenso (vão de 50 px).
    this.alturaNormal = 66;
    this.alturaAgachado = 49;
    this.largura = this.larguraNormal;
    this.altura = this.alturaNormal;

    this.vx = 0;
    this.vy = 0;
    this.velocidadeMovimento = 300;
    this.forcaPulo = -500;
    this.gravidade = 1200;

    this.noChao = false;
    this.agachado = false;

    this.vidas = 3;
    this.emQuedaLivre = false;
    this.tempoInvulneravel = 0;

    this.olhandoDireita = true;
    this.estadoAnimacao = 'parado';
    this.tempoAnimacao = 0;
  }

  obterEstado() {
    if (this.vidas <= 0) return 'morte';
    if (this.tempoInvulneravel > 0) return 'dano';
    if (this.emQuedaLivre) return 'caindo';
    if (this.agachado) return 'agachado';
    if (!this.noChao) {
      return this.vy < 0 ? 'pulando' : 'caindo';
    }
    if (Math.abs(this.vx) > 0) return 'correndo';
    return 'parado';
  }

  atualizar(deltaTime, verificarEspacoTeto, limiteFaseY, onGameOver) {
    this.tempoInvulneravel = Math.max(0, this.tempoInvulneravel - deltaTime);

    // 1. Movimento e Ações (ignorado em queda livre)
    if (!this.emQuedaLivre) {
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
          this.altura = this.alturaAgachado;
          this.y += this.alturaNormal - this.alturaAgachado; // Mantém os pés na mesma posição
        }
      } else if (this.agachado) {
        // Se a função não for passada na integração, assume que tem espaço (fallback temporário)
        const temEspaco = verificarEspacoTeto
          ? verificarEspacoTeto(this.x, this.y - (this.alturaNormal - this.alturaAgachado), this.largura, this.alturaNormal)
          : true;

        if (temEspaco) {
          this.agachado = false;
          this.y -= this.alturaNormal - this.alturaAgachado;
          this.altura = this.alturaNormal;
        }
      }

      // 3. Lógica de Pulo
      if (inputState.pulo && this.noChao && !this.agachado) {
        this.vy = this.forcaPulo;
        this.noChao = false;
        inputState.pulo = false;
        tocarSomPulo();
      }
    }

    // 4. Aplicação da gravidade e atualização da posição teórica
    this.vy += this.gravidade * deltaTime;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Atualização de orientação
    if (this.vx > 0) {
      this.olhandoDireita = true;
    } else if (this.vx < 0) {
      this.olhandoDireita = false;
    }

    // Atualização do estado de animação e tempo acumulado
    const novoEstado = this.obterEstado();
    if (novoEstado !== this.estadoAnimacao) {
      this.estadoAnimacao = novoEstado;
      this.tempoAnimacao = 0;
    } else {
      this.tempoAnimacao += deltaTime;
    }

    // 5. Verificação de queda do mapa
    if (limiteFaseY !== undefined && this.y > limiteFaseY) {
      if (!this.emQuedaLivre) {
        this.emQuedaLivre = true;
        this.vidas -= 1;
        if (this.vidas <= 0 && typeof onGameOver === 'function') {
          onGameOver();
        }
      }
    }
  }

  receberDano() {
    if (this.vidas <= 0 || this.tempoInvulneravel > 0) return false;

    this.vidas -= 1;
    this.tempoInvulneravel = 1;
    this.estadoAnimacao = this.obterEstado();
    this.tempoAnimacao = 0;
    return true;
  }

  retornar(x, y) {
    if (typeof x === 'object' && x !== null) {
      y = x.y;
      x = x.x;
    }
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.emQuedaLivre = false;
    this.noChao = false;
    this.agachado = false;
    this.altura = this.alturaNormal;
    this.estadoAnimacao = this.tempoInvulneravel > 0 ? 'dano' : 'parado';
    this.tempoAnimacao = 0;
  }

  desenhar(ctx) {
    const animacao = byteSprites[this.estadoAnimacao] || byteSprites.parado;
    // Todos os estados usam a mesma escala, então o Byte tem sempre o mesmo tamanho.
    // Valores em pixels do sprite original de 96 × 96: o corpo visível vai da linha 2 até a 93
    // (agachado, da linha 26). Com escala 0,72, o corpo em pé ocupa 66 px e agachado 49 px.
    const escala = 0.72;
    const tamanhoSprite = 96 * escala;
    const CENTRO_VISIVEL = 54;
    const BASE_VISIVEL = 94;
    const dx = Math.round(this.x + (this.largura / 2) - CENTRO_VISIVEL * escala);
    // Os pés ficam na base da caixa de colisão.
    const dy = Math.round(this.y + this.altura - BASE_VISIVEL * escala);
    const flip = !this.olhandoDireita;

    ctx.save();
    if (this.tempoInvulneravel > 0 && Math.floor(this.tempoInvulneravel * 10) % 2 === 0) {
      ctx.globalAlpha *= 0.35;
    }
    animacao.desenhar(ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite, flip);
    ctx.restore();
  }

  desenharVidas(ctx, tempo) {
    desenharVidas(ctx, this.vidas, tempo);
  }
}
