// Arena da luta contra o Kernel Panic (INSTRUCOES_CHEFE_KERNEL_PANIC.md).
// Desenhada em 480 × 270 com a câmera travada. Os números vêm de chefe_config.json.
// A física do Byte (velocidade, gravidade e salto) não está no guia: os valores abaixo foram escolhidos
// para o salto alcançar as duas plataformas.
import { inputState, limparAcoes } from './input.js';
import { desenharVidas } from './player.js';
import { carregarFonte, escrever, escreverCartela, quebrar } from './cutscene.js';
import { pontoNoCanvas } from './viewport.js';

const LARGURA = 480;
const ALTURA = 270;
const CHAO = 213;
const ALTURA_BYTE = 46;
const ALTURA_BYTE_AGACHADO = 30;
const LARGURA_BYTE = 48;
const VEL_BYTE = 150;
const GRAVIDADE = 1100;
const SALTO = 450;
const GRAVIDADE_NOTEBOOK = 600;
const INVULNERAVEL_MS = 1000;
const DANO_BYTE_MS = 400;
const APRESENTACAO_MS = 1500;
const MENSAGEM_PATCH_MS = 1000;
const DANO_CHEFE_MS = 400;
const DERROTA_MS = 1000;
const BALAO_MS = 500;
const VITORIA_MS = 1800;
const MORTE_BYTE_MS = 1000;
const PACOTE_CHAO_Y = CHAO - 12;
const TOTEM_TROCA_MS = 300;

// Arquivos da pasta da luta, pelo nome usado no código. Sprites com N quadros lado a lado: "_Nf".
const ARQUIVOS = {
  arena: 'arena_chefe_fundo_480x270.png',
  faixa: 'faixa_chefe_final_480x57.png',
  hud_vazia: 'hud_barra_chefe_vazia_208x26.png',
  hud_cheia: 'hud_barra_chefe_cheia_208x26.png',
  chefe_parado_6f: 'chefe_com_notebook_parado_6f_128x128.png',
  chefe_ataque_6f: 'chefe_com_notebook_ataque_6f_128x128.png',
  chefe_vulneravel_4f: 'chefe_com_notebook_vulneravel_4f_128x128.png',
  chefe_dano_2f: 'chefe_com_notebook_dano_2f_128x128.png',
  chefe_derrota_6f: 'chefe_kernel_panic_derrota_6f_128x128.png',
  pacote_2f: 'projetil_pacote_erro_2f_12x12.png',
  laser_aviso_2f: 'laser_aviso_2f_16x4.png',
  laser_feixe_2f: 'laser_feixe_2f_16x10.png',
  laser_ponta_2f: 'laser_ponta_2f_12x14.png',
  bugzinho_andando_4f: 'bugzinho_andando_4f_18x14.png',
  bugzinho_morte_2f: 'bugzinho_morte_2f_18x14.png',
  notebook_2f: 'notebook_frente_2f_18x15.png',
  plataforma_2f: 'reutilizados/plataforma_metal_64x24_2f.png',
  totem_4f: 'reutilizados/totem_terminal_ativo_32x64_4f.png',
  botao_terminal: 'botao_abrir_terminal_normal_150x28.png',
  byte_parado_2f: 'reutilizados/byte_parado_2f_48x48.png',
  byte_correndo_8f: 'reutilizados/byte_correndo_8f_48x48.png',
  byte_pulando_2f: 'reutilizados/byte_pulando_2f_48x48.png',
  byte_caindo_2f: 'reutilizados/byte_caindo_2f_48x48.png',
  byte_agachado_2f: 'reutilizados/byte_agachado_2f_48x48.png',
  byte_dano_2f: 'reutilizados/byte_dano_2f_48x48.png',
  byte_morte_3f: 'reutilizados/byte_morte_3f_48x48.png',
  balao_exclamacao: 'reutilizados/balao_exclamacao_16x16.png',
  caixa_byte: 'reutilizados/caixa_dialogo_byte_468x82.png',
  retrato_byte: 'reutilizados/retrato_byte_44x44.png',
};

function carregarImagem(url) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error(`Falha ao carregar ${url}`));
    img.src = url;
  });
}

/** Carrega imagens, fonte, configuração e missões da luta. */
async function carregarRecursos(pasta) {
  const imagens = Object.entries(ARQUIVOS).map(async ([nome, arquivo]) => {
    const img = await carregarImagem(pasta + arquivo);
    const padrao = /_(\d+)f(?:_|$)/.exec(arquivo);
    const quadros = padrao ? Number(padrao[1]) : 1;
    return [nome, { img, quadros, largura: img.naturalWidth / quadros, altura: img.naturalHeight }];
  });
  const [lista, config, missoes] = await Promise.all([
    Promise.all(imagens),
    fetch(pasta + 'chefe_config.json').then((resposta) => resposta.json()),
    fetch(pasta + 'missoes_chefe.json').then((resposta) => resposta.json()),
    carregarFonte(pasta),
  ]);
  return { sprites: Object.fromEntries(lista), config, missoes: missoes.missoes };
}

/** "parado:1500" -> ["parado", 1500]; "laser_baixo" -> ["laser_baixo", null]. */
function lerPasso(texto) {
  const [nome, valor] = texto.split(':');
  return [nome, valor === undefined ? null : Number(valor)];
}

function sobrepoe(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Quadro de uma animação: com loop repete; sem loop, para no último quadro. */
function quadroDe(tempo, msPorFrame, quadros, loop) {
  const i = Math.floor(tempo / msPorFrame);
  return loop ? i % quadros : Math.min(i, quadros - 1);
}

/**
 * Cria a arena. `opcoes`:
 * - pasta: pasta da luta (assets/chefe/);
 * - terminal e telaTerminal: o mesmo terminal do projeto e a seção que o mostra;
 * - onVitoria(): o chefe foi derrotado e a recuperação terminou;
 * - onSair(): o jogador desistiu depois de perder todas as vidas.
 * Devolve { iniciar(), parar() }.
 */
export function criarChefe(canvas, { pasta, terminal, telaTerminal, onVitoria, onSair, onAtualizarInterface = () => {} }) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let recursos = null;
  let rodando = false;
  let ultimoQuadro = 0;
  let retornosAnteriores = null;
  let s = null;
  let dialogo = null;
  let puloAnterior = false;
  let pausado = false;
  let controlesAnteriores = false;
  let inicializacao = 0;
  const menuFim = canvas.parentElement.querySelector('#chefe-fim');
  const botaoTentar = menuFim.querySelector('#chefe-tentar');

  function podeControlar() {
    return rodando && !pausado && !dialogo && !s.terminalAberto && s.byte.vidas > 0 && s.estado !== 'fim';
  }

  function atualizarInterfaceChefe() {
    const mostrarFim = rodando && s.estado === 'fim';
    const mudouFim = menuFim.hidden === mostrarFim;
    const controles = podeControlar();
    menuFim.hidden = !mostrarFim;
    if (mudouFim && mostrarFim) {
      limparAcoes();
      botaoTentar.focus({ preventScroll: true });
    }
    if (mudouFim || controles !== controlesAnteriores) {
      controlesAnteriores = controles;
      onAtualizarInterface();
    }
  }

  function reiniciar() {
    novaPartida();
    pausado = false;
    ultimoQuadro = performance.now();
    atualizarInterfaceChefe();
  }

  function sair() {
    parar();
    onSair();
  }

  botaoTentar.addEventListener('click', reiniciar);
  menuFim.querySelector('#chefe-sair').addEventListener('click', sair);

  // --- Acesso aos dados -----------------------------------------------------

  const cfg = () => recursos.config;
  const chefeX = () => cfg().chefe.posicao_base[0];
  const chefeYBase = () => cfg().chefe.posicao_base[1];
  const chefeY = () => {
    const f = cfg().chefe.flutuar;
    return chefeYBase() + s.chefeDescY + f.amplitude_px * Math.sin((2 * Math.PI * s.total) / f.periodo_ms);
  };

  function quadroSprite(nome, tempo, msPorFrame, loop) {
    return quadroDe(tempo, msPorFrame, recursos.sprites[nome].quadros, loop);
  }

  function desenharSprite(nome, quadro, x, y) {
    const sp = recursos.sprites[nome];
    ctx.drawImage(sp.img, quadro * sp.largura, 0, sp.largura, sp.altura, Math.round(x), Math.round(y), sp.largura, sp.altura);
  }

  // --- Partida ----------------------------------------------------------------

  function novaPartida() {
    s = {
      estado: 'apresentacao',
      t: 0,
      total: 0,
      fase: 0,
      passos: [],
      passo: 0,
      arg: null,
      faseLaser: null,
      vida: cfg().fases[0].vida_do_chefe,
      chefeDescY: 0,
      opacidade: 1,
      pacotes: [],
      pacotesLiberados: 0,
      gotas: [],
      gotasLiberadas: 0,
      bugs: [],
      bugsNascidos: 0,
      laser: null,
      mensagem: null,
      notebook: null,
      terminalAberto: false,
      venceu: false,
      totem: 0,
      totemTrocaT: -Infinity,
      bugsVulneravel: 0,
      trocasTotem: 0,
      byte: {
        x: cfg().arena.byte_inicio[0],
        pes: CHAO,
        vy: 0,
        noChao: true,
        agachado: false,
        andando: false,
        facing: 1,
        vidas: 3,
        invulneravelAte: 0,
        danoAte: 0,
        morto: false,
        morteT: 0,
      },
    };
    dialogo = null;
    puloAnterior = false;
    terminal.esquecerMissoes();
    limparAcoes();
  }

  function iniciarFase() {
    s.passos = cfg().fases[s.fase].sequencia.map(lerPasso);
    s.passo = 0;
    proximoPasso();
  }

  /** Vai para o próximo passo da fase. Ao chegar ao fim da lista, a fase recomeça (ex.: tempo esgotado). */
  function proximoPasso() {
    if (s.passo >= s.passos.length) s.passo = 0;
    const [nome, valor] = s.passos[s.passo++];
    if (nome === 'parado') entrar('parado', valor);
    else if (nome === 'pacotes') entrar('pacotes', valor);
    else if (nome === 'laser_baixo') entrar('laser', 'baixo');
    else if (nome === 'laser_alto') entrar('laser', 'alto');
    else if (nome === 'bugzinhos') entrar('bugzinhos', valor);
    else if (nome === 'chuva') entrar('chuva', valor);
    else if (nome === 'vulneravel') entrar('vulneravel', null);
    else throw new Error(`Passo de luta desconhecido: ${nome}`);
  }

  function entrar(estado, arg) {
    s.estado = estado;
    s.t = 0;
    s.arg = arg;
    if (estado === 'laser') {
      s.laser = { centro: cfg().ataques.laser[arg].feixe_centro_y };
    }
    if (estado === 'vulneravel') {
      // O totem não fica num lugar só: a cada janela ele aparece em outro canto da arena.
      moverTotem();
      s.bugsVulneravel = 0;
      s.trocasTotem = 0;
    }
    if (estado === 'dano') s.vida = Math.max(0, s.vida - 1);
    if (estado === 'derrota') {
      // O chefe cai solto e o notebook sai do colo dele.
      s.pacotes = [];
      s.gotas = [];
      s.bugs = [];
      s.laser = null;
      s.chefeDescY = 0;
      s.notebook = { x: chefeX() + cfg().chefe.notebook_offset[0], y: chefeY() + cfg().chefe.notebook_offset[1], vx: -30, vy: 0, estado: 'caindo' };
    }
  }

  // --- Atualização ----------------------------------------------------------

  function atualizar(dt) {
    s.total += dt * 1000;
    if (s.estado === 'apresentacao') {
      s.t += dt * 1000;
      if (s.t >= APRESENTACAO_MS) {
        s.fase = 0;
        iniciarFase();
      }
      return;
    }
    if (s.terminalAberto || s.estado === 'fim') return;
    atualizarByte(dt);
    atualizarChefe(dt);
    atualizarAtaques(dt);
    verificarDanos();
  }

  function atualizarChefe(dt) {
    const t = (s.t += dt * 1000);
    const { ataques, chefe } = cfg();
    switch (s.estado) {
      case 'parado':
        if (t >= s.arg) proximoPasso();
        break;
      case 'pacotes': {
        const n = s.arg;
        const intervalo = ataques.pacotes.intervalo_ms;
        // Solta a partir do frame 3 do ataque (300 ms), um pacote a cada intervalo.
        if (s.pacotesLiberados < n && t >= 300 + s.pacotesLiberados * intervalo) {
          s.pacotes.push({ x: chefeX() + chefe.boca_offset[0], y: chefeY() + chefe.boca_offset[1], t: 0 });
          s.pacotesLiberados += 1;
        }
        if (s.pacotesLiberados >= n && t >= Math.max(600, 300 + (n - 1) * intervalo)) {
          s.pacotesLiberados = 0;
          proximoPasso();
        }
        break;
      }
      case 'laser': {
        const laser = ataques.laser[s.arg];
        const desce = 400;
        const sobe = 400;
        const aviso = ataques.laser.aviso_ms;
        const feixe = ataques.laser.feixe_ms;
        const alvo = laser.chefe_desce_para_y - chefeYBase();
        if (t < desce) {
          const k = t / desce;
          s.chefeDescY = alvo * (1 - (1 - k) * (1 - k));
          s.faseLaser = 'descer';
        } else if (t < desce + aviso) {
          s.chefeDescY = alvo;
          s.faseLaser = 'aviso';
        } else if (t < desce + aviso + feixe) {
          s.chefeDescY = alvo;
          s.faseLaser = 'feixe';
        } else if (t < desce + aviso + feixe + sobe) {
          const k = (t - desce - aviso - feixe) / sobe;
          s.chefeDescY = alvo * (1 - k);
          s.faseLaser = 'subir';
          s.laser = null;
        } else {
          s.chefeDescY = 0;
          s.faseLaser = null;
          proximoPasso();
        }
        break;
      }
      case 'bugzinhos': {
        const n = s.arg;
        const intervalo = ataques.bugzinhos.intervalo_ms;
        if (s.bugsNascidos < n && t >= s.bugsNascidos * intervalo) {
          s.bugs.push({ x: ataques.bugzinhos.nasce_em_x, y: ataques.bugzinhos.y, morto: false, t: 0 });
          s.bugsNascidos += 1;
        }
        if (s.bugsNascidos >= n) {
          s.bugsNascidos = 0;
          proximoPasso();
        }
        break;
      }
      case 'chuva': {
        // Pacotes caem do teto: primeiro o aviso no chão, depois a queda. Metade mira no Byte.
        const n = s.arg;
        const chuva = ataques.chuva;
        if (s.gotasLiberadas < n && t >= s.gotasLiberadas * chuva.intervalo_ms) {
          const mira = s.gotasLiberadas % 2 === 0;
          const x = mira ? s.byte.x + LARGURA_BYTE / 2 - 6 : 10 + Math.random() * (LARGURA - 32);
          s.gotas.push({ x: Math.max(0, Math.min(LARGURA - 12, x)), y: chuva.nasce_em_y, vy: 0, t: 0 });
          s.gotasLiberadas += 1;
        }
        if (s.gotasLiberadas >= n && s.gotas.length === 0) {
          s.gotasLiberadas = 0;
          proximoPasso();
        }
        break;
      }
      case 'vulneravel': {
        // O tempo só corre fora do terminal (atualizar() não chega aqui com o terminal aberto).
        const extra = cfg().fases[s.fase].vulneravel ?? {};
        // Bugzinhos continuam vindo enquanto o Byte corre até o totem.
        if (extra.bugzinhos_a_cada_ms > 0 && t >= (s.bugsVulneravel + 1) * extra.bugzinhos_a_cada_ms) {
          s.bugs.push({ x: ataques.bugzinhos.nasce_em_x, y: ataques.bugzinhos.y, morto: false, t: 0 });
          s.bugsVulneravel += 1;
        }
        // Na última fase o totem ainda pula de lugar no meio da janela.
        if (extra.totem_troca_a_cada_ms > 0 && t >= (s.trocasTotem + 1) * extra.totem_troca_a_cada_ms) {
          moverTotem();
          s.trocasTotem += 1;
        }
        if (t >= cfg().vulneravel.duracao_ms) {
          // Tempo esgotado: o chefe volta a PARADO e repete a fase.
          s.passo = 0;
          proximoPasso();
        }
        break;
      }
      case 'mensagem':
        if (t >= MENSAGEM_PATCH_MS) entrar('dano', null);
        break;
      case 'dano':
        if (t >= DANO_CHEFE_MS) {
          if (s.vida <= 0) {
            entrar('derrota', null);
          } else {
            s.fase += 1;
            iniciarFase();
          }
        }
        break;
      case 'derrota':
        s.opacidade = Math.max(0, 1 - t / DERROTA_MS);
        if (t >= DERROTA_MS) entrar('recuperar', null);
        atualizarNotebook(dt);
        break;
      case 'recuperar':
        atualizarNotebook(dt);
        break;
      case 'pegando':
        atualizarNotebook(dt);
        if (t >= BALAO_MS) {
          s.notebook = null;
          abrirDialogo('BYTE', 'Meu notebook! Recuperei!', () => entrar('vitoria', null));
        }
        break;
      case 'vitoria':
        if (t >= VITORIA_MS && !s.venceu) {
          s.venceu = true;
          onVitoria();
        }
        break;
      case 'morte':
        if (t >= MORTE_BYTE_MS) s.estado = 'fim';
        break;
      default:
        break;
    }
  }

  function atualizarNotebook(dt) {
    const nb = s.notebook;
    if (!nb) return;
    if (nb.estado === 'caindo') {
      nb.vy += GRAVIDADE_NOTEBOOK * dt;
      nb.y += nb.vy * dt;
      nb.x += nb.vx * dt;
      if (nb.y >= 198) {
        nb.y = 198;
        nb.vy = 0;
        nb.vx = 0;
        nb.estado = 'no_chao';
      }
    }
    // Encostar no notebook depois que ele caiu: balão '!' e o notebook é recuperado.
    if (s.estado === 'recuperar' && nb.estado === 'no_chao' && sobrepoe(corpoByte(), { x: nb.x, y: nb.y, w: 18, h: 15 })) {
      entrar('pegando', null);
    }
  }

  function atualizarAtaques(dt) {
    const { ataques } = cfg();
    for (const p of s.pacotes) {
      p.t += dt * 1000;
      p.x += ataques.pacotes.vx * dt;
      // Desce em direção ao chão: 15% da distância restante a cada 80 ms.
      p.y += (PACOTE_CHAO_Y - p.y) * (1 - Math.pow(0.85, dt / 0.08));
    }
    s.pacotes = s.pacotes.filter((p) => p.x > -12);
    for (const g of s.gotas) {
      g.t += dt * 1000;
      if (g.t < ataques.chuva.aviso_ms) continue;
      g.vy += ataques.chuva.gravidade * dt;
      g.y += g.vy * dt;
    }
    s.gotas = s.gotas.filter((g) => g.y < PACOTE_CHAO_Y);
    for (const bug of s.bugs) {
      bug.t += dt * 1000;
      if (!bug.morto) bug.x += ataques.bugzinhos.vx * dt;
    }
    s.bugs = s.bugs.filter((bug) => (bug.morto ? bug.t < 300 : bug.x > -18));
  }

  /** Byte: caminha, pula, agacha e pousa nas plataformas (de cima para baixo, uma só face). */
  function atualizarByte(dt) {
    const b = s.byte;
    if (b.morto || s.estado === 'dialogo' || s.estado === 'vitoria') return;
    const plataformas = cfg().arena.plataformas;

    b.agachado = inputState.agachamento && b.noChao;
    const direcao = (inputState.direita ? 1 : 0) - (inputState.esquerda ? 1 : 0);
    const movendo = b.agachado ? 0 : direcao;
    b.andando = movendo !== 0 && b.noChao;
    if (movendo !== 0) b.facing = movendo;
    b.x = Math.max(0, Math.min(LARGURA - LARGURA_BYTE, b.x + movendo * VEL_BYTE * dt));

    // Pulo só na borda do toque (segurar não pula de novo).
    if (inputState.pulo && !puloAnterior && b.noChao && !b.agachado) {
      b.vy = -SALTO;
      b.noChao = false;
    }
    puloAnterior = inputState.pulo;

    const pesAntes = b.pes;
    b.vy += GRAVIDADE * dt;
    b.pes += b.vy * dt;
    b.noChao = false;
    if (b.vy >= 0) {
      const superficies = [{ y: CHAO, x0: 0, x1: LARGURA }, ...plataformas.map((p) => ({ y: p.superficie_y, x0: p.x, x1: p.x + 64 }))];
      let pousa = null;
      for (const sf of superficies) {
        const sobreX = b.x + 12 < sf.x1 && b.x + 36 > sf.x0;
        const cruzou = pesAntes <= sf.y + 1 && b.pes >= sf.y;
        if (sobreX && cruzou && (pousa === null || sf.y < pousa)) pousa = sf.y;
      }
      if (pousa !== null) {
        b.pes = pousa;
        b.vy = 0;
        b.noChao = true;
      }
    }
  }

  function corpoByte() {
    const b = s.byte;
    const altura = b.agachado ? ALTURA_BYTE_AGACHADO : ALTURA_BYTE;
    return { x: b.x + 8, y: b.pes - altura, w: 32, h: altura };
  }

  /** Contatos que machucam o Byte. Os bugzinhos pisados morrem e o Byte quica. */
  function verificarDanos() {
    const { chefe } = cfg();
    const corpo = corpoByte();
    const b = s.byte;
    const machuca = !['derrota', 'recuperar', 'pegando', 'dialogo', 'vitoria', 'morte'].includes(s.estado);

    for (const bug of s.bugs) {
      if (bug.morto) continue;
      const caixa = { x: bug.x, y: bug.y, w: 18, h: 14 };
      if (!sobrepoe(corpo, caixa)) continue;
      // Caindo em cima do bugzinho: ele morre e o Byte quica.
      if (b.vy > 0 && b.pes - b.vy / 60 <= bug.y + 4) {
        bug.morto = true;
        bug.t = 0;
        b.vy = -320;
        b.pes = bug.y;
        b.noChao = false;
      } else if (machuca) {
        sofrerDano();
      }
    }
    if (!machuca) return;

    if (s.faseLaser === 'feixe' && s.laser) {
      const fim = chefeX() + chefe.pinca_laser_offset[0];
      if (sobrepoe(corpo, { x: 0, y: s.laser.centro - 4, w: fim, h: 8 })) sofrerDano();
    }
    for (const p of s.pacotes) {
      if (sobrepoe(corpo, { x: p.x, y: p.y, w: 12, h: 12 })) {
        s.pacotes = s.pacotes.filter((q) => q !== p);
        sofrerDano();
        break;
      }
    }
    for (const g of s.gotas) {
      if (g.y > 0 && sobrepoe(corpo, { x: g.x, y: g.y, w: 12, h: 12 })) {
        s.gotas = s.gotas.filter((q) => q !== g);
        sofrerDano();
        break;
      }
    }
    const [dx, dy, dw, dh] = chefe.hitbox_corpo_contato;
    if (sobrepoe(corpo, { x: chefeX() + dx, y: chefeY() + dy, w: dw, h: dh })) sofrerDano();
  }

  function sofrerDano() {
    const b = s.byte;
    if (b.morto || b.invulneravelAte > s.total) return;
    b.vidas -= 1;
    b.danoAte = s.total + DANO_BYTE_MS;
    b.invulneravelAte = s.total + INVULNERAVEL_MS;
    if (b.vidas <= 0) {
      b.morto = true;
      b.morteT = s.total;
      s.estado = 'morte';
      s.t = 0;
      s.laser = null;
      s.pacotes = [];
      s.gotas = [];
      s.bugs = [];
    }
  }

  // --- Terminal e patches --------------------------------------------------

  /** Posição atual do totem. A primeira da lista é a do guia (chão, à esquerda). */
  function posicaoTotem() {
    const totem = cfg().arena.totem;
    return totem.posicoes?.[s.totem] ?? totem;
  }

  /** Leva o totem para outra posição: nunca a atual nem a mais perto do Byte. */
  function moverTotem() {
    const posicoes = cfg().arena.totem.posicoes;
    if (!posicoes || posicoes.length < 3) return;
    const centroByte = s.byte.x + LARGURA_BYTE / 2;
    const distancia = (i) => Math.abs(posicoes[i].x + 16 - centroByte);
    const outras = posicoes.map((_, i) => i).filter((i) => i !== s.totem);
    const maisPerto = outras.reduce((a, b) => (distancia(b) < distancia(a) ? b : a));
    const opcoes = outras.filter((i) => i !== maisPerto);
    s.totem = opcoes[Math.floor(Math.random() * opcoes.length)];
    s.totemTrocaT = s.total;
  }

  function dentroDoTotem() {
    // A área de interação do guia é relativa à posição original do totem: ela acompanha o totem.
    const totem = cfg().arena.totem;
    const { x, y } = posicaoTotem();
    const [x0, y0, x1, y1] = totem.area_interacao;
    const dx = x - totem.x;
    const dy = y - totem.y;
    return sobrepoe(corpoByte(), { x: x0 + dx, y: y0 + dy, w: x1 - x0, h: y1 - y0 });
  }

  function podeAbrirTerminal() {
    return s.estado === 'vulneravel' && !s.terminalAberto && dentroDoTotem();
  }

  function abrirTerminal() {
    if (!podeAbrirTerminal()) return;
    const missao = recursos.missoes.find((m) => m.id === `patch_${s.fase + 1}`);
    if (!missao) return;
    s.terminalAberto = true;
    limparAcoes();
    telaTerminal.hidden = false;
    terminal.abrir(missao);
  }

  /** O jogador fechou o terminal sem resolver: a luta continua de onde parou. */
  function aoFecharTerminal() {
    s.terminalAberto = false;
    telaTerminal.hidden = true;
  }

  /** Patch aplicado: fecha o terminal, mostra "PATCH n/3 APLICADO!" e depois o chefe leva dano. */
  function aoResolverPatch(idMissao) {
    s.terminalAberto = false;
    telaTerminal.hidden = true;
    terminal.fechar();
    s.mensagem = { numero: idMissao.replace('patch_', '') };
    entrar('mensagem', null);
  }

  // --- Desenho --------------------------------------------------------------

  function desenhar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, LARGURA, ALTURA);
    // Derrota: a tela treme 2 px.
    const tremorTela = s.estado === 'derrota' ? (Math.floor(s.total / 50) % 2 === 0 ? 2 : -2) : 0;
    ctx.save();
    ctx.translate(tremorTela, 0);

    desenharCenario();
    if (s.laser) desenharLaser();
    if (s.opacidade > 0) desenharChefe();
    if (s.notebook) desenharSprite('notebook_2f', quadroSprite('notebook_2f', s.total, 240, true), s.notebook.x, s.notebook.y);
    for (const bug of s.bugs) {
      if (bug.morto) desenharSprite('bugzinho_morte_2f', quadroSprite('bugzinho_morte_2f', bug.t, 150, false), bug.x, bug.y);
      else desenharSprite('bugzinho_andando_4f', quadroSprite('bugzinho_andando_4f', bug.t, 120, true), bug.x, bug.y);
    }
    for (const p of s.pacotes) desenharSprite('pacote_2f', quadroSprite('pacote_2f', p.t, 80, true), p.x, p.y);
    for (const g of s.gotas) {
      // Aviso no chão até o pacote cair (ele atravessa as plataformas).
      desenharSprite('laser_aviso_2f', quadroSprite('laser_aviso_2f', s.total, 120, true), g.x - 2, CHAO - 4);
      if (g.t >= cfg().ataques.chuva.aviso_ms) desenharSprite('pacote_2f', quadroSprite('pacote_2f', g.t, 80, true), g.x, g.y);
    }
    desenharByte();
    if (podeAbrirTerminal()) desenharBotaoTerminal();
    ctx.restore();

    desenharHUD();
    if (s.estado === 'apresentacao') desenharFaixa();
    if (s.estado === 'mensagem' && s.mensagem) desenharMensagemPatch();
    if (dialogo) desenharDialogo();
    if (s.estado === 'vitoria') escreverCartela(ctx, 'VITÓRIA!', (LARGURA - 8 * 24) / 2, 110, 24, '#FFD646', '#C9A227');
    atualizarInterfaceChefe();
  }

  function desenharCenario() {
    ctx.drawImage(recursos.sprites.arena.img, 0, 0);
    for (const p of cfg().arena.plataformas) desenharSprite('plataforma_2f', quadroSprite('plataforma_2f', s.total, 500, true), p.x, p.y);
    // Logo depois de trocar de lugar, o totem pisca.
    if (s.total - s.totemTrocaT < TOTEM_TROCA_MS && Math.floor(s.total / 50) % 2 === 0) return;
    const totem = posicaoTotem();
    desenharSprite('totem_4f', quadroSprite('totem_4f', s.total, 150, true), totem.x, totem.y);
  }

  function desenharChefe() {
    const { chefe } = cfg();
    const ms = chefe.ms_por_frame;
    // Dano: o chefe treme ±3 px durante a animação de dano.
    const tremor = s.estado === 'dano' ? (Math.floor(s.t / 50) % 2 === 0 ? 3 : -3) : 0;
    let nome = 'chefe_parado_6f';
    let quadro = quadroSprite(nome, s.total, ms.parado, true);
    if (s.estado === 'pacotes' || s.estado === 'chuva') {
      nome = 'chefe_ataque_6f';
      quadro = quadroSprite(nome, s.t, ms.ataque, false);
    } else if (s.estado === 'vulneravel') {
      nome = 'chefe_vulneravel_4f';
      quadro = quadroSprite(nome, s.total, ms.vulneravel, true);
    } else if (s.estado === 'dano') {
      nome = 'chefe_dano_2f';
      quadro = quadroSprite(nome, s.t, ms.dano, true);
    } else if (['derrota', 'recuperar', 'pegando', 'dialogo', 'vitoria', 'morte', 'fim'].includes(s.estado)) {
      nome = 'chefe_derrota_6f';
      quadro = quadroSprite(nome, s.t, ms.derrota, false);
    }
    if (s.opacidade < 1) ctx.globalAlpha = s.opacidade;
    desenharSprite(nome, quadro, chefeX() + tremor, chefeY());
    ctx.globalAlpha = 1;
  }

  function desenharLaser() {
    const { chefe } = cfg();
    const centro = s.laser.centro;
    const fim = chefeX() + chefe.pinca_laser_offset[0];
    if (s.faseLaser === 'aviso') {
      for (let x = 0; x < LARGURA; x += 32) {
        desenharSprite('laser_aviso_2f', quadroSprite('laser_aviso_2f', s.total, 120, true), x, centro - 2);
      }
    } else if (s.faseLaser === 'feixe') {
      const feixe = recursos.sprites.laser_feixe_2f;
      const quadro = quadroSprite('laser_feixe_2f', s.total, 90, true);
      for (let x = 0; x < fim; x += feixe.largura) {
        const largura = Math.min(feixe.largura, fim - x);
        ctx.drawImage(feixe.img, quadro * feixe.largura, 0, largura, feixe.altura, x, centro - 5, largura, feixe.altura);
      }
      desenharSprite('laser_ponta_2f', quadroSprite('laser_ponta_2f', s.total, 90, true), fim - 6, centro - 7);
    }
  }

  function desenharByte() {
    const b = s.byte;
    const piscando = b.invulneravelAte > s.total && Math.floor(s.total / 100) % 2 === 0;
    if (piscando && !b.morto) return;
    let nome = 'byte_parado_2f';
    let quadro = quadroSprite(nome, s.total, 550, true);
    if (b.morto) {
      nome = 'byte_morte_3f';
      quadro = quadroSprite(nome, s.total - b.morteT, 150, false);
    } else if (s.total < b.danoAte) {
      nome = 'byte_dano_2f';
      quadro = quadroSprite(nome, s.total, 200, true);
    } else if (b.agachado) {
      nome = 'byte_agachado_2f';
      quadro = 0;
    } else if (!b.noChao) {
      nome = b.vy < 0 ? 'byte_pulando_2f' : 'byte_caindo_2f';
      quadro = 0;
    } else if (b.andando) {
      nome = 'byte_correndo_8f';
      quadro = quadroSprite(nome, s.total, 80, true);
    }
    const x = Math.round(b.x);
    const topo = Math.round(b.pes - ALTURA_BYTE);
    ctx.save();
    if (b.facing === -1) {
      // Os sprites olham para a direita: espelha quando o Byte anda para a esquerda.
      ctx.translate(x + LARGURA_BYTE, topo);
      ctx.scale(-1, 1);
      desenharSprite(nome, quadro, 0, 0);
    } else {
      desenharSprite(nome, quadro, x, topo);
    }
    ctx.restore();
    if (s.estado === 'pegando') desenharSprite('balao_exclamacao', 0, x + 26, topo - 14);
  }

  function botaoTerminal() {
    const totem = posicaoTotem();
    // Centrado no totem, sem sair da arena nem cobrir a barra do chefe.
    return { x: Math.max(2, Math.min(LARGURA - 152, totem.x + 16 - 75)), y: Math.max(28, totem.y - 37) };
  }

  function desenharBotaoTerminal() {
    const { x, y } = botaoTerminal();
    ctx.drawImage(recursos.sprites.botao_terminal.img, x, y + (Math.floor(s.total / 400) % 2 === 0 ? 0 : 1));
  }

  function desenharHUD() {
    const x = 136;
    ctx.drawImage(recursos.sprites.hud_vazia.img, x, 0);
    // Barra cheia: só a área de preenchimento (x 4–203, y 14–21), com largura 200 × vida / 3.
    const largura = Math.round(200 * s.vida / 3);
    const piscando = s.estado === 'dano' && Math.floor(s.t / 50) % 2 === 1;
    if (largura > 0 && !piscando) {
      const cheia = recursos.sprites.hud_cheia.img;
      ctx.drawImage(cheia, 4, 14, largura, 8, x + 4, 14, largura, 8);
    }
    // Ao tomar dano, a moldura fica rosa por 1 frame.
    if (s.estado === 'dano' && s.t < 16) {
      ctx.strokeStyle = '#FF6078';
      ctx.strokeRect(x + 0.5, 0.5, 207, 25);
    }
    desenharVidas(ctx, s.byte.vidas, s.total / 1000, { x: 6, y: 6 });
  }

  /** Faixa de apresentação: o fundo abre do centro, depois aparecem as linhas do texto de cima para baixo. */
  function desenharFaixa() {
    const t = s.t;
    const y = 100;
    const altura = 57;
    const largura = Math.round(LARGURA * Math.min(1, t / 300));
    ctx.fillStyle = '#0B0D1A';
    ctx.fillRect((LARGURA - largura) / 2, y, largura, altura);
    if (t < 300) return;
    // Linhas da imagem: 0–18 é "! CHEFE FINAL !", 19–41 é o nome, 42–56 é o subtítulo.
    // Até 700 ms: só a primeira linha; até 1000 ms: o nome; depois: tudo.
    const visivel = t < 700 ? 18 : t < 1000 ? 41 : altura;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, LARGURA, visivel);
    ctx.clip();
    ctx.drawImage(recursos.sprites.faixa.img, 0, y);
    ctx.restore();
  }

  function desenharMensagemPatch() {
    const caixa = { x: 150, y: 96, w: 180, h: 62 };
    ctx.fillStyle = '#0B0D1A';
    ctx.fillRect(caixa.x, caixa.y, caixa.w, caixa.h);
    ctx.strokeStyle = '#3CE6FF';
    ctx.strokeRect(caixa.x + 0.5, caixa.y + 0.5, caixa.w - 1, caixa.h - 1);
    escrever(ctx, 'TERMINAL DO TOTEM', caixa.x + 10, caixa.y + 12, 8, '#3CE6FF');
    escrever(ctx, `PATCH ${s.mensagem.numero}/3`, caixa.x + 10, caixa.y + 28, 8, '#FFD646');
    escrever(ctx, 'APLICADO!', caixa.x + 10, caixa.y + 44, 8, '#5AFF8C');
  }

  // --- Diálogo --------------------------------------------------------------

  function abrirDialogo(quem, texto, aoFechar) {
    const linhas = quebrar(texto, 46);
    dialogo = { quem, linhas, total: linhas.reduce((soma, linha) => soma + linha.length, 0), letras: 0, aoFechar };
    s.estado = 'dialogo';
  }

  function desenharDialogo() {
    ctx.drawImage(recursos.sprites.caixa_byte.img, 8, 24);
    ctx.drawImage(recursos.sprites.retrato_byte.img, 21, 46);
    escrever(ctx, dialogo.quem, 84, 28, 8, '#FFD646');
    let mostrar = Math.floor(dialogo.letras);
    dialogo.linhas.forEach((linha, i) => {
      escrever(ctx, linha, 82, 46 + 13 * i, 8, '#FFFFFF', Math.max(0, mostrar));
      mostrar -= linha.length;
    });
  }

  /** Enter/Espaço/clique: completa o texto; com o texto completo, fecha o diálogo. */
  function avancarDialogo() {
    if (!dialogo) return;
    if (dialogo.letras < dialogo.total) {
      dialogo.letras = dialogo.total;
      return;
    }
    const aoFechar = dialogo.aoFechar;
    dialogo = null;
    aoFechar();
  }

  // --- Entrada --------------------------------------------------------------

  function aoTecla(evento) {
    if (!rodando) return;
    if (pausado) return;
    if (evento.target.closest?.('#chefe-fim') && ['Enter', ' '].includes(evento.key)) return;
    if (s.terminalAberto) {
      terminal.tratarTecla(evento);
      return;
    }
    if (s.estado === 'fim') {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        reiniciar();
      } else if (evento.key === 'Escape') {
        evento.preventDefault();
        sair();
      }
      return;
    }
    if (dialogo && (evento.key === 'Enter' || evento.key === ' ')) {
      evento.preventDefault();
      if (!evento.repeat) avancarDialogo();
      return;
    }
    if (['e', 'E', 'Enter'].includes(evento.key) && podeAbrirTerminal()) {
      evento.preventDefault();
      abrirTerminal();
    }
  }

  function aoClicar(evento) {
    if (!rodando || pausado) return;
    if (dialogo) {
      avancarDialogo();
      return;
    }
    const { x, y } = pontoNoCanvas(canvas, evento, LARGURA, ALTURA);
    const botao = botaoTerminal();
    if (podeAbrirTerminal() && x >= botao.x && x < botao.x + 150 && y >= botao.y && y < botao.y + 28) abrirTerminal();
  }

  function quadro(agora) {
    if (!rodando) return;
    const dt = Math.min(0.05, (agora - ultimoQuadro) / 1000);
    ultimoQuadro = agora;
    if (!pausado) {
      atualizar(dt);
      if (dialogo && !s.terminalAberto) dialogo.letras = Math.min(dialogo.total, dialogo.letras + dt * 50);
      desenhar();
    }
    requestAnimationFrame(quadro);
  }

  function parar() {
    inicializacao += 1;
    if (!rodando) return;
    rodando = false;
    limparAcoes();
    window.removeEventListener('keydown', aoTecla);
    canvas.removeEventListener('click', aoClicar);
    if (retornosAnteriores) terminal.definirRetornos(retornosAnteriores);
    retornosAnteriores = null;
    if (s.terminalAberto) {
      s.terminalAberto = false;
      telaTerminal.hidden = true;
      terminal.fechar();
    }
    atualizarInterfaceChefe();
  }

  return {
    /** Começa a luta: a faixa de apresentação e depois a primeira fase. */
    async iniciar() {
      if (rodando) return;
      const tentativa = ++inicializacao;
      pausado = false;
      if (!recursos) recursos = await carregarRecursos(pasta);
      if (tentativa !== inicializacao) return;
      novaPartida();
      retornosAnteriores = terminal.definirRetornos({ onFechar: aoFecharTerminal, onResolvido: aoResolverPatch });
      rodando = true;
      ultimoQuadro = performance.now();
      atualizarInterfaceChefe();
      onAtualizarInterface();
      window.addEventListener('keydown', aoTecla);
      canvas.addEventListener('click', aoClicar);
      requestAnimationFrame(quadro);
    },
    parar,
    reiniciar,
    podeControlar,
    pronto: () => rodando,
    podePausar: () => rodando && s.estado !== 'fim' && !s.terminalAberto,
    pausar() {
      pausado = true;
      limparAcoes();
      atualizarInterfaceChefe();
    },
    retomar() {
      pausado = false;
      ultimoQuadro = performance.now();
      limparAcoes();
      atualizarInterfaceChefe();
    },
  };
}
