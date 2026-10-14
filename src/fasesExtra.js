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
//   ['planta', extras?]                 planta (inimigo) no chão, com 60 px de chão
//   ['patrulha', largura, extras?]      sentinela patrulhando o chão deste trecho
//   ['checkpoint', extras?]             totem no cursor; extras.missao abre um terminal
//   ['moeda', dx, y] / ['vida', dx, y, extras?]  coletáveis (dx em relação ao cursor; y em px do mundo)
//   extras.desafio (vão, planta, patrulha e vida): id de uma pergunta de bancoDesafios.js
//   ['meta']                            ponto de chegada: tocar conclui a fase
//
// Regras de desenho (base do Mario Bros, adaptadas ao Byte):
//  - cada perigo novo aparece sozinho num trecho de chão antes de se combinar com outros;
//  - perigos de cabeça têm 200 px de chão antes, para o jogador ver e agachar a tempo;
//  - depois de um vão ou de um perigo de chão há pelo menos 200 px de chão para pousar;
//  - plantas ficam encostadas num bloco (como um cano), e sentinelas em trechos de chão reto;
//  - moedas formam arcos sobre vãos e saltos, e vidas ficam depois de trechos difíceis;
//  - um checkpoint fica em chão calmo, antes da parte difícil.
//
// Plataformas suspensas (pulo de ~104 px, Byte com 40 × 66 px, plataformas sólidas por baixo):
//  - andares a 90, 170 e 210/230 px do chão: sobe-se até 80 px por vez, e a de 90 px não barra quem anda embaixo;
//  - entre andares diferentes há pelo menos 48 px na horizontal, para a cabeça não bater na de cima;
//  - nada fica baixo sobre caixas, esteiras, ventiladores, trampolins ou elevadores (o Byte sobe com eles);
//  - moedas ficam 30 px acima do topo da plataforma.
import { LARGURAS } from './mecanicas.js';

const CHAO = 480;
const TOTENS = ['tela', 'obelisco', 'terminal', 'antena'];

/** Monta uma fase a partir da lista de trechos. */
export function construirFase({ nome, subtitulo, titulo, texto, itens, estiloPlataforma }) {
  let cursor = 0;
  const obstaculos = [];
  const vaos = [];
  const checkpoints = [];
  const mecanicas = [];
  const plantas = [];
  const patrulhas = [];
  const moedas = [];
  const vidasItens = [];
  let meta = null;
  let totens = 0;
  let inimigos = 0;

  // Pergunta do banco de desafios ligada ao elemento, quando houver.
  const comDesafio = (extras) => (extras?.desafio ? { desafio: extras.desafio } : {});

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
      case 'esmagadorNaPlataforma': {
        // Plataforma com um pistão preso embaixo: o vão entre o chão e a plataforma tem 56 px.
        const largura = a ?? 140;
        const inicio = cursor;
        chao(largura);
        obstaculos.push({ tipo: 'plataforma', x: inicio, y: CHAO - 76, width: largura, height: 20 });
        mecanicas.push({ tipo: 'esmagador', x: inicio + largura / 2 - 16, dx: 0, ancorado: true, ancora: CHAO - 56 });
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
          totem: TOTENS[totens++ % TOTENS.length],
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
      case 'meta':
        meta = { x: cursor, y: 416, width: 32, height: 64 };
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
    larguraFase: cursor + 160,
    posicaoInicial: { x: 40, y: 414 },
    obstaculos,
    vaos,
    checkpoints,
    plantas,
    moedas,
    vidasItens,
    patrulhas,
    mecanicas,
    meta,
  };
}

export const FASES_EXTRA = [
  // Nível 2: Campo de bichos. Começa com uma esteira e uma escada de caixas (diferente da fase 1),
  // tem plataformas flutuantes em alturas variadas, plantas encostadas em caixas (como canos),
  // e termina com uma passagem de quebradiça, holográfico e trampolim.
  construirFase({
    nome: 'Nível 02',
    subtitulo: 'Byte',
    titulo: 'Campo dos Cálculos',
    texto: 'Ler o que o jogador digita com input(), virar número com int() e fazer contas com + - * /. A porta só abre com a missão 2.',
    itens: [
      // Início: esteira empurrando para a direita, moedas, e uma escada de caixas até uma plataforma alta.
      ['chao', 200],
      ['mec', 'esteira', { dir: 1 }], ['chao', 100],
      ['moeda', 40, 400], ['moeda', 80, 400],
      ['mec', 'caixa', { blocos: 1 }], ['mec', 'caixa', { blocos: 2 }], ['chao', 40],
      ['plataforma', 120, 120], ['moeda', 30, 330], ['moeda', 70, 300],
      ['chao', 40],
      ['checkpoint', { missao: 2 }],
      // Vão sem bloco no meio.
      ['vao', 100, { desafio: 'F2-P1' }],
      // Teto para agachar e drone de cabeça com espaço antes.
      ['chao', 200], ['teto', 160], ['chao', 200],
      ['mec', 'drone'], ['chao', 200],
      // Planta encostada numa caixa (como um cano) e uma plataforma flutuante com moeda.
      ['mec', 'caixa', { blocos: 1 }], ['planta', { desafio: 'F2-M1' }], ['chao', 200],
      ['plataforma', 120, 110], ['moeda', 40, 360], ['chao', 120],
      // Escada de caixas e a porta que abre com a missão 2.
      ['mec', 'caixa', { blocos: 1 }], ['mec', 'caixa', { blocos: 1 }], ['mec', 'caixa', { blocos: 2 }], ['chao', 100],
      ['mec', 'porta', { id: 'porta-2', missao: 2 }], ['chao', 180],
      // Cristal com sentinela, e vão com elevador no meio.
      ['cristal', 200],
      ['patrulha', 160, { desafio: 'F2-M2' }], ['chao', 80],
      ['vao', 40], ['mec', 'elevador', { sobreVao: true }], ['vao', 60],
      ['chao', 180],
      ['mec', 'fios'], ['chao', 160],
      // Plataforma quebradiça sobre um pequeno vão, e um holográfico entre dois vãos.
      ['mec', 'quebradica', { base: 40, sobreVao: true }], ['vao', 60], ['chao', 180],
      ['vao', 40], ['mec', 'holografico', { sobreVao: true }], ['vao', 40],
      ['chao', 160],
      ['checkpoint'],
      // Final: trampolim para uma plataforma alta com uma vida, uma caixa dupla com planta, e a meta.
      ['mec', 'trampolim'], ['chao', 80],
      ['plataforma', 120, 150], ['vida', 40, 330, { desafio: 'F2-V1' }], ['chao', 120],
      ['mec', 'caixa', { blocos: 2 }], ['planta', { desafio: 'F2-M3' }], ['chao', 200],
      ['meta'],
    ],
  }),

  // Nível 3: Plataformas dinâmicas. Caixas e esteiras, depois plataformas que quebram, quicam,
  // somem e sobem. A porta do fim abre quando o jogador resolve a missão 3 no totem antes dela.
  construirFase({
    nome: 'Nível 03',
    subtitulo: 'Byte',
    titulo: 'Vale das Decisões',
    texto: 'Tomar decisões com if e else, comparando valores com >, <, >= e ==. As plataformas mudam, e a porta só abre com a missão 3.',
    estiloPlataforma: 'cristal',
    itens: [
      // Trecho de cristal: uma escadinha de cristais com moedas logo no início.
      ['suspensa', 90, 90, 96], ['moeda', 130, 360],
      ['suspensa', 240, 170, 64], ['moeda', 248, 280], ['moeda', 276, 280],
      ['cristal', 300],
      ['moeda', 120, 400], ['moeda', 170, 360],
      // Primeira caixa (sobe um degrau), e uma ponte alta de cristal sobre a esteira.
      ['mec', 'caixa', { blocos: 1 }],
      ['suspensa', 104, 90, 48],
      ['suspensa', 220, 170, 96], ['moeda', 232, 280], ['moeda', 260, 280], ['moeda', 288, 280],
      ['chao', 200],
      // Esteira que empurra para a direita, seguida de chão e de uma sentinela.
      ['mec', 'esteira', { dir: 1 }], ['chao', 200],
      // Um caminho por cima da sentinela, para quem desce da ponte.
      ['suspensa', -6, 90, 128], ['moeda', 34, 360], ['moeda', 74, 360],
      ['patrulha', 180, { desafio: 'F3-M1' }], ['chao', 80],
      // Plataforma quebradiça sobre um vão: o jogador precisa pular para fora dela.
      ['checkpoint'],
      ['mec', 'quebradica', { base: 40, sobreVao: true }],
      ['vao', 110], ['chao', 200],
      // Trampolim: lança para cima, em direção a uma plataforma alta com uma vida.
      ['mec', 'trampolim'], ['chao', 90],
      ['plataforma', 120, 150], ['vida', 20, 330, { desafio: 'F3-V1' }],
      // Mais um andar acima da plataforma alta, com moedas de prêmio.
      ['suspensa', 48, 230, 80], ['moeda', 64, 220], ['moeda', 96, 220],
      ['chao', 160],
      // Dois vãos com um bloco holográfico no meio (liga e desliga).
      ['vao', 80],
      ['mec', 'holografico', { sobreVao: true }],
      ['vao', 80], ['chao', 200],
      // Elevador sobre um vão: sobe e desce, leva o jogador junto.
      ['mec', 'elevador', { sobreVao: true }],
      ['vao', 120], ['chao', 200],
      // Esteira que empurra para o esmagador: o timing é a combinação do guia.
      ['mec', 'esteira', { dir: 1 }], ['chao', 40],
      ['esmagadorNaPlataforma', 140],
      // Depois do esmagador, dois cristais em escada até o checkpoint.
      ['suspensa', 48, 90, 96],
      ['suspensa', 192, 170, 64], ['moeda', 204, 280], ['moeda', 232, 280],
      ['chao', 240],
      ['checkpoint'],
      // Caixas empilhadas (duas) como escada de jogo; moedas em arco sobre o vão.
      ['mec', 'caixa', { blocos: 2 }],
      // Escada de cristais que termina sobre a água: dá para atravessar o vão por cima.
      ['suspensa', 56, 90, 80],
      ['suspensa', 184, 170, 64], ['moeda', 208, 280],
      ['chao', 200],
      ['moeda', 40, 400], ['moeda', 80, 360], ['moeda', 120, 400],
      ['vao', 110, { desafio: 'F3-P1' }], ['chao', 220],
      // Ventilador empurra o jogador para uma plataforma alta.
      ['mec', 'ventilador'], ['chao', 40],
      ['plataforma', 110, 130],
      // O vento leva à plataforma; dela, mais um andar com uma fileira de moedas.
      ['suspensa', 48, 210, 96], ['moeda', 64, 240], ['moeda', 88, 240], ['moeda', 112, 240],
      ['chao', 200],
      // Sentinela sobre o chão reto (com um caminho de cristal por cima), e uma planta encostada num bloco.
      ['suspensa', 24, 90, 128], ['moeda', 74, 360], ['moeda', 104, 360],
      ['patrulha', 180, { desafio: 'F3-M2' }], ['chao', 80],
      ['bloco', 60, 40], ['planta'], ['chao', 200],
      // Cadeia de plataformas: trampolim de novo, depois uma plataforma com moedas.
      ['mec', 'trampolim'], ['chao', 80],
      ['plataforma', 120, 150], ['moeda', 30, 330], ['moeda', 60, 300],
      // Da plataforma alta, um cristal à direita e um degrau sobre a água.
      ['suspensa', 96, 170, 80], ['moeda', 112, 280], ['moeda', 144, 280],
      ['suspensa', 232, 90, 64],
      ['chao', 200],
      ['vao', 100], ['chao', 200],
      // Porta: a missão 3 é resolvida no totem logo antes dela.
      ['checkpoint', { missao: 3 }],
      ['mec', 'porta', { id: 'porta-3', missao: 3 }], ['chao', 200],
      ['vida', 60, 380, { desafio: 'F3-V2' }],
      // Escadaria final de blocos, como no início de cada fase do Mario.
      ['bloco', 100, 40], ['bloco', 100, 80],
      ['meta'],
    ],
  }),

  // Nível 4: Máquinas. Esmagador com timing, ventilador que sobe, porta com botão, laser e cabo.
  construirFase({
    nome: 'Nível 04',
    subtitulo: 'Byte',
    titulo: 'Fábrica das Repetições',
    texto: 'Repetir código com for e range(), e com while enquanto a condição valer. Calcule a batida do esmagador e use o vento.',
    estiloPlataforma: 'metal',
    itens: [
      // Chão seguro com uma escadinha de metal e moedas, e o primeiro esmagador sozinho.
      ['suspensa', 80, 90, 80], ['moeda', 112, 360],
      ['suspensa', 208, 170, 64], ['moeda', 216, 280], ['moeda', 244, 280],
      ['chao', 280],
      ['moeda', 100, 350],
      ['esmagadorNaPlataforma', 140],
      ['suspensa', 50, 90, 96],
      ['chao', 220],
      // Planta encostada num bloco (com uma passarela alta por cima) e outro esmagador.
      ['suspensa', 50, 170, 80], ['moeda', 62, 280], ['moeda', 94, 280],
      ['suspensa', 178, 90, 64], ['moeda', 202, 360],
      ['bloco', 60, 40], ['planta', { desafio: 'F4-M1' }], ['chao', 200],
      ['esmagadorNaPlataforma', 140],
      ['suspensa', 40, 90, 96], ['moeda', 80, 360],
      ['chao', 200],
      ['checkpoint', { missao: 4 }],
      // Ventilador e uma plataforma que o vento alcança.
      ['mec', 'ventilador'], ['chao', 40],
      ['plataforma', 110, 90],
      ['suspensa', 48, 170, 80], ['moeda', 64, 280], ['moeda', 96, 280],
      ['chao', 180],
      // Botão no chão e porta logo depois: o jogador pisa no botão e corre.
      ['mec', 'botao', { alvo: 'porta-a' }], ['chao', 90],
      ['mec', 'porta', { id: 'porta-a' }], ['chao', 200],
      // Laser sozinho, depois cabo pendurado.
      ['mec', 'laser'],
      // Passarela de metal que passa por cima do cabo.
      ['suspensa', 50, 90, 96],
      ['suspensa', 194, 170, 80], ['moeda', 210, 280], ['moeda', 242, 280],
      ['chao', 220],
      ['mec', 'cabo'], ['chao', 200],
      ['checkpoint'],
      // Sentinela num trecho reto (com passarela por cima), depois a esteira de volta a direita.
      ['suspensa', 36, 90, 128], ['moeda', 76, 360], ['moeda', 116, 360],
      ['patrulha', 200, { desafio: 'F4-M2' }], ['chao', 80],
      ['mec', 'esteira', { dir: 1 }],
      ['suspensa', 42, 90, 80],
      ['suspensa', 170, 170, 64], ['moeda', 194, 280],
      ['chao', 180],
      // Moedas em arco sobre um vão e um elevador que sobe.
      ['moeda', 30, 400], ['moeda', 60, 360], ['moeda', 90, 400],
      ['vao', 100, { desafio: 'F4-P1' }], ['chao', 180],
      ['mec', 'elevador', { sobreVao: true }],
      ['vao', 100],
      // Escada de metal sobre o bloco da planta.
      ['suspensa', 44, 90, 96],
      ['suspensa', 188, 170, 80], ['moeda', 204, 280], ['moeda', 236, 280],
      ['suspensa', 316, 90, 80],
      ['chao', 200],
      // Segundo botão: uma porta mais longe, com uma planta encostada num bloco.
      ['bloco', 60, 40], ['planta'], ['chao', 180],
      ['mec', 'botao', { alvo: 'porta-b' }], ['chao', 100],
      ['mec', 'porta', { id: 'porta-b' }],
      ['suspensa', 60, 90, 96], ['moeda', 100, 360],
      ['chao', 200],
      ['checkpoint'],
      // Esmagador, ventilador e a subida final de trampolim e plataforma alta.
      ['esmagadorNaPlataforma', 140],
      ['suspensa', 40, 90, 96], ['moeda', 80, 360],
      ['chao', 180],
      ['mec', 'ventilador'], ['chao', 40],
      ['plataforma', 110, 90], ['chao', 120],
      ['mec', 'trampolim'], ['chao', 100],
      ['plataforma', 120, 150], ['vida', 40, 330, { desafio: 'F4-V1' }],
      // O último andar, acima da plataforma alta.
      ['suspensa', 48, 230, 80], ['moeda', 64, 220], ['moeda', 96, 220],
      ['chao', 140],
      ['mec', 'quebradica', { base: 40, sobreVao: true }],
      ['vao', 110], ['chao', 200],
      // Sentinela no chão reto antes da escadaria final, com uma passarela por cima.
      ['suspensa', 16, 90, 128], ['moeda', 56, 360], ['moeda', 96, 360],
      ['patrulha', 160], ['chao', 80],
      ['vida', 60, 380, { desafio: 'F4-V2' }],
      ['bloco', 100, 40], ['bloco', 100, 80],
      ['meta'],
    ],
  }),

  // Nível 5: Desafio final. Todas as mecânicas, mais perigos e a última porta com missão 5.
  construirFase({
    nome: 'Nível 05',
    subtitulo: 'Byte',
    titulo: 'Revisão Final',
    texto: 'Revisão de tudo, mais os operadores lógicos and e or. Todas as mecânicas juntas: resolva a missão 5 para abrir a última porta.',
    itens: [
      // Abertura com moedas e uma caixa dupla.
      ['chao', 240],
      ['moeda', 120, 400], ['moeda', 170, 360], ['moeda', 220, 400],
      ['mec', 'caixa', { blocos: 2 }], ['chao', 200],
      // Fios sozinhos e depois uma planta encostada num bloco.
      ['mec', 'fios'], ['chao', 200],
      ['bloco', 60, 40], ['planta', { desafio: 'F5-M1' }], ['chao', 200],
      ['checkpoint'],
      // Drone e botão com porta: o jogador desvia do drone, pisa no botão e passa.
      ['mec', 'drone'], ['chao', 200],
      ['mec', 'botao', { alvo: 'f-porta' }], ['chao', 90],
      ['mec', 'porta', { id: 'f-porta' }], ['chao', 200],
      // Bloco holográfico entre dois vãos, sobre a água.
      ['vao', 90, { desafio: 'F5-P1' }],
      ['mec', 'holografico', { sobreVao: true }],
      ['vao', 90], ['chao', 200],
      // Quebradiça e trampolim: o trampolim lança para uma plataforma alta com uma vida.
      ['mec', 'quebradica', { base: 40, sobreVao: true }],
      ['vao', 100], ['chao', 180],
      ['mec', 'trampolim'], ['chao', 80],
      ['plataforma', 120, 150], ['vida', 20, 330, { desafio: 'F5-V1' }], ['chao', 140],
      ['checkpoint'],
      // Ventilador que sobe para uma plataforma e sentinela no chão reto.
      ['mec', 'ventilador'], ['chao', 40],
      ['plataforma', 110, 90], ['chao', 80],
      ['patrulha', 180, { desafio: 'F5-M2' }], ['chao', 60],
      // Esteira empurrando para o esmagador, com chão entre os dois.
      ['mec', 'esteira', { dir: 1 }], ['chao', 40],
      ['esmagadorNaPlataforma', 140], ['chao', 200],
      ['checkpoint'],
      // Laser sozinho, depois poça com elevador sobre o vão.
      ['mec', 'laser'], ['chao', 220],
      ['bloco', 60, 40], ['planta'], ['chao', 200],
      ['mec', 'poca'], ['chao', 200],
      ['vao', 100],
      ['mec', 'elevador', { sobreVao: true }],
      ['vao', 90], ['chao', 200],
      // Teto, depois cabo e bomba com chão para pousar.
      ['teto', 180], ['chao', 200],
      ['mec', 'cabo'], ['chao', 200],
      ['patrulha', 160], ['chao', 80],
      ['mec', 'bomba'], ['chao', 200],
      ['moeda', 40, 360], ['moeda', 100, 340], ['moeda', 160, 360],
      ['vida', 80, 320, { desafio: 'F5-V2' }],
      // Escadaria final de blocos, cristal e a última porta com missão 5.
      ['bloco', 100, 40], ['bloco', 100, 80], ['bloco', 100, 120],
      ['cristal', 160],
      ['checkpoint', { missao: 5 }],
      ['mec', 'porta', { id: 'f-porta-2', missao: 5 }], ['chao', 200],
      ['meta'],
    ],
  }),
];
