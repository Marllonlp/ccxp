// Responsável: Pedro. Arquivo reservado para estado e movimentação do personagem.
// As posições e dimensões usam os pixels internos do Canvas (960 × 540).
// A atualização será chamada pelo ciclo com ações e deltaTime em segundos.

import { inputState } from './input.js';

export class AnimacaoGIF {
  constructor(caminho) {
    this.caminho = caminho;
    this.img = new Image();
    this.img.src = caminho;
    this.frames = [];
    this.tempoTotal = 0;
    this.carregado = false;

    if (typeof ImageDecoder !== 'undefined' && caminho.endsWith('.gif')) {
      this._decodificar();
    }
  }

  async _decodificar() {
    try {
      const resp = await fetch(this.caminho);
      const buffer = await resp.arrayBuffer();
      const dec = new ImageDecoder({ data: buffer, type: 'image/gif' });
      await dec.tracks.ready;
      const total = dec.tracks.selectedTrack.frameCount;
      const frames = [];
      let tempoTotal = 0;

      for (let i = 0; i < total; i++) {
        const f = await dec.decode({ frameIndex: i });
        const duration = (f.image.duration || 80000) / 1000000;
        const bmp = await createImageBitmap(f.image);
        f.image.close();
        frames.push({ bmp, duration });
        tempoTotal += duration;
      }

      this.frames = frames;
      this.tempoTotal = tempoTotal;
      this.carregado = true;
    } catch {
      this.carregado = false;
    }
  }

  desenhar(ctx, tempo, dx, dy, dw, dh, flip = false) {
    let fonte = this.img;

    if (this.carregado && this.frames.length > 0) {
      if (this.tempoTotal > 0) {
        const tempoCiclo = tempo % this.tempoTotal;
        let acum = 0;
        for (const f of this.frames) {
          acum += f.duration;
          if (tempoCiclo <= acum) {
            fonte = f.bmp;
            break;
          }
        }
      } else {
        fonte = this.frames[0].bmp;
      }
    }

    if (!fonte) return;
    if (fonte instanceof HTMLImageElement && (!fonte.complete || fonte.naturalWidth === 0)) {
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(fonte, 0, 0, dw, dh);
    } else {
      ctx.drawImage(fonte, dx, dy, dw, dh);
    }
    ctx.restore();
  }
}

export const byteSprites = {
  parado: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/02_byte_parado.gif'),
  correndo: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/01_byte_correndo.gif'),
  pulando: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/03_byte_pulando.gif'),
  caindo: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/05_byte_caindo.gif'),
  agachado: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/04_byte_agachado.gif'),
  dano: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/06_byte_dano.gif'),
  morte: new AnimacaoGIF('assets/characters/Imagens_Personagens/01_byte/07_byte_morte.gif'),
};

export const heartSprites = {
  cheia: new AnimacaoGIF('assets/characters/Imagens_Personagens/04_vidas_e_itens/02_vida.png'),
  vazia: new AnimacaoGIF('assets/characters/Imagens_Personagens/04_vidas_e_itens/03_coracao_sem_vida.gif'),
  ultima: new AnimacaoGIF('assets/characters/Imagens_Personagens/04_vidas_e_itens/04_ultima_vida.gif'),
};

export function desenharVidas(ctx, vidas, tempo = performance.now() / 1000) {
  const totalVidas = 3;
  const startX = 24;
  const startY = 20;
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

    this.vidas = 3;
    this.emQuedaLivre = false;

    this.olhandoDireita = true;
    this.estadoAnimacao = 'parado';
    this.tempoAnimacao = 0;
  }

  obterEstado() {
    if (this.vidas <= 0) return 'morte';
    if (this.emQuedaLivre) return 'caindo';
    if (this.agachado) return 'agachado';
    if (!this.noChao) {
      return this.vy < 0 ? 'pulando' : 'caindo';
    }
    if (Math.abs(this.vx) > 0) return 'correndo';
    return 'parado';
  }

  atualizar(deltaTime, verificarEspacoTeto, limiteFaseY, onGameOver) {
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
    this.estadoAnimacao = 'parado';
    this.tempoAnimacao = 0;
  }

  desenhar(ctx) {
    const animacao = byteSprites[this.estadoAnimacao] || byteSprites.parado;
    const larguraSprite = 96;
    const alturaSprite = 96;
    const dx = Math.round(this.x + (this.largura / 2) - (larguraSprite / 2));
    const dy = Math.round(this.y + this.altura - 94);
    const flip = !this.olhandoDireita;

    animacao.desenhar(ctx, this.tempoAnimacao, dx, dy, larguraSprite, alturaSprite, flip);
  }

  desenharVidas(ctx, tempo) {
    desenharVidas(ctx, this.vidas, tempo);
  }
}