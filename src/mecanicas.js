// Mecânicas do pacote obstaculos_mecanicas_pacote, em unidades do mundo da fase.
// Perigos machucam ao toque (tipo "pular" e "abaixar"). Superfícies sólidas são retângulos
// que entram em `obstaculos` (level.js) e são resolvidos pela colisão comum. Cada mecânica
// tem o seu tempo próprio e segue o comportamento descrito em OBSTACULOS_GUIA.md.

const PASTA = './assets/characters/Imagens_Personagens/02_cenario/obstaculos_mecanicas_pacote/';
const CHAO = 480;
const DURACAO_QUADRO = 0.15;
const CICLO_HOLOGRAFICO = [1.5, 0.5, 1.5, 0.5];
const CICLO_ESMAGADOR = [1.0, 0.15, 0.4, 0.4];
const CURSO_ELEVADOR = 60;
const VELOCIDADE_ELEVADOR = 30;
const IMPULSO_TRAMPOLIM = 750;   // 1,5× a força do pulo (500)
const VELOCIDADE_ESTEIRA = 60;
const FORCA_VENTILADOR = 1500;
const VELOCIDADE_MAXIMA_VENTILADOR = 330;
const TEMPO_PORTA_ABERTA = 4;

/** Abre, para sempre, as portas ligadas à missão resolvida (o terminal do totem as abre). */
export function abrirPortasDaMissao(mecanicas, idMissao) {
  for (const mecanica of mecanicas) {
    if (mecanica.tipo === 'porta' && mecanica.spec.missao === idMissao) mecanica.abrirParaSempre();
  }
}

// Tamanho de cada tipo e, para perigos, a caixa que machuca (em relação ao chão):
// `base` é a altura da base do desenho; `hb` e `hh` são a base e a altura da caixa de dano.
const DEFINICOES = {
  fios: { nome: 'Fios', arquivo: 'pular_fios_desencapados_32x14_4f.png', largura: 32, base: 0, perigo: { hx: 0, hw: 32, hb: 4, hh: 7 } },
  poca: { nome: 'Poça elétrica', arquivo: 'pular_poca_eletrica_48x10_4f.png', largura: 48, base: 0, perigo: { hx: 2, hw: 44, hb: 1, hh: 5 } },
  bomba: { nome: 'Bomba lógica', arquivo: 'pular_bomba_logica_20x20_4f.png', largura: 20, base: 0, perigo: { hx: 2, hw: 16, hb: 1, hh: 17 } },
  drone: { nome: 'Drone', arquivo: 'abaixar_drone_patrulha_36x22_4f.png', largura: 36, base: 52, perigo: { hx: 2, hw: 32, hb: 56, hh: 17 } },
  laser: { nome: 'Laser', arquivo: 'abaixar_laser_cabeca_64x56_4f.png', largura: 64, base: 17, perigo: { hx: 8, hw: 48, hb: 56, hh: 5 } },
  cabo: { nome: 'Cabo', arquivo: 'abaixar_cabo_pendurado_24x44_4f.png', largura: 24, base: 55, perigo: { hx: 8, hw: 10, hb: 56, hh: 9 } },
  esmagador: { nome: 'Esmagador', arquivo: 'outros_esmagador_32x80_4f.png', largura: 32, base: 0, perigo: { hx: 2, hw: 28, hb: 0, hh: 12 }, soBatida: true },
  caixa: { nome: 'Caixa', arquivo: 'andar_em_cima_caixa_tech_32x32_4f.png', largura: 32 },
  esteira: { nome: 'Esteira', arquivo: 'andar_em_cima_esteira_64x16_4f.png', largura: 64 },
  quebradica: { nome: 'Plataforma quebradiça', arquivo: 'andar_em_cima_plataforma_quebradica_48x16_4f.png', largura: 48 },
  trampolim: { nome: 'Trampolim', arquivo: 'andar_em_cima_trampolim_24x24_4f.png', largura: 24 },
  holografico: { nome: 'Bloco holográfico', arquivo: 'andar_em_cima_bloco_holografico_32x32_4f.png', largura: 32 },
  elevador: { nome: 'Elevador', arquivo: 'andar_em_cima_elevador_48x20_4f.png', largura: 48 },
  ventilador: { nome: 'Ventilador', arquivo: 'outros_ventilador_32x48_4f.png', largura: 32 },
  porta: { nome: 'Porta', arquivo: 'outros_porta_trancada_24x48_4f.png', largura: 24 },
  botao: { nome: 'Botão', arquivo: 'outros_botao_pressao_20x10_2f.png', largura: 20 },
};

/** Largura de cada tipo, para o construtor de fases montar a sequência. */
export const LARGURAS = Object.fromEntries(Object.entries(DEFINICOES).map(([tipo, def]) => [tipo, def.largura]));

function carregarImagem(arquivo) {
  const imagem = new Image();
  imagem.src = PASTA + arquivo;
  return imagem;
}

function interseca(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/** Verdadeiro se o personagem está em cima do retângulo (pés encostados no topo). */
function emCimaDe(personagem, retangulo) {
  return personagem.noChao
    && Math.abs(personagem.y + personagem.altura - retangulo.y) < 3
    && personagem.x + personagem.largura > retangulo.x
    && personagem.x < retangulo.x + retangulo.width;
}

class Mecanica {
  constructor(spec) {
    this.tipo = spec.tipo;
    this.spec = spec;
    this.def = DEFINICOES[spec.tipo];
    if (!this.def) throw new RangeError(`Mecânica desconhecida: ${spec.tipo}`);
    this.nome = this.def.nome;
    this.x = spec.x + (spec.dx ?? 0);
    this.largura = this.def.largura;
    this.base = spec.base ?? this.def.base ?? 0;
    this.imagem = carregarImagem(this.def.arquivo);
    this.perigoso = Boolean(this.def.perigo);
    this.ancorado = Boolean(spec.ancorado);
    this.ancora = spec.ancora ?? 0;
    this.rects = [];
    this.criarRetangulos();
    this.reiniciar();
  }

  /** Retângulos sólidos desta mecânica, adicionados aos obstáculos da fase. */
  criarRetangulos() {
    const criar = (y, altura, extra = {}) => {
      const retangulo = { x: this.x, y, width: this.largura, height: altura, tipo: 'mecanica', mecanica: this, ativo: true, ...extra };
      this.rects.push(retangulo);
      return retangulo;
    };
    const topoBase = CHAO - this.base;

    switch (this.tipo) {
      case 'caixa': {
        const blocos = this.spec.blocos ?? 1;
        this.blocos = blocos;
        criar(CHAO - 32 * blocos, 32 * blocos);
        break;
      }
      case 'esteira':
        this.sentido = this.spec.dir ?? 1;
        this.retangulo = criar(topoBase - 14, 14);
        break;
      case 'quebradica':
        this.retangulo = criar(topoBase - 13, 13, {
          aoPousar: () => { if (this.pisadaEm === null) this.pisadaEm = this.tempo; },
        });
        break;
      case 'trampolim':
        this.retangulo = criar(topoBase - 18, 18, {
          aoPousar: (personagem) => {
            personagem.vy = -IMPULSO_TRAMPOLIM;
            personagem.noChao = false;
            this.lancadoEm = this.tempo;
          },
        });
        break;
      case 'holografico':
        this.retangulo = criar(topoBase - 32, 32);
        break;
      case 'elevador':
        this.retangulo = criar(topoBase - 16, 16);
        break;
      case 'porta':
        this.retangulo = criar(CHAO - 48, 48);
        break;
      case 'botao':
        this.retangulo = criar(CHAO - 10, 10, {
          aoPousar: () => {
            if (this.porta) this.porta.abertaAte = this.tempo + TEMPO_PORTA_ABERTA;
          },
        });
        break;
      case 'ventilador':
        this.retangulo = criar(CHAO - 8, 8);
        break;
      default:
        break;
    }
  }

  reiniciar() {
    this.tempo = 0;
    this.pisadaEm = null;
    this.lancadoEm = null;
    this.abertaAte = 0;
    this.abertaParaSempre = false;
    this.abertura = 0;
    this.pressionado = false;
    for (const retangulo of this.rects) retangulo.ativo = true;
    if (this.tipo === 'elevador') this.retangulo.y = CHAO - this.base - 16;
    if (this.tipo === 'porta') {
      this.retangulo.ativo = true;
    }
  }

  /** Porta ligada a uma missão: aberta de vez, sem fechar depois do tempo do botão. */
  abrirParaSempre() {
    this.abertaParaSempre = true;
  }

  /** Quadro atual da animação. Quadros com duração própria seguem os ciclos do guia. */
  quadro() {
    const total = Math.max(1, Math.round(this.imagem.naturalWidth / this.largura)) || 4;
    if (this.tipo === 'holografico') {
      return quadroDoCiclo(this.tempo, CICLO_HOLOGRAFICO);
    }
    if (this.tipo === 'esmagador') {
      return quadroDoCiclo(this.tempo, CICLO_ESMAGADOR);
    }
    if (this.tipo === 'quebradica') {
      return this.pisadaEm === null ? 0 : Math.min(3, Math.floor((this.tempo - this.pisadaEm) / 0.2));
    }
    if (this.tipo === 'trampolim') {
      return this.lancadoEm !== null && this.tempo - this.lancadoEm < 0.4
        ? Math.min(3, Math.floor((this.tempo - this.lancadoEm) / 0.1))
        : 0;
    }
    if (this.tipo === 'porta') {
      return Math.floor(this.abertura);
    }
    if (this.tipo === 'botao') {
      return this.pressionado ? 1 : 0;
    }
    return Math.floor(this.tempo / DURACAO_QUADRO) % total;
  }

  /** Caixa que machuca neste instante, ou null. */
  caixaDePerigo() {
    if (!this.perigoso) return null;
    // O esmagador só machuca na batida (quadro 2 do ciclo).
    if (this.def.soBatida && this.quadro() !== 2) return null;
    const { hx, hw, hb, hh } = this.def.perigo;
    return { x: this.x + hx, y: CHAO - hb - hh, width: hw, height: hh };
  }

  /** Verdadeiro se o personagem encosta numa parte que machuca. */
  toca(personagem) {
    const caixa = this.caixaDePerigo();
    if (!caixa) return false;
    return interseca(personagem.x, personagem.y, personagem.largura, personagem.altura,
      caixa.x, caixa.y, caixa.width, caixa.height);
  }

  atualizar(dt, personagem) {
    this.tempo += dt;
    const retangulo = this.retangulo;

    switch (this.tipo) {
      case 'quebradica':
        if (this.pisadaEm !== null) {
          const tempoDesde = this.tempo - this.pisadaEm;
          retangulo.ativo = tempoDesde < 0.6;
          // Volta ao quadro inicial depois de 3 s, como no guia.
          if (tempoDesde >= 3.6) {
            this.pisadaEm = null;
            retangulo.ativo = true;
          }
        }
        break;
      case 'holografico':
        retangulo.ativo = this.quadro() !== 2;
        break;
      case 'esteira':
        if (emCimaDe(personagem, retangulo)) personagem.x += this.sentido * VELOCIDADE_ESTEIRA * dt;
        break;
      case 'elevador': {
        // Sobe e desce o curso inteiro em ciclos de 2 × (curso / velocidade) segundos.
        const periodo = (2 * CURSO_ELEVADOR) / VELOCIDADE_ELEVADOR;
        const deslocamento = (CURSO_ELEVADOR / 2) * (1 - Math.cos((2 * Math.PI * this.tempo) / periodo));
        const novoY = CHAO - this.base - 16 - deslocamento;
        const delta = novoY - retangulo.y;
        if (delta !== 0 && emCimaDe(personagem, retangulo)) personagem.y += delta;
        retangulo.y = novoY;
        break;
      }
      case 'porta': {
        const ocupada = !retangulo.ativo && interseca(
          personagem.x, personagem.y, personagem.largura, personagem.altura,
          retangulo.x, retangulo.y, retangulo.width, retangulo.height,
        );
        const aberta = this.abertaParaSempre || this.tempo < this.abertaAte || ocupada;
        this.abertura = Math.max(0, Math.min(3, this.abertura + (aberta ? 1 : -1) * dt * 10));
        retangulo.ativo = this.abertura < 3;
        break;
      }
      case 'botao':
        this.pressionado = emCimaDe(personagem, retangulo);
        break;
      case 'ventilador': {
        // Zona de vento: 120 px acima da base; o personagem sobe em vez de cair.
        const zona = { x: this.x + 2, y: CHAO - 8 - 120, width: 28, height: 120 };
        if (interseca(personagem.x, personagem.y, personagem.largura, personagem.altura,
          zona.x, zona.y, zona.width, zona.height)) {
          personagem.vy = Math.max(personagem.vy - FORCA_VENTILADOR * dt, -VELOCIDADE_MAXIMA_VENTILADOR);
        }
        break;
      }
      default:
        break;
    }
  }

  /** Desenha a mecânica. Chamado com a câmera do mundo já aplicada. */
  desenhar(ctx) {
    if (!this.imagem.complete || this.imagem.naturalWidth === 0) {
      // Uma superfície sólida continua visível mesmo se o PNG falhar.
      ctx.save();
      ctx.fillStyle = '#59728c';
      ctx.strokeStyle = '#83e9f5';
      for (const r of this.rects) {
        if (r.ativo === false) continue;
        ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width - 1, r.height - 1);
      }
      const perigo = this.caixaDePerigo();
      if (perigo) {
        ctx.fillStyle = '#ff606e';
        ctx.fillRect(perigo.x, perigo.y, perigo.width, perigo.height);
      }
      ctx.restore();
      return;
    }
    const quadro = this.quadro();
    const alturaSprite = this.imagem.naturalHeight;
    const origemX = quadro * this.largura;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.ancorado) {
      // Pistão preso embaixo da plataforma: o corpo vai da base da plataforma até o chão,
      // e a cabeça bate no chão (o sprite é esticado para caber no vão).
      ctx.drawImage(this.imagem, origemX, 0, this.largura, alturaSprite,
        this.x, this.ancora, this.largura, CHAO - this.ancora);
    } else if (this.tipo === 'caixa') {
      for (let k = 0; k < this.blocos; k++) {
        ctx.drawImage(this.imagem, origemX, 0, this.largura, alturaSprite,
          this.x, CHAO - 32 * (k + 1), this.largura, 32);
      }
    } else if (this.tipo === 'quebradica' && this.pisadaEm !== null && this.tempo - this.pisadaEm >= 0.6) {
      // Quebrada: some até voltar.
    } else if (this.tipo === 'elevador') {
      // A base do elevador acompanha o retângulo de colisão, que sobe e desce.
      ctx.drawImage(this.imagem, origemX, 0, this.largura, alturaSprite,
        this.x, this.retangulo.y + 16 - alturaSprite, this.largura, alturaSprite);
    } else {
      ctx.drawImage(this.imagem, origemX, 0, this.largura, alturaSprite,
        this.x, CHAO - this.base - alturaSprite, this.largura, alturaSprite);
    }

    ctx.restore();
  }
}

/** Quadro dentro de um ciclo com durações diferentes por quadro. */
function quadroDoCiclo(tempo, duracoes) {
  const total = duracoes.reduce((soma, d) => soma + d, 0);
  let t = tempo % total;
  for (let i = 0; i < duracoes.length; i++) {
    if (t < duracoes[i]) return i;
    t -= duracoes[i];
  }
  return 0;
}

/** Cria uma mecânica a partir do registro da fase. */
export function criarMecanica(spec) {
  return new Mecanica(spec);
}

/** Liga mecânicas que dependem de outras, como o botão que abre a porta do mesmo id. */
export function ligarMecanicas(mecanicas) {
  const portas = new Map();
  for (const mecanica of mecanicas) {
    if (mecanica.tipo === 'porta' && mecanica.spec.id) portas.set(mecanica.spec.id, mecanica);
  }
  for (const mecanica of mecanicas) {
    if (mecanica.tipo === 'botao' && mecanica.spec.alvo) mecanica.porta = portas.get(mecanica.spec.alvo) ?? null;
  }
}
