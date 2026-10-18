// Arena da luta contra o Kernel Panic.
// A física usa uma arena de 480 × 270; a visão acompanha o tamanho da tela.
// A física do Byte (velocidade, gravidade e salto) não está no guia: os valores abaixo foram escolhidos
// para o salto alcançar as duas plataformas.
import { inputState, limparAcoes } from './input.js';
import { desenharVidas } from './player.js';
import { carregarFonte, escrever, escreverCartela, quebrar } from './cutscene.js';
import { Tiro } from './poder.js';
import { tocarEfeitoEletronico } from './audio.js';
import { ajustarCanvas } from './viewport.js';
import { movimentoReduzido } from './acessibilidade.js';

const LARGURA = 480;
const ALTURA = 270;
const CHAO = 213;
const ALTURA_BYTE = 46;
const ALTURA_BYTE_AGACHADO = 30;
const LARGURA_BYTE = 48;
const VEL_BYTE = 175;
const GRAVIDADE = 1100;
const SALTO = 450;
const GRAVIDADE_NOTEBOOK = 600;
const INVULNERAVEL_MS = 1800;
const DANO_BYTE_MS = 400;
const APRESENTACAO_MS = 1500;
const CARREGAR_PODER_MS = 350;
const INTERVALO_TIRO_MS = 220;
const TOTEM_TROCA_MS = 300;
const DANO_CHEFE_MS = 400;
const DERROTA_MS = 1000;
const BALAO_MS = 500;
const VITORIA_MS = 1800;
const MORTE_BYTE_MS = 1000;
const PACOTE_CHAO_Y = CHAO - 12;

// Arquivos da pasta da luta, pelo nome usado no código. Sprites com N quadros lado a lado: "_Nf".
const ARQUIVOS = {
  arena: '../compartilhados/arena_chefe_fundo_480x270.png',
  faixa: 'faixa_chefe_final_480x57.png',
  hud_vazia: 'hud_barra_chefe_vazia_208x26.png',
  hud_cheia: 'hud_barra_chefe_cheia_208x26.png',
  chefe_parado_6f: 'chefe_com_notebook_parado_6f_128x128.png',
  chefe_ataque_6f: 'chefe_com_notebook_ataque_6f_128x128.png',
  chefe_vulneravel_4f: 'chefe_com_notebook_vulneravel_4f_128x128.png',
  chefe_dano_2f: 'chefe_com_notebook_dano_2f_128x128.png',
  chefe_derrota_6f: 'chefe_kernel_panic_derrota_6f_128x128.png',
  pacote_2f: '../compartilhados/projetil_pacote_erro_2f_12x12.png',
  laser_aviso_2f: 'laser_aviso_2f_16x4.png',
  laser_feixe_2f: 'laser_feixe_2f_16x10.png',
  laser_ponta_2f: 'laser_ponta_2f_12x14.png',
  bugzinho_andando_4f: 'bugzinho_andando_4f_18x14.png',
  bugzinho_morte_2f: 'bugzinho_morte_2f_18x14.png',
  notebook_2f: '../compartilhados/notebook_frente_2f_18x15.png',
  plataforma_2f: '../characters/Imagens_Personagens/02_cenario/plataformas_totens_pacote/plataforma_metal_64x24_2f.png',
  totem_4f: '../characters/Imagens_Personagens/02_cenario/plataformas_totens_pacote/totem_terminal_ativo_32x64_4f.png',
  byte_parado_2f: '../compartilhados/byte_parado_2f_48x48.png',
  byte_correndo_8f: '../compartilhados/byte_correndo_8f_48x48.png',
  byte_pulando_2f: '../compartilhados/byte_pulando_2f_48x48.png',
  byte_caindo_2f: '../compartilhados/byte_caindo_2f_48x48.png',
  byte_agachado_2f: '../compartilhados/byte_agachado_2f_48x48.png',
  byte_dano_2f: '../compartilhados/byte_dano_2f_48x48.png',
  byte_morte_3f: '../compartilhados/byte_morte_3f_48x48.png',
  balao_exclamacao: '../compartilhados/balao_exclamacao_16x16.png',
  caixa_byte: '../compartilhados/caixa_dialogo_byte_468x82.png',
  retrato_byte: '../compartilhados/retrato_byte_44x44.png',
};

function carregarImagem(url) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error(`Falha ao carregar ${url}`));
    img.src = url;
  });
}

/** Carrega um sprite. O número de quadros vem do nome do arquivo ("_Nf"). */
async function carregarSprite(url) {
  const img = await carregarImagem(url);
  const padrao = /_(\d+)f(?=_|\.|$)/.exec(url);
  const quadros = padrao ? Number(padrao[1]) : 1;
  return { img, quadros, largura: img.naturalWidth / quadros, altura: img.naturalHeight };
}

// Sprites 48 × 48 do Byte. Com uma skin equipada, os mesmos arquivos vêm da pasta `arena/` da skin.
const SPRITES_BYTE = Object.keys(ARQUIVOS).filter((nome) => nome.startsWith('byte_'));

/** Carrega imagens, fonte, configuração e missões da luta. */
async function carregarRecursos(pasta) {
  const imagens = Object.entries(ARQUIVOS).map(async ([nome, arquivo]) => [nome, await carregarSprite(pasta + arquivo)]);
  const [lista, config, missoes] = await Promise.all([
    Promise.all(imagens),
    fetch(pasta + 'chefe_config.json').then((resposta) => resposta.json()),
    fetch(pasta + 'missoes_chefe.json').then((resposta) => resposta.json()),
    carregarFonte(),
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
 * - onSair(): o jogador desistiu depois de perder todas as vidas;
 * - pastaByte(): pasta dos sprites 48 × 48 da skin equipada, ou null para o Byte clássico.
 * Devolve { iniciar(), parar() }.
 */
export function criarChefe(canvas, {
  pasta, terminal, telaTerminal, onVitoria, onSair, onAtualizarInterface = () => {}, pastaByte = () => null,
}) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let recursos = null;
  let pastaByteCarregada = null;
  let rodando = false;
  let ultimoQuadro = 0;
  let retornosAnteriores = null;
  let s = null;
  let dialogo = null;
  let puloAnterior = false;
  let pausado = false;
  let controlesAnteriores = false;
  let inicializacao = 0;
  let visao = { largura: LARGURA, altura: ALTURA, escala: 1, x: 0, y: 0, pixelRatio: 1, vidasX: 64, hudY: 12 };
  const menuFim = canvas.parentElement.querySelector('#chefe-fim');
  const botaoTentar = menuFim.querySelector('#chefe-tentar');
  const informacoes = canvas.parentElement.querySelector('.chefe-info');
  const etapa = informacoes.querySelector('#chefe-etapa');
  const dica = informacoes.querySelector('#chefe-dica');
  const tempoRestante = informacoes.querySelector('#chefe-tempo');
  const botaoDesafio = canvas.parentElement.querySelector('#chefe-abrir-desafio');

  function redimensionar() {
    const { width: largura, height: altura } = canvas.getBoundingClientRect();
    if (!largura || !altura) return;
    const escala = Math.min(largura / LARGURA, altura / ALTURA);
    const telaCheia = document.getElementById('botao-tela-cheia').getBoundingClientRect();
    visao = { largura, altura, escala,
      x: (largura - LARGURA * escala) / 2,
      y: (altura - ALTURA * escala) / 2,
      pixelRatio: ajustarCanvas(canvas, { largura, altura }),
      vidasX: Math.max(64, telaCheia.right + 12),
      hudY: Math.max(12, telaCheia.top),
    };
    if (rodando) desenhar();
  }

  new ResizeObserver(redimensionar).observe(canvas);

  function podeControlar() {
    return rodando && !pausado && !dialogo && !s.terminalAberto && s.byte.vidas > 0
      && ['parado', 'pacotes', 'laser', 'bugzinhos', 'chuva', 'vulneravel', 'recuperar'].includes(s.estado);
  }

  function atualizarInterfaceChefe() {
    const mostrarFim = rodando && s.estado === 'fim';
    const mudouFim = menuFim.hidden === mostrarFim;
    const controles = podeControlar();
    menuFim.hidden = !mostrarFim;
    botaoDesafio.hidden = !rodando || pausado || !podeAbrirTerminal();
    if (rodando) {
      const totem = posicaoTotem();
      // Mesma arte, tamanho e balanço do botão das fases, em pixels da tela.
      const escalaBotao = visao.altura / 540;
      const balanco = Math.floor(performance.now() / 400) % 2 === 0 ? 0 : escalaBotao;
      botaoDesafio.style.setProperty('--desafio-largura', `${154 * escalaBotao}px`);
      botaoDesafio.style.setProperty('--terminal-x', `${visao.x + (totem.x + 16) * visao.escala}px`);
      botaoDesafio.style.setProperty('--terminal-y', `${visao.y + totem.y * visao.escala - 9 * escalaBotao + balanco}px`);
    }
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
  botaoDesafio.addEventListener('click', abrirTerminal);

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
      poderes: [],
      rajada: null,
      impactoAte: 0,
      notebook: null,
      terminalAberto: false,
      venceu: false,
      totem: 0,
      totemTrocaT: -Infinity,
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
      // A janela do exercício é segura: nenhum ataque antigo atravessa o computador.
      limparAtaques();
      s.chefeDescY = 0;
      s.trocasTotem = 0;
      moverTotem();
    }
    if (estado === 'dano') s.vida = Math.max(0, s.vida - 1);
    if (estado === 'derrota') {
      // O chefe cai solto e o notebook sai do colo dele.
      limparAtaques();
      s.chefeDescY = 0;
      s.notebook = { x: chefeX() + cfg().chefe.notebook_offset[0], y: chefeY() + cfg().chefe.notebook_offset[1], vx: -30, vy: 0, estado: 'caindo' };
    }
  }

  function limparAtaques() {
    s.pacotes = [];
    s.gotas = [];
    s.bugs = [];
    s.laser = null;
    s.faseLaser = null;
  }

  // --- Atualização ----------------------------------------------------------

  function atualizar(dt) {
    if (s.terminalAberto || s.estado === 'fim') return;
    s.total += dt * 1000;
    if (s.estado === 'apresentacao') {
      s.t += dt * 1000;
      if (s.t >= APRESENTACAO_MS) {
        s.fase = 0;
        iniciarFase();
      }
      return;
    }
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
          if (s.faseLaser !== 'aviso') tocarEfeitoEletronico('alerta');
          s.chefeDescY = alvo;
          s.faseLaser = 'aviso';
        } else if (t < desce + aviso + feixe) {
          if (s.faseLaser !== 'feixe') tocarEfeitoEletronico('laser');
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
        const intervalo = cfg().fases[s.fase].vulneravel?.totem_troca_a_cada_ms;
        if (intervalo > 0 && t >= (s.trocasTotem + 1) * intervalo) {
          if (!dentroDoTotem()) moverTotem();
          s.trocasTotem += 1;
        }
        if (t >= cfg().vulneravel.duracao_ms) {
          // Tempo esgotado: o chefe volta a PARADO e repete a fase.
          s.passo = 0;
          proximoPasso();
        }
        break;
      }
      case 'carregando':
        if (t >= CARREGAR_PODER_MS) {
          entrar('contra_ataque', null);
          lancarPoder();
        }
        break;
      case 'contra_ataque':
        if (s.rajada.lancados < s.rajada.total && t >= s.rajada.lancados * INTERVALO_TIRO_MS) lancarPoder();
        for (const poder of s.poderes) poder.atualizar(dt);
        s.poderes = s.poderes.filter(poder => !poder.terminou);
        if (s.rajada.acertos === s.rajada.total) entrar('dano', null);
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
    if (b.morto || ['carregando', 'contra_ataque', 'dano', 'derrota', 'pegando', 'dialogo', 'vitoria'].includes(s.estado)) return;
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
      tocarEfeitoEletronico('pulo');
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
    const machuca = !['vulneravel', 'carregando', 'contra_ataque', 'dano', 'derrota', 'recuperar', 'pegando', 'dialogo', 'vitoria', 'morte'].includes(s.estado);

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
    tocarEfeitoEletronico('dano');
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

  function posicaoTotem() {
    return cfg().arena.totem.posicoes?.[s.totem] ?? cfg().arena.totem;
  }

  function moverTotem() {
    const posicoes = cfg().arena.totem.posicoes;
    if (!posicoes || posicoes.length < 2) return;
    const centroByte = s.byte.x + LARGURA_BYTE / 2;
    const outras = posicoes.map((_, i) => i).filter(i => i !== s.totem);
    const maisPerto = outras.reduce((a, b) =>
      Math.abs(posicoes[b].x + 16 - centroByte) < Math.abs(posicoes[a].x + 16 - centroByte) ? b : a);
    const opcoes = outras.length > 1 ? outras.filter(i => i !== maisPerto) : outras;
    s.totem = opcoes[Math.floor(Math.random() * opcoes.length)];
    s.totemTrocaT = s.total;
    tocarEfeitoEletronico('terminal');
  }

  function dentroDoTotem() {
    const base = cfg().arena.totem;
    const totem = posicaoTotem();
    const [x0, y0, x1, y1] = base.area_interacao;
    return sobrepoe(corpoByte(), { x: x0 + totem.x - base.x, y: y0 + totem.y - base.y, w: x1 - x0, h: y1 - y0 });
  }

  function podeAbrirTerminal() {
    return s.estado === 'vulneravel' && !s.terminalAberto
      && s.total - s.totemTrocaT >= TOTEM_TROCA_MS && dentroDoTotem();
  }

  function abrirTerminal() {
    if (!podeAbrirTerminal()) return;
    const missao = recursos.missoes.find((m) => m.id === `patch_${s.fase + 1}`);
    if (!missao) return;
    s.terminalAberto = true;
    limparAcoes();
    telaTerminal.hidden = false;
    terminal.abrir(missao);
    tocarEfeitoEletronico('terminal');
    atualizarInterfaceChefe();
  }

  /** O jogador fechou o terminal sem resolver: a luta continua de onde parou. */
  function aoFecharTerminal() {
    s.terminalAberto = false;
    telaTerminal.hidden = true;
    atualizarInterfaceChefe();
    if (!botaoDesafio.hidden) botaoDesafio.focus({ preventScroll: true });
  }

  /** O código resolvido prepara a rajada; a vida baixa quando todos os tiros atingem o núcleo. */
  function aoResolverPatch(idMissao) {
    if (!s.terminalAberto || s.estado !== 'vulneravel' || idMissao !== `patch_${s.fase + 1}`) return;
    s.terminalAberto = false;
    telaTerminal.hidden = true;
    terminal.fechar();
    limparAcoes();
    limparAtaques();
    s.byte.facing = chefeX() + 64 >= s.byte.x + LARGURA_BYTE / 2 ? 1 : -1;
    s.byte.andando = false;
    s.byte.agachado = false;
    const missao = recursos.missoes.find(missao => missao.id === idMissao);
    s.rajada = { total: missao.disparos ?? 1, lancados: 0, acertos: 0, ultimoEm: -Infinity };
    s.poderes = [];
    entrar('carregando', null);
  }

  function centroNucleo() {
    const [x0, y0, x1, y1] = cfg().chefe.hitbox_nucleo;
    return { x: chefeX() + (x0 + x1) / 2, y: chefeY() + (y0 + y1) / 2 };
  }

  function lancarPoder() {
    const b = s.byte;
    const tiro = new Tiro({ x: b.x, y: b.pes - ALTURA_BYTE, largura: LARGURA_BYTE, altura: ALTURA_BYTE }, {
      centro: centroNucleo,
      derrotar() {
        s.rajada.acertos += 1;
        s.impactoAte = s.total + DANO_CHEFE_MS;
        tocarEfeitoEletronico('impacto');
      },
    });
    tiro.x = b.x + (b.facing === 1 ? 40 : 8);
    tiro.y = b.pes - 25;
    s.poderes.push(tiro);
    s.rajada.lancados += 1;
    s.rajada.ultimoEm = s.total;
  }

  // --- Desenho --------------------------------------------------------------

  function desenhar() {
    ctx.setTransform(visao.pixelRatio, 0, 0, visao.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, visao.largura, visao.altura);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(visao.x, visao.y);
    ctx.scale(visao.escala, visao.escala);
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
    desenharPoder();
    ctx.restore();

    desenharHUD();
    if (s.estado === 'apresentacao') desenharFaixa();
    atualizarInformacoes();
    if (dialogo) desenharDialogo();
    if (s.estado === 'vitoria') escreverCartela(ctx, 'VITÓRIA!', (LARGURA - 8 * 24) / 2, 110, 24, '#FFD646', '#C9A227');
    ctx.restore();
    atualizarInterfaceChefe();
  }

  function desenharCenario() {
    const fundo = recursos.sprites.arena.img;
    const esquerda = -visao.x / visao.escala;
    const topo = -visao.y / visao.escala;
    const largura = visao.largura / visao.escala;
    ctx.drawImage(fundo, 0, 0);
    // Prolonga só as bordas, preservando as proporções e sem repetir o sol.
    for (const lado of [-1, 1]) {
      const margem = lado < 0 ? -esquerda : esquerda + largura - LARGURA;
      for (let i = 0; i < Math.ceil(margem / 32); i++) {
        ctx.save();
        ctx.translate(lado < 0 ? -(i + 1) * 32 : LARGURA + i * 32, 0);
        if (i % 2 === 0) {
          ctx.translate(32, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(fundo, lado < 0 ? 0 : LARGURA - 32, 0, 32, ALTURA, 0, 0, 32, ALTURA);
        ctx.restore();
      }
    }
    if (topo < 0) {
      ctx.drawImage(fundo, 0, 0, LARGURA, 1, esquerda, topo, largura, -topo);
      ctx.drawImage(fundo, 0, ALTURA - 1, LARGURA, 1, esquerda, ALTURA, largura, -topo);
    }
    for (const p of cfg().arena.plataformas) desenharSprite('plataforma_2f', quadroSprite('plataforma_2f', s.total, 500, true), p.x, p.y);
    const totem = posicaoTotem();
    if (s.total - s.totemTrocaT < TOTEM_TROCA_MS && Math.floor(s.total / 50) % 2 === 0) return;
    ctx.fillStyle = s.estado === 'vulneravel' ? '#6bf0c2' : '#555278';
    ctx.fillRect(totem.x - 5, totem.y + 62, 42, 2);
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
    } else if (['vulneravel', 'carregando', 'contra_ataque'].includes(s.estado)) {
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
    const invulneravel = b.invulneravelAte > s.total && !b.morto && !['carregando', 'contra_ataque'].includes(s.estado);
    // Com movimento reduzido, a invulnerabilidade aparece como transparência fixa em vez de piscar.
    const reduzido = movimentoReduzido();
    if (invulneravel && !reduzido && Math.floor(s.total / 100) % 2 === 0) return;
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
    if (invulneravel && reduzido) ctx.globalAlpha = 0.5;
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

  function desenharHUD() {
    ctx.save();
    ctx.setTransform(visao.pixelRatio, 0, 0, visao.pixelRatio, 0, 0);
    const larguraBarra = Math.min(416, Math.max(140, visao.largura - visao.vidasX - 194));
    const x = Math.max(visao.vidasX + 126, (visao.largura - larguraBarra) / 2);
    ctx.save();
    ctx.translate(x, visao.hudY);
    ctx.scale(larguraBarra / 208, larguraBarra / 208);
    ctx.drawImage(recursos.sprites.hud_vazia.img, 0, 0);
    // Barra cheia: só a área de preenchimento (x 4–203, y 14–21), com largura 200 × vida / 3.
    const largura = Math.round(200 * s.vida / 3);
    const piscando = s.estado === 'dano' && !movimentoReduzido() && Math.floor(s.t / 50) % 2 === 1;
    if (largura > 0 && !piscando) {
      const cheia = recursos.sprites.hud_cheia.img;
      ctx.drawImage(cheia, 4, 14, largura, 8, 4, 14, largura, 8);
    }
    // Ao tomar dano, a moldura fica rosa por 1 frame.
    if (s.estado === 'dano' && s.t < 16) {
      ctx.strokeStyle = '#FF6078';
      ctx.strokeRect(0.5, 0.5, 207, 25);
    }
    ctx.restore();
    desenharVidas(ctx, s.byte.vidas, s.total / 1000, { x: visao.vidasX, y: visao.hudY });
    ctx.restore();
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

  function desenharPoder() {
    const disparando = s.estado === 'contra_ataque' && s.total - s.rajada.ultimoEm < 100;
    if (s.estado === 'carregando' || disparando) {
      const x = s.byte.x + (s.byte.facing === 1 ? 40 : 8);
      const y = s.byte.pes - 25;
      ctx.fillStyle = '#2775a1';
      ctx.fillRect(x + (s.byte.facing === 1 ? -10 : 0), y - 1, 10, 5);
      ctx.fillStyle = '#ffd064';
      ctx.fillRect(x - 2, y - 1, 4, 4);
    }
    if (s.estado === 'carregando' || disparando) {
      const x = s.byte.x + (s.byte.facing === 1 ? 40 : 8);
      const y = s.byte.pes - 25;
      const raio = disparando ? 4 : 3 + Math.round(2 * s.t / CARREGAR_PODER_MS);
      ctx.fillStyle = '#3ce6ff';
      ctx.fillRect(x - raio, y - 2, raio * 2, 4);
      ctx.fillRect(x - 2, y - raio, 4, raio * 2);
      ctx.fillStyle = '#efffff';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    for (const poder of s.poderes) poder.desenhar(ctx);
    if (s.total < s.impactoAte) {
      const centro = centroNucleo();
      const t = 1 - (s.impactoAte - s.total) / DANO_CHEFE_MS;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      for (let i = 0; i < 8; i++) {
        const angulo = i * Math.PI / 4;
        const raio = 6 + t * 26;
        ctx.fillStyle = i % 2 ? '#fff4bc' : '#3ce6ff';
        ctx.fillRect(Math.round(centro.x + Math.cos(angulo) * raio) - 2,
          Math.round(centro.y + Math.sin(angulo) * raio) - 2, 4, 4);
      }
      ctx.restore();
    }
  }

  function atualizarInformacoes() {
    const totalTiros = s.rajada?.total ?? 1;
    const textos = {
      apresentacao: 'Recupere o notebook aplicando três patches.',
      parado: s.pacotes.length ? 'Pule os pacotes ou use as plataformas.' : 'Prepare-se para o próximo ataque.',
      pacotes: 'Pule os pacotes ou use as plataformas.',
      laser: s.arg === 'baixo' ? 'Pule ou suba numa plataforma.' : 'Agache para desviar do laser.',
      chuva: 'Saia das marcas no chão antes dos pacotes caírem.',
      bugzinhos: 'Pule por cima dos bugs.',
      vulneravel: dentroDoTotem() ? 'Abra o desafio no computador.' : 'Escudo desligado! Alcance o computador iluminado.',
      carregando: `Patch resolvido! Preparando ${totalTiros === 1 ? 'um tiro' : `${totalTiros} tiros`}.`,
      contra_ataque: `Byte está lançando ${totalTiros === 1 ? 'um tiro' : `${totalTiros} tiros`} no núcleo!`,
      dano: 'Acertou! O Kernel Panic perdeu uma vida.',
      derrota: 'Você venceu! O notebook está caindo.',
      recuperar: 'Pegue seu notebook no chão.',
      pegando: 'Notebook recuperado!',
      dialogo: 'Notebook recuperado!',
      vitoria: 'Kernel Panic derrotado!',
      morte: 'Tente novamente: observe os avisos de cada ataque.',
      fim: 'Tente novamente: observe os avisos de cada ataque.',
    };
    const rotulo = `PATCH ${s.fase + 1}/3`;
    if (etapa.textContent !== rotulo) etapa.textContent = rotulo;
    const texto = textos[s.estado] ?? '';
    if (dica.textContent !== texto) dica.textContent = texto;
    const restante = s.estado === 'vulneravel' ? `${Math.max(0, Math.ceil((cfg().vulneravel.duracao_ms - s.t) / 1000))} s` : '';
    if (tempoRestante.textContent !== restante) tempoRestante.textContent = restante;
    tempoRestante.hidden = !restante;
    informacoes.dataset.estado = s.estado;
    informacoes.hidden = s.estado === 'fim';
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
    if (evento.target === botaoDesafio && ['Enter', ' '].includes(evento.key)) {
      evento.preventDefault();
      limparAcoes();
      if (!evento.repeat) abrirTerminal();
      return;
    }
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

  function aoClicar() {
    if (!rodando || pausado) return;
    if (dialogo) {
      avancarDialogo();
      return;
    }
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
      const pastaSkin = pastaByte();
      if (pastaSkin !== pastaByteCarregada) {
        const sprites = await Promise.all(SPRITES_BYTE.map(async (nome) => {
          const url = pastaSkin ? pastaSkin + ARQUIVOS[nome].split('/').pop() : pasta + ARQUIVOS[nome];
          return [nome, await carregarSprite(url)];
        }));
        Object.assign(recursos.sprites, Object.fromEntries(sprites));
        pastaByteCarregada = pastaSkin;
      }
      if (tentativa !== inicializacao) return;
      novaPartida();
      retornosAnteriores = terminal.definirRetornos({ onFechar: aoFecharTerminal, onResolvido: aoResolverPatch });
      rodando = true;
      ultimoQuadro = performance.now();
      redimensionar();
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
