// Fases 2 a 5, montadas a partir de uma lista de trechos. Cada trecho avança o cursor da fase:
//   ['chao', largura]                   chão (pedaços de chão, colisão de 60 px)
//   ['cristal', largura]                chão de cristais (visual diferente, mesma colisão)
//   ['vao', largura, extras?]           vão com água: o Byte cai e perde uma vida
//   ['teto', largura]                   bloco suspenso sobre chão (só passa agachado)
//   ['bloco', largura, altura]          degrau sólido de `altura` px (use em sequência para escadas)
//   ['plataforma', largura, altura]     plataforma sobre chão, com o topo a `altura` px do chão
//   ['suspensa', dx, altura, largura]   plataforma solta (não avança o cursor nem cria chão);
//                                       use larguras do pacote (32, 48, 64, 80, 96 ou 128)
//   ['mec', tipo, extras]               mecânica do pacote; chão embaixo é criado automaticamente,
//                                       exceto com extras.sobreVao (fica sobre um vão);
//                                       extras.dx desloca sem avançar; extras.avancar: false não avança;
//                                       extras.missao: porta que abre quando a missão é resolvida
//   ['travessia', tipo, extras?]        vão de 360 px, com uma plataforma mecânica no centro
//   ['passagemComPorta', extras]        porta dentro de túnel; extras.botoes coloca acionadores dos dois lados
//   ['esmagadorNoTunel']                passagem baixa com pistão; é preciso esperar a abertura
//   ['planta', extras?]                 planta (inimigo) no chão, com 60 px de chão
//   ['patrulha', largura, extras?]      sentinela patrulhando o chão deste trecho
//   ['checkpoint', extras?]             totem no cursor; extras.missao abre um terminal (totem de tela; os
//                                       outros usam obelisco e antena, para não parecerem computadores)
//   ['moeda', dx, y] / ['vida', dx, y, extras?]  coletáveis (dx em relação ao cursor; y em px do mundo)
//   extras.desafio (vão, planta, patrulha e vida): id de uma pergunta de bancoDesafios.js
//   ['computador', desafio, dx?]        computador de desafio no chão em cursor + dx (padrão -72: fim do chão
//                                       anterior); não avança. Abre a pergunta `desafio` pelo botão ABRIR DESAFIO
//   ['computadorTerminal', missao, dx?] igual, mas abre o terminal da missão; resolvê-la derrota o monstro
//                                       com a mesma missão (extras.missao na planta ou na patrulha).
//                                       É obrigatório: a saída da fase só abre com a missão resolvida
//   ['meta']                            ponto de chegada: tocar conclui a fase
//
// O pulo comum sobe ~104 px e percorre ~250 px (mais os 40 px do corpo).
// Pontes de exercício cobrem 400 px; travessias de 360 px exigem o apoio central.
// Computadores e checkpoints ficam em chão seguro, antes do obstáculo correspondente.
// Moedas sobre pontes indicam caminhada; sobre plataformas indicam onde pousar.
// Bônus acima de 104 px têm trampolim, ventilador ou degraus para chegar até eles.
import { LARGURAS } from './mecanicas.js';

const CHAO = 480;
// Totens dos checkpoints sem missão. A tela fica para os computadores com o botão ABRIR DESAFIO.
const TOTENS = ['obelisco', 'antena'];

/** Monta uma fase a partir da lista de trechos. */
export function construirFase({ nome, subtitulo, titulo, texto, itens, estiloPlataforma }) {
  let cursor = 0;
  const obstaculos = [];
  const vaos = [];
  const checkpoints = [];
  const computadores = [];
  const mecanicas = [];
  const plantas = [];
  const patrulhas = [];
  const moedas = [];
  const vidasItens = [];
  let meta = null;
  let totens = 0;
  let inimigos = 0;

  // Pergunta do banco de desafios ligada ao elemento, quando houver.
  const comDesafio = (extras) => ({
    ...(extras?.desafio ? { desafio: extras.desafio } : {}),
    ...(extras?.missao !== undefined ? { missao: extras.missao } : {}),
  });

  const chao = (largura, tipo = 'chao') => {
    obstaculos.push({ tipo, x: cursor, y: CHAO, width: largura, height: 60 });
    cursor += largura;
  };

  for (const [operacao, a, b, c] of itens) {
    switch (operacao) {
      case 'chao':
        chao(a);
        break;
      case 'cristal':
        chao(a, 'chao_cristal');
        break;
      case 'vao':
        vaos.push({ x: cursor, y: CHAO, width: a, height: 60, ...comDesafio(b) });
        cursor += a;
        break;
      case 'teto':
        chao(a);
        obstaculos.push({ tipo: 'teto', x: cursor - a, y: 330, width: a, height: 100 });
        break;
      case 'bloco':
        obstaculos.push({ tipo: 'chao', x: cursor, y: CHAO - b, width: a, height: b + 60 });
        cursor += a;
        break;
      case 'plataforma':
        chao(a);
        obstaculos.push({ tipo: 'plataforma', x: cursor - a, y: CHAO - b, width: a, height: 20 });
        break;
      case 'suspensa':
        obstaculos.push({ tipo: 'plataforma', x: cursor + a, y: CHAO - b, width: c, height: 20 });
        break;
      case 'mec': {
        const tipo = a;
        const extras = b ?? {};
        const largura = LARGURAS[tipo];
        if (largura === undefined) throw new RangeError(`Mecânica desconhecida: ${tipo}`);
        const sobreposto = extras.dx !== undefined;
        const avanca = extras.avancar !== false && !sobreposto;
        if (avanca && !extras.sobreVao) {
          obstaculos.push({ tipo: 'chao', x: cursor, y: CHAO, width: largura, height: 60 });
        }
        const { dx, ...resto } = extras;
        mecanicas.push({ tipo, x: cursor, dx: dx ?? 0, ...resto });
        if (avanca) cursor += largura;
        break;
      }
      case 'travessia': {
        const largura = 360;
        const larguraApoio = LARGURAS[a];
        vaos.push({ x: cursor, y: CHAO, width: largura, height: 60 });
        mecanicas.push({ tipo: a, x: cursor + (largura - larguraApoio) / 2, ...b });
        cursor += largura;
        break;
      }
      case 'passagemComPorta': {
        const { botoes, ...porta } = a;
        const largura = botoes ? 440 : 320;
        const inicio = cursor;
        chao(largura);
        // O teto é alto demais para subir do chão; a porta ocupa a passagem de 50 px.
        obstaculos.push({ tipo: 'teto', x: inicio + (botoes ? 112 : 48), y: 330,
          width: botoes ? 216 : 224, height: 100 });
        mecanicas.push({ tipo: 'porta', x: inicio + largura / 2 - 12, ...porta });
        if (botoes) {
          for (const dx of [20, largura - 40]) {
            mecanicas.push({ tipo: 'botao', x: inicio + dx, alvo: porta.id });
          }
        }
        break;
      }
      case 'esmagadorNoTunel': {
        const inicio = cursor;
        chao(320);
        obstaculos.push({ tipo: 'teto', x: inicio + 60, y: 330, width: 200, height: 100 });
        mecanicas.push({ tipo: 'esmagador', x: inicio + 144, ancorado: true, ancora: 430 });
        break;
      }
      case 'planta':
        plantas.push({ id: `planta-${++inimigos}`, x: cursor, superficieY: CHAO, ...comDesafio(a) });
        chao(60);
        break;
      case 'patrulha':
        patrulhas.push({
          id: `sentinela-${++inimigos}`,
          inicioX: cursor + 10,
          fimX: cursor + a - 10,
          superficieY: CHAO,
          velocidade: 70,
          ...comDesafio(b),
        });
        chao(a);
        break;
      case 'checkpoint': {
        const extras = a ?? {};
        checkpoints.push({
          id: `${nome.replace(/\s+/g, '').toLowerCase()}-cp${checkpoints.length + 1}`,
          x: cursor, y: 416, width: 32, height: 64,
          posicaoSegura: { x: cursor - 5, y: 414 },
          totem: extras.missao !== undefined ? 'tela' : TOTENS[totens++ % TOTENS.length],
          ativo: false,
          ...(extras.missao !== undefined ? { missao: extras.missao } : {}),
        });
        chao(40);
        break;
      }
      case 'moeda':
        moedas.push({ id: `moeda-${moedas.length + 1}`, x: cursor + a, y: b ?? 430, coletado: false });
        break;
      case 'vida':
        vidasItens.push({ id: `vida-${vidasItens.length + 1}`, x: cursor + a, y: b ?? 448, coletado: false, ...comDesafio(c) });
        break;
      case 'computador':
        computadores.push({ x: cursor + (b ?? -72), desafio: a });
        break;
      case 'computadorTerminal':
        computadores.push({ x: cursor + (b ?? -72), missao: a, obrigatorio: true });
        break;
      case 'meta':
        meta = { x: cursor + 80, y: 416, width: 48, height: 64 };
        chao(240);
        break;
      default:
        throw new RangeError(`Trecho desconhecido: ${operacao}`);
    }
  }

  if (!meta) throw new RangeError(`A fase ${nome} precisa de uma meta.`);
  if (estiloPlataforma) {
    for (const obstaculo of obstaculos) {
      if (obstaculo.tipo === 'plataforma') obstaculo.estilo = estiloPlataforma;
    }
  }
  return {
    nome,
    subtitulo,
    titulo,
    texto,
    larguraFase: cursor,
    posicaoInicial: { x: 40, y: 414 },
    obstaculos,
    vaos,
    checkpoints,
    computadores,
    plantas,
    moedas,
    vidasItens,
    patrulhas,
    mecanicas,
    meta,
  };
}

// Percursos separados por checkpoints: preparação, obstáculo e recompensa.
// Os computadores ficam antes do seu alvo; os desvios altos guardam apenas bônus.
export const FASES_EXTRA = [
  construirFase({
    nome: 'Nível 02', subtitulo: 'Byte', titulo: 'Campo dos Cálculos',
    texto: 'Pratique input(), números e operações. Resolva os quatro exercícios obrigatórios para ligar a saída. Corações são opcionais.',
    itens: [
      ['moeda', 100, 440], ['moeda', 150, 440], ['chao', 280],
      ['moeda', 32, 424], ['moeda', 96, 424],
      ['mec', 'esteira', { dir: 1 }], ['mec', 'esteira', { dir: 1 }], ['chao', 260],
      ['checkpoint'], ['chao', 200], ['computador', 'F2-P1', -144],
      ['moeda', 80, 440], ['moeda', 192, 440], ['moeda', 304, 440],
      ['vao', 400, { desafio: 'F2-P1' }], ['chao', 260],
      ['computador', 'F2-M1', -144], ['planta', { desafio: 'F2-M1' }], ['chao', 180],
      ['plataforma', 128, 80], ['moeda', -104, 368], ['moeda', -68, 368],
      ['vida', -28, 368, { desafio: 'F2-V1' }], ['chao', 240],
      ['teto', 120], ['chao', 220], ['mec', 'drone'], ['chao', 240],
      ['checkpoint'], ['chao', 200],
      ['computador', 'F2-M2', -144], ['patrulha', 200, { desafio: 'F2-M2' }], ['chao', 240],
      // Cada margem fica a 156 px do elevador; atravessar exige pousar nele.
      ['moeda', 172, 386], ['travessia', 'elevador'], ['chao', 260],
      ['checkpoint'], ['chao', 160],
      ['moeda', 172, 395], ['travessia', 'quebradica', { base: 40 }], ['chao', 280],
      ['computadorTerminal', 2, -144], ['planta', { missao: 2 }], ['chao', 240], ['meta'],
    ],
  }),
  construirFase({
    nome: 'Nível 03', subtitulo: 'Byte', titulo: 'Vale das Decisões', estiloPlataforma: 'cristal',
    texto: 'Use if, else e comparações. Resolva os quatro exercícios obrigatórios. Explore os cristais para encontrar moedas e vidas.',
    itens: [
      ['moeda', 100, 440], ['moeda', 150, 440], ['cristal', 280],
      ['plataforma', 128, 90], ['moeda', -100, 358], ['moeda', -52, 358], ['chao', 260],
      ['computador', 'F3-M1', -144], ['patrulha', 200, { desafio: 'F3-M1' }], ['chao', 220],
      ['checkpoint'], ['chao', 160],
      ['moeda', 172, 395], ['travessia', 'quebradica', { base: 40 }], ['chao', 240],
      ['plataforma', 128, 80], ['moeda', -100, 368], ['vida', -36, 368, { desafio: 'F3-V1' }],
      ['chao', 300], ['moeda', 172, 416], ['travessia', 'holografico'], ['chao', 260],
      ['checkpoint'], ['chao', 200], ['computador', 'F3-P1', -144],
      ['moeda', 80, 440], ['moeda', 192, 440], ['moeda', 304, 440],
      ['vao', 400, { desafio: 'F3-P1' }], ['chao', 260],
      // O trampolim dá acesso ao desvio de 180 px, acima do pulo comum.
      ['mec', 'trampolim'], ['chao', 112], ['plataforma', 192, 180],
      ['vida', -136, 268, { desafio: 'F3-V2' }], ['moeda', -80, 268], ['moeda', -40, 268],
      ['chao', 300], ['computador', 'F3-M2', -144],
      ['patrulha', 200, { desafio: 'F3-M2' }], ['chao', 240],
      ['checkpoint'], ['chao', 200], ['computadorTerminal', 3, -144],
      ['passagemComPorta', { id: 'porta-3', missao: 3 }], ['chao', 200], ['meta'],
    ],
  }),
  construirFase({
    nome: 'Nível 04', subtitulo: 'Byte', titulo: 'Fábrica das Repetições', estiloPlataforma: 'metal',
    texto: 'Pratique for, range() e while. Observe cada máquina antes de avançar e complete os quatro exercícios obrigatórios.',
    itens: [
      ['moeda', 100, 440], ['moeda', 150, 440], ['chao', 280],
      ['esmagadorNoTunel'], ['moeda', -24, 440], ['chao', 260],
      ['computador', 'F4-M1', -144], ['planta', { desafio: 'F4-M1' }], ['chao', 220],
      ['checkpoint'], ['chao', 120], ['mec', 'ventilador'], ['chao', 64],
      // Só o vento permite alcançar esta recompensa a 140 px do chão.
      ['plataforma', 128, 140], ['moeda', -100, 308], ['vida', -36, 308, { desafio: 'F4-V1' }],
      ['chao', 320],
      ['passagemComPorta', { id: 'porta-a', botoes: true }], ['moeda', -16, 440], ['chao', 240],
      ['mec', 'laser'], ['chao', 240], ['checkpoint'], ['chao', 200],
      ['computador', 'F4-M2', -144], ['patrulha', 200, { desafio: 'F4-M2' }], ['chao', 260],
      ['computador', 'F4-P1', -144],
      ['moeda', 80, 440], ['moeda', 192, 440], ['moeda', 304, 440],
      ['vao', 400, { desafio: 'F4-P1' }], ['chao', 260],
      ['mec', 'esteira', { dir: 1 }], ['mec', 'esteira', { dir: 1 }],
      ['chao', 200], ['mec', 'cabo'], ['chao', 240],
      ['vida', 80, 448, { desafio: 'F4-V2' }], ['chao', 220],
      ['checkpoint'], ['chao', 200], ['computadorTerminal', 4, -144],
      ['passagemComPorta', { id: 'porta-4', missao: 4 }], ['chao', 200], ['meta'],
    ],
  }),
  construirFase({
    nome: 'Nível 05', subtitulo: 'Byte', titulo: 'Revisão Final',
    texto: 'Combine o que aprendeu, incluindo and e or. Complete os quatro exercícios obrigatórios para ativar a saída e enfrentar o Kernel Panic.',
    itens: [
      ['moeda', 100, 440], ['moeda', 150, 440], ['chao', 280],
      ['mec', 'fios'], ['moeda', 48, 440], ['chao', 260],
      ['computador', 'F5-M1', -144], ['planta', { desafio: 'F5-M1' }], ['chao', 240],
      ['checkpoint'], ['chao', 160], ['mec', 'drone'], ['chao', 260],
      ['computador', 'F5-P1', -144],
      ['moeda', 80, 440], ['moeda', 192, 440], ['moeda', 304, 440],
      ['vao', 400, { desafio: 'F5-P1' }], ['chao', 240],
      ['plataforma', 128, 80], ['moeda', -100, 368], ['vida', -36, 368, { desafio: 'F5-V1' }],
      ['chao', 300], ['moeda', 172, 416], ['travessia', 'holografico'], ['chao', 260],
      ['checkpoint'], ['chao', 200],
      ['computador', 'F5-M2', -144], ['patrulha', 200, { desafio: 'F5-M2' }], ['chao', 240],
      ['moeda', 24, 424], ['moeda', 88, 424], ['moeda', 152, 424],
      ['mec', 'esteira', { dir: -1 }], ['mec', 'esteira', { dir: -1 }], ['mec', 'esteira', { dir: -1 }],
      ['chao', 240], ['esmagadorNoTunel'], ['chao', 240],
      ['checkpoint'], ['chao', 160],
      ['moeda', 172, 395], ['travessia', 'quebradica', { base: 40 }], ['chao', 260],
      ['mec', 'laser'], ['chao', 240], ['vida', 80, 448, { desafio: 'F5-V2' }], ['chao', 240],
      ['computadorTerminal', 5, -144], ['passagemComPorta', { id: 'porta-5', missao: 5 }],
      ['chao', 200], ['meta'],
    ],
  }),
];
