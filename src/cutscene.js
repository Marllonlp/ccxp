// Reprodutor de cutscenes. Lê um roteiro JSON (INSTRUCOES_CUTSCENE_INTRO.md) e desenha tudo em 480 × 270 pixels.
// Cada passo vira uma tarefa e a sequência espera a tarefa terminar. "paralelo" roda junto com o passo principal
// e para quando ele termina.

const LARGURA = 480;
const ALTURA = 270;
const TOPO_BYTE = 167; // y do Byte (48 × 48) com os pés no chão
const GRAVIDADE_PADRAO = 70;
const LETRAS_POR_SEGUNDO = 50;
const COR_TEXTO = '#FFFFFF';
const COR_TEXTO_CHEFE = '#FF96A5';
const COR_NOME = { BYTE: '#FFD646', 'KERNEL PANIC': '#FF6078' };
const COR_AMARELO = '#FFD646';
const COR_CINZA = '#8C92A6';
const COR_SOMBRA = '#0C0E1C';
const COR_CARTELA = '#38E8FF';
const COR_SOMBRA_CARTELA = '#1E4FB8';
const CORES_RASTRO = ['#FF2846', '#E63CC8', '#AA0A28'];
const TEMPO_SAIDA_MS = 300;
const ENTER_PARA_PULAR_MS = 1000;
const TREMOR_PADRAO_MS = 90;

// Arquivos da pasta da cutscene, pelo nome usado no roteiro. Sprites seguem o padrão _Nf_LxA (N quadros de L × A).
const ARQUIVOS = {
  cenario_dia: 'cenario_intro_dia_480x270.png',
  cenario_alerta: 'cenario_intro_alerta_480x270.png',
  byte_sentado_notebook_4f_48x48: 'byte_sentado_notebook_4f_48x48.png',
  byte_sentado_olhando_1f_48x48: 'byte_sentado_olhando_1f_48x48.png',
  notebook_frente_2f_18x15: 'notebook_frente_2f_18x15.png',
  tontura_3f_24x10: 'tontura_3f_24x10.png',
  byte_parado_2f_48x48: 'reutilizados/byte_parado_2f_48x48.png',
  byte_correndo_8f_48x48: 'reutilizados/byte_correndo_8f_48x48.png',
  byte_pulando_2f_48x48: 'reutilizados/byte_pulando_2f_48x48.png',
  byte_caindo_2f_48x48: 'reutilizados/byte_caindo_2f_48x48.png',
  byte_agachado_2f_48x48: 'reutilizados/byte_agachado_2f_48x48.png',
  byte_dano_2f_48x48: 'reutilizados/byte_dano_2f_48x48.png',
  byte_morte_3f_48x48: 'reutilizados/byte_morte_3f_48x48.png',
  chefe_kernel_panic_parado_6f_128x128: 'reutilizados/chefe_kernel_panic_parado_6f_128x128.png',
  chefe_kernel_panic_ataque_6f_128x128: 'reutilizados/chefe_kernel_panic_ataque_6f_128x128.png',
  projetil_pacote_erro_2f_12x12: 'reutilizados/projetil_pacote_erro_2f_12x12.png',
  balao_exclamacao: 'balao_exclamacao_16x16.png',
  balao_interrogacao: 'balao_interrogacao_16x16.png',
  balao_surpresa: 'balao_surpresa_16x16.png',
  balao_reticencias: 'balao_reticencias_16x16.png',
  caixa_byte: 'caixa_dialogo_byte_468x82.png',
  caixa_kernel: 'caixa_dialogo_kernel_468x82.png',
  retrato_byte: 'retrato_byte_44x44.png',
  retrato_kernel: 'retrato_kernel_panic_44x44.png',
};

// Acentos maiúsculos: a Press Start 2P os mostra como minúsculas, então a letra sai sem acento e o acento vem em pixels.
const ACENTOS = {
  Á: ['A', 'agudo'], É: ['E', 'agudo'], Í: ['I', 'agudo'], Ó: ['O', 'agudo'], Ú: ['U', 'agudo'],
  Ã: ['A', 'til'], Õ: ['O', 'til'],
  Â: ['A', 'circunflexo'], Ê: ['E', 'circunflexo'], Ô: ['O', 'circunflexo'],
  Ç: ['C', 'cedilha'],
};
const PIXELS_ACENTO = {
  agudo: [[4, -3], [3, -2]],
  til: [[1, -2], [2, -3], [3, -2], [4, -2], [5, -3]],
  circunflexo: [[2, -2], [3, -3], [4, -2]],
  cedilha: [[3, 7], [4, 8], [3, 9]],
};

/** Carrega a fonte Press Start 2P com o nome usado pelas telas de história e de luta. */
export function carregarFonte(pasta) {
  const fonte = new FontFace('PressStart2PCutscene', `url(${pasta}PressStart2P-Regular.ttf)`);
  return fonte.load()
    .then(() => document.fonts.add(fonte))
    .catch((erro) => console.error('Falha ao carregar a fonte da cutscene:', erro));
}

function carregarImagem(url) {
  return new Promise((ok, falha) => {
    const imagem = new Image();
    imagem.onload = () => ok(imagem);
    imagem.onerror = () => falha(new Error(`Falha ao carregar ${url}`));
    imagem.src = url;
  });
}

/** Carrega as imagens e a fonte da cutscene. Devolve { nome: { img, quadros, largura, altura } }. */
async function carregarRecursos(pasta) {
  const fonteCarregada = carregarFonte(pasta);
  const imagens = Object.entries(ARQUIVOS).map(async ([nome, arquivo]) => {
    const img = await carregarImagem(pasta + arquivo);
    const padrao = /_(\d+)f_(\d+)x(\d+)$/.exec(nome);
    return [nome, {
      img,
      quadros: padrao ? Number(padrao[1]) : 1,
      largura: padrao ? Number(padrao[2]) : img.naturalWidth,
      altura: padrao ? Number(padrao[3]) : img.naturalHeight,
    }];
  });
  const [lista] = await Promise.all([Promise.all(imagens), fonteCarregada]);
  return Object.fromEntries(lista);
}

// --- Atores ----------------------------------------------------------------

function criarAtor(cfg) {
  return {
    x: cfg.x ?? 0,
    y: cfg.y ?? 0,
    visivel: cfg.visivel !== false,
    sprite: cfg.sprite_inicial ?? null,
    frame: 0,
    anim: null,
    preso: cfg.preso_a ?? null,
    offset: cfg.offset ?? [0, 0],
    balao: null,
    balaoOffset: [26, -14],
    efeito: null,
    vx: 0,
    vy: 0,
    gravidade: 0,
  };
}

/** Avança a animação do ator. Sem loop, ela para no último quadro. */
function avancarAnimacao(ator, dt) {
  const a = ator.anim;
  if (!a || a.fim) return;
  a.t += dt * 1000;
  for (;;) {
    const duracao = a.tempos[a.i % a.tempos.length];
    if (a.t < duracao) break;
    a.t -= duracao;
    if (a.i + 1 < a.frames.length) a.i++;
    else if (a.loop) a.i = 0;
    else {
      a.fim = true;
      a.t = 0;
      break;
    }
  }
  ator.frame = a.frames[a.i];
}

/** Física simples: vy cresce com a gravidade e o ator anda em vx, vy. */
function fisica(ator, dt) {
  ator.vy += ator.gravidade * dt;
  ator.x += ator.vx * dt;
  ator.y += ator.vy * dt;
}

// --- Texto -------------------------------------------------------------------

/** Quebra o texto por palavra, sem passar de `maximo` caracteres por linha. */
export function quebrar(texto, maximo) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (teste.length > maximo && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Escreve o texto letra por letra (cada letra ocupa `tamanho` px). `quantas` limita a máquina de escrever. */
export function escrever(ctx, texto, x, y, tamanho, cor, quantas = Infinity) {
  ctx.font = `${tamanho}px PressStart2PCutscene`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = cor;
  const k = tamanho / 8;
  const total = Math.min(texto.length, quantas);
  for (let i = 0; i < total; i++) {
    const letra = texto[i];
    const cx = x + i * tamanho;
    const acento = ACENTOS[letra];
    ctx.fillText(acento ? acento[0] : letra, cx, y);
    if (acento) {
      for (const [dx, dy] of PIXELS_ACENTO[acento[1]]) ctx.fillRect(cx + dx * k, y + dy * k, k, k);
    }
  }
}

/** Texto grande com contorno escuro e sombra azul, como a cartela de título. */
export function escreverCartela(ctx, texto, x, y, tamanho, cor, sombra = COR_SOMBRA_CARTELA) {
  const k = tamanho / 8;
  escrever(ctx, texto, x + 2 * k, y + 2 * k, tamanho, sombra);
  for (const [dx, dy] of [[-k, 0], [k, 0], [0, -k], [0, k], [-k, -k], [k, -k], [-k, k], [k, k]]) {
    escrever(ctx, texto, x + dx, y + dy, tamanho, COR_SOMBRA);
  }
  escrever(ctx, texto, x, y, tamanho, cor);
}

function contarLetras(linhas) {
  return linhas.reduce((soma, linha) => soma + linha.length, 0);
}

// --- Tarefas (um passo do roteiro em execução) ---------------------------------

const instantanea = () => ({ atualizar: () => true });

/** Tarefa que dura `ms`. `aplicar(progresso, tempoDecorrido)` roda a cada quadro; `aoFim` roda ao terminar. */
function temporizador(ms, aplicar, aoFim) {
  let t = 0;
  return {
    atualizar(dt) {
      t += dt * 1000;
      const progresso = ms > 0 ? Math.min(1, t / ms) : 1;
      aplicar?.(progresso, Math.min(t, ms));
      if (progresso >= 1) {
        aoFim?.();
        return true;
      }
      return false;
    },
  };
}

/** Emite partículas de 1 px saindo da base do chefe, indo para a esquerda (rastro de glitch). */
function emitirRastro(cena, ator, dt) {
  cena.acumuloRastro = (cena.acumuloRastro ?? 0) + dt * 120;
  while (cena.acumuloRastro >= 1) {
    cena.acumuloRastro -= 1;
    cena.particulas.push({
      x: ator.x + 44 + Math.random() * 40,
      y: ator.y + 120 + Math.random() * 6,
      vx: -(60 + Math.random() * 100),
      vy: (Math.random() - 0.5) * 30,
      vida: 0.5 + Math.random() * 0.6,
      cor: CORES_RASTRO[Math.floor(Math.random() * CORES_RASTRO.length)],
    });
  }
}

/** Cria a tarefa de um passo do roteiro. `atorPadrao` é o nome do ator quando o passo não informa um. */
function criarTarefa(passo, cena, atorPadrao) {
  const nomeAtor = passo.ator ?? atorPadrao;
  const ator = cena.atores.get(nomeAtor);
  const semAtor = () => {
    console.warn(`Cutscene: ator "${nomeAtor}" não existe (ação ${passo.acao}).`);
    return instantanea();
  };

  switch (passo.acao) {
    case 'fade_in':
      return temporizador(passo.ms ?? 0, (p) => { cena.escurecer = 1 - p; });

    case 'fade_out':
      return temporizador(passo.ms ?? 0, (p) => { cena.escurecer = p; });

    case 'esperar':
      return temporizador(passo.ms ?? 0);

    case 'legenda': {
      const linhas = quebrar(passo.texto, 56);
      const legenda = { linhas, total: contarLetras(linhas), letras: 0, espera: passo.espera_apos_ms ?? 0, esperado: 0 };
      cena.legenda = legenda;
      return {
        atualizar(dt) {
          if (legenda.letras < legenda.total) {
            legenda.letras = Math.min(legenda.total, legenda.letras + dt * LETRAS_POR_SEGUNDO);
            return false;
          }
          legenda.esperado += dt * 1000;
          if (legenda.esperado < legenda.espera) return false;
          cena.legenda = null;
          return true;
        },
      };
    }

    case 'dialogo': {
      const ehByte = passo.quem === 'BYTE';
      const linhas = quebrar(passo.texto, 46);
      const dialogo = {
        quem: passo.quem,
        corNome: COR_NOME[passo.quem] ?? COR_AMARELO,
        corTexto: ehByte ? COR_TEXTO : COR_TEXTO_CHEFE,
        caixa: ehByte ? 'caixa_byte' : 'caixa_kernel',
        retrato: ehByte ? 'retrato_byte' : 'retrato_kernel',
        linhas,
        total: contarLetras(linhas),
        letras: 0,
        avancou: false,
      };
      cena.dialogo = dialogo;
      return {
        atualizar(dt) {
          if (dialogo.avancou) {
            cena.dialogo = null;
            return true;
          }
          if (dialogo.letras < dialogo.total) {
            dialogo.letras = Math.min(dialogo.total, dialogo.letras + dt * LETRAS_POR_SEGUNDO);
          }
          return false;
        },
      };
    }

    case 'sprite': {
      if (!ator) return semAtor();
      ator.sprite = passo.sprite;
      ator.anim = null;
      ator.frame = passo.frame ?? 0;
      if (passo.posicao_final) [ator.x, ator.y] = passo.posicao_final;
      if (passo.cair_ate_chao) {
        ator.vx = passo.vx_px_por_s ?? 0;
        ator.gravidade = ator.gravidade || GRAVIDADE_PADRAO;
        return {
          atualizar(dt) {
            fisica(ator, dt);
            if (ator.y < TOPO_BYTE) return false;
            ator.y = TOPO_BYTE;
            ator.vx = 0;
            ator.vy = 0;
            return true;
          },
        };
      }
      return temporizador(passo.ms ?? 0);
    }

    case 'animar': {
      if (!ator) return semAtor();
      const quadros = passo.frames ?? Array.from({ length: cena.recursos[passo.anim].quadros }, (_, i) => i);
      const tempos = Array.isArray(passo.ms_por_frame) ? passo.ms_por_frame : [passo.ms_por_frame ?? 100];
      ator.anim = { frames: quadros, tempos, loop: passo.loop === true, t: 0, i: 0, fim: false };
      ator.sprite = passo.anim;
      ator.frame = quadros[0];
      return instantanea();
    }

    case 'mostrar':
      if (!ator) return semAtor();
      ator.visivel = true;
      return instantanea();

    case 'esconder':
      if (!ator) return semAtor();
      ator.visivel = false;
      return instantanea();

    case 'mover': {
      if (!ator) return semAtor();
      if (passo.velocidade_px_por_s) {
        const [vx, vy] = passo.velocidade_px_por_s;
        // Contínuo: termina quando sair da tela ou quando o passo principal acabar (no caso de "paralelo").
        return {
          atualizar(dt) {
            ator.x += vx * dt;
            ator.y += vy * dt;
            return passo.ate_sair_da_tela === true && ator.x > LARGURA;
          },
        };
      }
      const inicio = { x: ator.x, y: ator.y };
      const alvo = passo.para
        ? { x: passo.para[0], y: passo.para[1] }
        : { x: ator.x + passo.delta[0], y: ator.y + passo.delta[1] };
      const ms = passo.ms ?? 0;
      let t = 0;
      return {
        atualizar(dt) {
          t += dt * 1000;
          const p = ms > 0 ? Math.min(1, t / ms) : 1;
          const k = passo.suavizar === 'ease_out' ? 1 - (1 - p) * (1 - p) : p;
          ator.x = inicio.x + (alvo.x - inicio.x) * k;
          ator.y = inicio.y + (alvo.y - inicio.y) * k;
          if (passo.rastro_glitch) emitirRastro(cena, ator, dt);
          return p >= 1;
        },
      };
    }

    case 'tingir_cenario': {
      const de = passo.de ?? cena.alerta;
      const para = passo.para ?? cena.alerta;
      const tremor = passo.tremer;
      if (tremor) cena.tremor = { px: tremor.px, intervalo: tremor.intervalo_ms ?? TREMOR_PADRAO_MS };
      return temporizador(
        passo.ms ?? 0,
        (p) => { cena.alerta = de + (para - de) * p; },
        () => { if (tremor) cena.tremor = null; },
      );
    }

    case 'tremer_tela':
      cena.tremor = { px: passo.px ?? 2, intervalo: TREMOR_PADRAO_MS };
      return temporizador(passo.ms ?? 0, null, () => { cena.tremor = null; });

    case 'balao':
      if (!ator) return semAtor();
      ator.balao = passo.tipo ?? null;
      ator.balaoOffset = passo.offset ?? [26, -14];
      return instantanea();

    case 'efeito': {
      if (!ator) return semAtor();
      const efeito = {
        sprite: passo.sprite,
        ox: passo.offset?.[0] ?? 0,
        oy: passo.offset?.[1] ?? 0,
        msPorFrame: passo.ms_por_frame ?? 100,
        t: 0,
      };
      ator.efeito = efeito;
      return temporizador(passo.ms ?? 0, (p, t) => { efeito.t = t; }, () => { ator.efeito = null; });
    }

    case 'cartela_titulo': {
      const cartela = { titulo: passo.titulo, subtitulo: passo.subtitulo ?? '', t: 0 };
      cena.cartela = cartela;
      return temporizador(passo.ms ?? 0, (p, t) => { cartela.t = t; }, () => { cena.cartela = null; });
    }

    case 'projetil': {
      const origem = cena.atores.get(passo.de);
      const alvo = cena.atores.get(passo.alvo);
      if (!origem || !alvo) return semAtor();
      const [ox, oy] = passo.offset ?? [0, 0];
      const atraso = passo.atraso_ms ?? 0;
      let t = 0;
      let projetil = null;
      return {
        atualizar(dt) {
          if (!projetil) {
            t += dt * 1000;
            if (t < atraso) return false;
            projetil = { x: origem.x + ox, y: origem.y + oy, sprite: passo.sprite, t: 0 };
            cena.projeteis.push(projetil);
            return false;
          }
          // Teleguiado: a cada quadro (1/60 s) percorre 35% da distância até o centro do alvo.
          const cx = alvo.x + 24;
          const cy = alvo.y + 24;
          const k = 1 - Math.pow(0.65, dt * 60);
          projetil.x += (cx - (projetil.x + 6)) * k;
          projetil.y += (cy - (projetil.y + 6)) * k;
          if (Math.hypot(cx - (projetil.x + 6), cy - (projetil.y + 6)) >= 10) return false;
          cena.projeteis = cena.projeteis.filter((p) => p !== projetil);
          return true;
        },
      };
    }

    case 'ao_acertar':
      return criarSequencia(passo.sequencia ?? [], cena, nomeAtor);

    case 'pulo_scriptado': {
      if (!ator) return semAtor();
      ator.vy = passo.vy_inicial_px_por_s ?? -94;
      ator.vx = passo.vx_px_por_s ?? 0;
      ator.gravidade = passo.gravidade_px_por_s2 ?? GRAVIDADE_PADRAO;
      ator.anim = null;
      const impulso = passo.impulso_ms ?? 180;
      let t = 0;
      return {
        atualizar(dt) {
          t += dt * 1000;
          fisica(ator, dt);
          if (t < impulso) {
            ator.sprite = 'byte_pulando_2f_48x48';
            ator.frame = 0;
          } else if (ator.vy < 0) {
            ator.sprite = 'byte_pulando_2f_48x48';
            ator.frame = 1;
          } else {
            ator.sprite = 'byte_caindo_2f_48x48';
            ator.frame = 0;
          }
          // Termina no ápice: a queda acontece depois, no ao_acertar.
          return t >= impulso && ator.vy >= 0;
        },
      };
    }

    case 'fim':
      cena.proximo = passo.proximo;
      return instantanea();

    case 'comentario':
      return instantanea();

    default:
      console.warn(`Cutscene: ação desconhecida "${passo.acao}".`);
      return instantanea();
  }
}

/** Um passo principal e, junto dele, os passos de "paralelo". */
function criarPasso(passo, cena, atorPadrao) {
  const tarefa = criarTarefa(passo, cena, atorPadrao);
  const paralelo = (passo.paralelo ?? []).map((p) => criarTarefa(p, cena, passo.ator ?? atorPadrao));
  return { tarefa, paralelo };
}

/** Executa passos em sequência. Devolve uma tarefa que termina quando o último passo termina. */
function criarSequencia(passos, cena, atorPadrao) {
  let i = 0;
  let atual = null;
  return {
    atualizar(dt) {
      let restante = dt;
      for (;;) {
        if (!atual) {
          if (i >= passos.length) return true;
          atual = criarPasso(passos[i++], cena, atorPadrao);
        }
        const fim = atual.tarefa.atualizar(restante);
        atual.paralelo = atual.paralelo.filter((tarefa) => !tarefa.atualizar(restante));
        restante = 0;
        if (!fim) return false;
        atual = null;
      }
    },
  };
}

// --- Cena -------------------------------------------------------------------

function criarCena(roteiro, recursos) {
  const cena = {
    recursos,
    tempo: 0,
    alerta: 0,
    escurecer: 1,
    tremor: null,
    atores: new Map(),
    dialogo: null,
    legenda: null,
    cartela: null,
    particulas: [],
    projeteis: [],
    pulando: false,
    saida: 0,
    proximo: null,
  };
  for (const [nome, cfg] of Object.entries(roteiro.atores ?? {})) cena.atores.set(nome, criarAtor(cfg));
  return cena;
}

function tremorAtual(cena) {
  if (!cena.tremor) return 0;
  const lado = Math.floor(cena.tempo / cena.tremor.intervalo) % 2 === 0 ? 1 : -1;
  return lado * cena.tremor.px;
}

/** Avança animações, efeitos, partículas e projéteis, e segue os atores presos. */
function atualizarMundo(cena, dt) {
  for (const ator of cena.atores.values()) {
    avancarAnimacao(ator, dt);
    if (ator.efeito) ator.efeito.t += dt * 1000;
    if (ator.preso) {
      const pai = cena.atores.get(ator.preso);
      ator.x = pai.x + ator.offset[0];
      ator.y = pai.y + ator.offset[1];
    }
  }
  for (const p of cena.particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt;
  }
  cena.particulas = cena.particulas.filter((p) => p.vida > 0);
  for (const p of cena.projeteis) p.t += dt * 1000;
}

function desenharSprite(ctx, s, frame, x, y) {
  ctx.drawImage(s.img, frame * s.largura, 0, s.largura, s.altura, Math.round(x), Math.round(y), s.largura, s.altura);
}

function desenharAtor(ctx, recursos, ator) {
  if (!ator.visivel || !ator.sprite) return;
  desenharSprite(ctx, recursos[ator.sprite], ator.frame, ator.x, ator.y);
}

/** Efeito preso ao ator (estrelinhas) e balão de emoção. */
function desenharAcessorios(ctx, recursos, ator) {
  if (ator.efeito) {
    const s = recursos[ator.efeito.sprite];
    const quadro = Math.floor(ator.efeito.t / ator.efeito.msPorFrame) % s.quadros;
    desenharSprite(ctx, s, quadro, ator.x + ator.efeito.ox, ator.y + ator.efeito.oy);
  }
  if (ator.balao) {
    const b = recursos[`balao_${ator.balao}`];
    ctx.drawImage(b.img, Math.round(ator.x + ator.balaoOffset[0]), Math.round(ator.y + ator.balaoOffset[1]));
  }
}

function desenharFundo(ctx, recursos, cena, deslocamento) {
  // Cobre a faixa que aparece quando a tela treme.
  const lado = deslocamento > 0 ? -LARGURA : deslocamento < 0 ? LARGURA : null;
  const camadas = [['cenario_dia', 1], ['cenario_alerta', cena.alerta]];
  for (const [nome, opacidade] of camadas) {
    if (opacidade <= 0) continue;
    ctx.globalAlpha = opacidade;
    ctx.drawImage(recursos[nome].img, 0, 0);
    if (lado !== null) ctx.drawImage(recursos[nome].img, lado, 0);
  }
  ctx.globalAlpha = 1;
}

function desenharSeta(ctx) {
  ctx.fillStyle = COR_AMARELO;
  [[455, 9], [456, 7], [457, 5], [458, 3], [459, 1]].forEach(([x, largura], i) => ctx.fillRect(x, 87 + i, largura, 1));
}

function desenharDialogo(ctx, recursos, dialogo, tempo) {
  ctx.drawImage(recursos[dialogo.caixa].img, 8, 24);
  ctx.drawImage(recursos[dialogo.retrato].img, 21, 46);
  escrever(ctx, dialogo.quem, 84, 28, 8, dialogo.corNome);
  let mostrar = Math.floor(dialogo.letras);
  dialogo.linhas.forEach((linha, i) => {
    escrever(ctx, linha, 82, 46 + 13 * i, 8, dialogo.corTexto, Math.max(0, mostrar));
    mostrar -= linha.length;
  });
  if (dialogo.letras >= dialogo.total && Math.floor(tempo / 400) % 2 === 0) desenharSeta(ctx);
}

function desenharLegenda(ctx, legenda) {
  const altura = 13 * legenda.linhas.length + 6;
  ctx.fillStyle = 'rgba(12, 14, 28, 0.85)';
  ctx.fillRect(0, 20, LARGURA, altura);
  let mostrar = Math.floor(legenda.letras);
  legenda.linhas.forEach((linha, i) => {
    escrever(ctx, linha, 12, 26 + 13 * i, 8, COR_TEXTO, Math.max(0, mostrar));
    mostrar -= linha.length;
  });
}

function desenharCartela(ctx, cartela) {
  ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * Math.min(1, cartela.t / 300)})`;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  escreverCartela(ctx, cartela.titulo, (LARGURA - cartela.titulo.length * 24) / 2, 96, 24, COR_CARTELA);
  if (cartela.subtitulo) {
    escreverCartela(ctx, cartela.subtitulo, (LARGURA - cartela.subtitulo.length * 16) / 2, 142, 16, COR_AMARELO);
  }
}

function desenharCena(ctx, recursos, cena) {
  const deslocamento = tremorAtual(cena);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // Mundo: cenário, Kernel Panic, notebook, partículas, projétil e Byte (nesta ordem, do fundo para a frente).
  ctx.save();
  ctx.translate(deslocamento, 0);
  desenharFundo(ctx, recursos, cena, deslocamento);
  const kernel = cena.atores.get('kernel');
  if (kernel) desenharAtor(ctx, recursos, kernel);
  for (const [nome, ator] of cena.atores) {
    if (nome !== 'kernel' && nome !== 'byte') desenharAtor(ctx, recursos, ator);
  }
  for (const p of cena.particulas) {
    ctx.fillStyle = p.cor;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  for (const p of cena.projeteis) {
    const s = recursos[p.sprite];
    desenharSprite(ctx, s, Math.floor(p.t / 80) % s.quadros, p.x, p.y);
  }
  const byte = cena.atores.get('byte');
  if (byte) {
    desenharAtor(ctx, recursos, byte);
    desenharAcessorios(ctx, recursos, byte);
  }
  for (const [nome, ator] of cena.atores) {
    if (nome !== 'byte' && nome !== 'kernel') desenharAcessorios(ctx, recursos, ator);
  }
  ctx.restore();

  // Legenda e diálogo; depois a cartela e o escurecimento.
  if (cena.legenda) desenharLegenda(ctx, cena.legenda);
  if (cena.dialogo) desenharDialogo(ctx, recursos, cena.dialogo, cena.tempo);
  if (cena.cartela) desenharCartela(ctx, cena.cartela);
  if (cena.escurecer > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${cena.escurecer})`;
    ctx.fillRect(0, 0, LARGURA, ALTURA);
  }
  if (Math.floor(cena.tempo / 600) % 2 === 0) escrever(ctx, 'ESC: PULAR', 388, 6, 8, COR_CINZA);
}

/**
 * Cria o reprodutor dentro de `canvas` (480 × 270). `pasta` é onde ficam as imagens e a fonte da cutscene.
 * tocar(urlRoteiro, { aoTerminar }) toca o roteiro; aoTerminar roda ao chegar no fim do roteiro ou ao pular.
 */
export function criarCutscene(canvas, { pasta }) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let recursosCarregados = null;
  let execucao = null;
  let contagemPular = null;

  function avancar() {
    const cena = execucao?.cena;
    if (!cena || cena.pulando) return;
    if (cena.dialogo) {
      const d = cena.dialogo;
      if (d.letras < d.total) d.letras = d.total;
      else d.avancou = true;
    } else if (cena.legenda && cena.legenda.letras < cena.legenda.total) {
      cena.legenda.letras = cena.legenda.total;
    }
  }

  function pular() {
    const cena = execucao?.cena;
    if (!cena || cena.pulando) return;
    cena.pulando = true;
    cena.saida = 0;
    clearTimeout(contagemPular);
  }

  function finalizar() {
    if (!execucao) return;
    const { aoTerminar } = execucao;
    execucao = null;
    clearTimeout(contagemPular);
    window.removeEventListener('keydown', aoTecla);
    window.removeEventListener('keyup', aoSoltar);
    canvas.parentElement.removeEventListener('click', avancar);
    aoTerminar();
  }

  function aoTecla(evento) {
    if (!execucao) return;
    if (evento.key === 'Escape') {
      evento.preventDefault();
      pular();
      return;
    }
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault();
    if (evento.repeat) return;
    // Enter segurado por 1 s também pula; um toque só avança o diálogo.
    if (evento.key === 'Enter') {
      clearTimeout(contagemPular);
      contagemPular = setTimeout(pular, ENTER_PARA_PULAR_MS);
    }
    avancar();
  }

  function aoSoltar(evento) {
    if (evento.key === 'Enter') clearTimeout(contagemPular);
  }

  function quadro(agora) {
    if (!execucao) return;
    const { cena } = execucao;
    const dt = Math.min(0.05, (agora - execucao.ultimo) / 1000);
    execucao.ultimo = agora;
    cena.tempo += dt * 1000;

    if (cena.pulando) {
      cena.saida += dt * 1000;
      cena.escurecer = Math.min(1, cena.saida / TEMPO_SAIDA_MS);
      if (cena.saida >= TEMPO_SAIDA_MS) {
        finalizar();
        return;
      }
    } else if (execucao.raiz.atualizar(dt)) {
      finalizar();
      return;
    }

    atualizarMundo(cena, dt);
    desenharCena(ctx, execucao.recursos, cena);
    requestAnimationFrame(quadro);
  }

  async function tocar(urlRoteiro, { aoTerminar }) {
    if (execucao) return;
    let roteiro;
    try {
      const [recursos, json] = await Promise.all([
        recursosCarregados ?? carregarRecursos(pasta),
        fetch(urlRoteiro).then((resposta) => {
          if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${urlRoteiro}`);
          return resposta.json();
        }),
      ]);
      recursosCarregados = recursos;
      roteiro = json;
      const cena = criarCena(roteiro, recursos);
      execucao = { cena, recursos, raiz: criarSequencia(roteiro.passos ?? [], cena, null), aoTerminar, ultimo: performance.now() };
    } catch (erro) {
      // Sem cutscene, o jogo segue: a tela de partida abre do mesmo jeito.
      console.error('Falha ao carregar a cutscene:', erro);
      aoTerminar();
      return;
    }
    window.addEventListener('keydown', aoTecla);
    window.addEventListener('keyup', aoSoltar);
    canvas.parentElement.addEventListener('click', avancar);
    requestAnimationFrame(quadro);
  }

  return { tocar };
}
