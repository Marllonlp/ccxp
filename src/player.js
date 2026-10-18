// Estado, movimentação e animações do personagem.
// As posições e dimensões usam os pixels internos do Canvas (960 × 540).
// A atualização será chamada pelo ciclo com ações e deltaTime em segundos.

import { inputState } from './input.js';
import { registrarEfeito } from './audio.js';
import { sprites } from './sprites.js';
import { AnimacaoSprite } from './animacao.js';
import { buscarSkin } from './skins.js';
import { movimentoReduzido } from './acessibilidade.js';

// Estado da animação -> tira PNG em assets/animacoes/ (o Clássico) ou na pasta da skin.
const TIRAS_BYTE = {
  parado: 'byteParado',
  correndo: 'byteCorrendo',
  pulando: 'bytePulando',
  caindo: 'byteCaindo',
  agachado: 'byteAgachado',
  dano: 'byteDano',
  morte: 'byteMorte',
};

// Animações da skin equipada. O objeto é o mesmo para sempre: a fase e a demonstração do título
// leem dele a cada quadro, então trocar a skin troca o desenho nos dois lugares.
export const byteSprites = {};
const animacoesPorSkin = new Map();
let efeitoSkin = null;

export function pastaDaSkin(id) {
  return id === 'classico' ? 'assets/animacoes/' : `assets/animacoes/skins/${id}/`;
}

/** Equipa a skin `id`: troca as 7 animações do Byte. Tamanho e hitbox não mudam. */
export function carregarAnimacoesByte(id) {
  const skin = buscarSkin(id);
  if (!animacoesPorSkin.has(skin.id)) {
    const pasta = pastaDaSkin(skin.id);
    animacoesPorSkin.set(skin.id, Object.fromEntries(Object.entries(TIRAS_BYTE).map(([estado, tira]) => {
      // As skins têm os mesmos quadros e tempos do Clássico, que já estão em sprites.js.
      const { largura, altura, quadros, duracao } = sprites[tira];
      const animacao = skin.id === 'classico'
        ? sprites[tira]
        : new AnimacaoSprite({ arquivo: `${pasta}${tira}.png`, largura, altura, quadros, duracao });
      return [estado, animacao];
    })));
  }
  Object.assign(byteSprites, animacoesPorSkin.get(skin.id));
  efeitoSkin = skin.efeito ?? null;
}
carregarAnimacoesByte('classico');

// Efeito rastro_terminal: caracteres verdes soltos atrás do Byte enquanto ele corre ou está no ar.
const CARACTERES_RASTRO = ['0', '1', '{', '}', '<', '>', ';'];
const INTERVALO_RASTRO = 0.08;
const VIDA_RASTRO = 0.5;
const MAXIMO_RASTRO = 12;
// Efeito tremor_glitch: a cada 2 a 4 s, o desenho se desloca 2 px para o lado por 120 ms.
const DESLOCAMENTO_GLITCH = 2;
const DURACAO_GLITCH = 0.12;
const proximoGlitch = () => 2 + Math.random() * 2;

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

    this.rastro = [];
    this.esperaRastro = 0;
    this.esperaGlitch = proximoGlitch();
    this.glitchRestante = 0;
    this.glitchLado = 1;
  }

  /** Atualiza o rastro (Hacker) e o tremor (Glitch). Sem efeito na skin, apenas limpa o que sobrou. */
  atualizarEfeitoSkin(deltaTime) {
    for (const caractere of this.rastro) {
      caractere.vida -= deltaTime;
      caractere.y += 20 * deltaTime;
    }
    this.rastro = this.rastro.filter((caractere) => caractere.vida > 0);

    if (efeitoSkin === 'rastro_terminal') {
      const emMovimento = !this.emQuedaLivre && (!this.noChao || this.vx !== 0);
      this.esperaRastro -= deltaTime;
      if (emMovimento && this.esperaRastro <= 0) {
        this.esperaRastro = INTERVALO_RASTRO;
        if (this.rastro.length >= MAXIMO_RASTRO) this.rastro.shift();
        this.rastro.push({
          texto: CARACTERES_RASTRO[Math.floor(Math.random() * CARACTERES_RASTRO.length)],
          x: this.olhandoDireita ? this.x - 4 : this.x + this.largura + 4,
          y: this.y + this.altura * (0.3 + Math.random() * 0.5),
          vida: VIDA_RASTRO,
        });
      }
    }

    this.glitchRestante = Math.max(0, this.glitchRestante - deltaTime);
    // Com movimento reduzido, o Glitch fica só com a borda ciano e magenta dos GIFs.
    if (efeitoSkin === 'tremor_glitch' && !movimentoReduzido()) {
      this.esperaGlitch -= deltaTime;
      if (this.esperaGlitch <= 0) {
        this.esperaGlitch = proximoGlitch();
        this.glitchRestante = DURACAO_GLITCH;
        this.glitchLado = Math.random() < 0.5 ? -1 : 1;
      }
    }
  }

  desenharRastro(ctx) {
    if (this.rastro.length === 0) return;
    ctx.save();
    ctx.font = 'bold 10px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#39ff7a';
    for (const caractere of this.rastro) {
      ctx.globalAlpha = Math.max(0, caractere.vida / VIDA_RASTRO);
      ctx.fillText(caractere.texto, caractere.x, caractere.y);
    }
    ctx.restore();
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
    this.atualizarEfeitoSkin(deltaTime);

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
    this.rastro = [];
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
    const tremor = this.glitchRestante > 0 ? DESLOCAMENTO_GLITCH * this.glitchLado : 0;
    const dx = Math.round(this.x + (this.largura / 2) - CENTRO_VISIVEL * escala) + tremor;
    // Os pés ficam na base da caixa de colisão.
    const dy = Math.round(this.y + this.altura - BASE_VISIVEL * escala);
    const flip = !this.olhandoDireita;

    this.desenharRastro(ctx);
    ctx.save();
    // Invulnerável: pisca; com movimento reduzido, fica com transparência fixa.
    if (this.tempoInvulneravel > 0 && (movimentoReduzido() || Math.floor(this.tempoInvulneravel * 10) % 2 === 0)) {
      ctx.globalAlpha *= 0.35;
    }
    animacao.desenhar(ctx, this.tempoAnimacao, dx, dy, tamanhoSprite, tamanhoSprite, flip);
    ctx.restore();
  }

  desenharVidas(ctx, tempo) {
    desenharVidas(ctx, this.vidas, tempo);
  }
}
