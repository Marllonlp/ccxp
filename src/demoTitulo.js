// Cena de demonstração da tela de título: o cenário rola e o Byte corre no lugar. Obstáculos
// do pacote obstaculos_mecanicas_pacote aparecem em sequência, e o Byte age sobre eles:
// pula por cima, abaixa para passar e pousa em cima das superfícies. Desenhada em 480 × 270
// pixels, ampliada pelo CSS com pixel nítido, como as outras telas.
import { byteSprites as byte } from './player.js';

const PASTA_MECANICAS = './assets/characters/Imagens_Personagens/02_cenario/obstaculos_mecanicas_pacote/';

// Tudo em pixels da tela 480 × 270, na mesma escala da fase (o Byte usa 0,72 do sprite de 96 px).
const LARGURA = 480;
const ALTURA = 270;
const LINHA_CHAO = 210;            // superfície do chão do título (grama)
const ESCALA_BYTE = 0.72;
const TAMANHO_BYTE = 96 * ESCALA_BYTE;
const LINHA_PES_BYTE = 94;         // linha dos pés no sprite de 96 px
const CENTRO_BYTE = 58;            // centro visível do Byte no eixo x
const META_LARGURA_BYTE = 17;      // metade da largura visível do Byte
const VELOCIDADE = 110;            // px/s: cenário e obstáculos andam nessa velocidade
const GRAVIDADE = 600;
const ALTURA_PULO = 100;
const VELOCIDADE_PULO = Math.sqrt(2 * GRAVIDADE * ALTURA_PULO);
const TEMPO_ATE_TOPO = VELOCIDADE_PULO / GRAVIDADE;
const IMPULSO_TRAMPOLIM = 1.05;    // o guia pede 1,5×; aqui o impulso é menor para caber na tela
const ESPACO_MINIMO = 230;
const ESPACO_MAXIMO = 320;
const ALTURA_CABECA = 56;          // parte de baixo dos perigos de abaixar, em px do chão
const MARGEM_ABAIXAR = 22;         // quanto antes do obstáculo o Byte já se abaixa
const INTERVALO_QUADRO = 150;      // ms por quadro das animações
const FATORES = { montanhas: 0.1, cidade: 0.25, floresta: 0.5, chao: 1 };

// Tipos de obstáculo do pacote. `acao` diz o que o Byte faz diante dele.
const TIPOS = [
  // Pular por cima: perigos no chão (tocar = dano).
  { acao: 'pular', arquivo: 'pular_fios_desencapados_32x14_4f.png', largura: 32, altura: 14 },
  { acao: 'pular', arquivo: 'pular_poca_eletrica_48x10_4f.png', largura: 48, altura: 10 },
  { acao: 'pular', arquivo: 'pular_bomba_logica_20x20_4f.png', largura: 20, altura: 20 },
  // Abaixar para passar: perigos na altura da cabeça.
  { acao: 'abaixar', arquivo: 'abaixar_drone_patrulha_36x22_4f.png', largura: 36, altura: 22 },
  { acao: 'abaixar', arquivo: 'abaixar_laser_cabeca_64x56_4f.png', largura: 64, altura: 56 },
  { acao: 'abaixar', arquivo: 'abaixar_cabo_pendurado_24x44_4f.png', largura: 24, altura: 44 },
  // Andar em cima: superfícies sólidas. `tipo` marca o comportamento especial.
  { acao: 'subir', arquivo: 'andar_em_cima_caixa_tech_32x32_4f.png', largura: 32, altura: 32 },
  { acao: 'subir', arquivo: 'andar_em_cima_esteira_64x16_4f.png', largura: 64, altura: 16 },
  { acao: 'subir', arquivo: 'andar_em_cima_plataforma_quebradica_48x16_4f.png', largura: 48, altura: 16, tipo: 'quebradica' },
  { acao: 'subir', arquivo: 'andar_em_cima_trampolim_24x24_4f.png', largura: 24, altura: 24, tipo: 'trampolim' },
  { acao: 'subir', arquivo: 'andar_em_cima_bloco_holografico_32x32_4f.png', largura: 32, altura: 32, tipo: 'holografico' },
  { acao: 'subir', arquivo: 'andar_em_cima_elevador_48x20_4f.png', largura: 48, altura: 20, tipo: 'elevador' },
];

function carregarImagem(caminho) {
  const imagem = new Image();
  imagem.src = caminho;
  return imagem;
}

function pronta(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

// Imagens dos tipos, carregadas uma vez.
const modelos = TIPOS.map((tipo) => ({ ...tipo, imagem: carregarImagem(PASTA_MECANICAS + tipo.arquivo) }));

/** Altura da base do obstáculo acima do chão, no instante `agora` (ms). */
function baseEm(obstaculo, agora) {
  if (obstaculo.acao === 'abaixar') return ALTURA_CABECA;
  if (obstaculo.tipo === 'elevador') {
    // Sobe e desce 30 px em 2 s.
    return 20 + 15 * (1 - Math.cos(Math.PI * agora / 1000));
  }
  return 0;
}

/** Quadro da animação da plataforma quebradiça: 0 a 3, conforme o tempo desde que foi pisada. */
function quadroQuebradica(obstaculo, agora) {
  if (!obstaculo.pisadaEm) return 0;
  return Math.min(3, Math.floor((agora - obstaculo.pisadaEm) / 200));
}

/** Verdadeiro se o obstáculo ainda é sólido agora (quebradiça some ao quebrar; holográfico pisca). */
function solidoEm(obstaculo, agora) {
  if (obstaculo.tipo === 'quebradica') {
    return !obstaculo.pisadaEm || agora - obstaculo.pisadaEm < 600;
  }
  if (obstaculo.tipo === 'holografico') {
    // Ciclo de 4 s: sólido 1,5 s, pisca 0,5 s, desligado 1,5 s, pisca 0,5 s.
    const t = (agora / 1000) % 4;
    return !(t >= 2 && t < 3.5);
  }
  return true;
}

/** Topo sólido do obstáculo (altura em px do chão), ou null se não é superfície. */
function topoEm(obstaculo, agora) {
  if (obstaculo.acao !== 'subir') return null;
  const base = baseEm(obstaculo, agora);
  return base + obstaculo.altura;
}

/** Quadro da animação de um obstáculo agora. */
function quadroEm(obstaculo, agora) {
  if (obstaculo.tipo === 'quebradica') return quadroQuebradica(obstaculo, agora);
  if (obstaculo.tipo === 'holografico') {
    const t = (agora / 1000) % 4;
    if (t < 1.5) return 0;
    if (t < 2) return 1;
    if (t < 3.5) return 2;
    return 3;
  }
  return Math.floor(agora / INTERVALO_QUADRO) % 4;
}

/**
 * Cria a cena no `canvas` e move as camadas de fundo (elementos com a classe da camada).
 * Só anima enquanto o canvas estiver visível, para não gastar processamento em outras telas.
 */
export function iniciarDemoTitulo(canvas, camadas) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let distanciaCamera = 0;
  let altura = 0;
  let velocidadeVertical = 0;
  let pulando = false;
  let obstaculos = [];
  let proximoEspaco = 0;
  let ultimoTempo = null;

  function criarObstaculo(x) {
    const modelo = modelos[Math.floor(Math.random() * modelos.length)];
    return { ...modelo, x, tratado: false, pisadaEm: null };
  }

  function pular(velocidade, obstaculo) {
    pulando = true;
    velocidadeVertical = velocidade;
    if (obstaculo) obstaculo.tratado = true;
  }

  /** Verdadeiro se o Byte está sobre o obstáculo no eixo x. */
  function sobreByte(obstaculo) {
    return obstaculo.x + obstaculo.largura > CENTRO_BYTE - META_LARGURA_BYTE
      && obstaculo.x < CENTRO_BYTE + META_LARGURA_BYTE;
  }

  function atualizar(dt, agora) {
    distanciaCamera += VELOCIDADE * dt;

    // Obstáculos entram pela direita, andam para a esquerda e saem da tela.
    for (const obstaculo of obstaculos) obstaculo.x -= VELOCIDADE * dt;
    obstaculos = obstaculos.filter((obstaculo) => obstaculo.x + obstaculo.largura > -10);
    proximoEspaco -= VELOCIDADE * dt;
    if (proximoEspaco <= 0) {
      obstaculos.push(criarObstaculo(LARGURA + 10));
      proximoEspaco = ESPACO_MINIMO + Math.random() * (ESPACO_MAXIMO - ESPACO_MINIMO);
    }

    // Decisões do Byte, só quando ele está no chão.
    if (!pulando && altura === 0) {
      for (const obstaculo of obstaculos) {
        if (obstaculo.tratado) continue;
        const centro = obstaculo.x + obstaculo.largura / 2;
        const distancia = centro - CENTRO_BYTE;
        if (obstaculo.acao === 'pular' && distancia > 0 && distancia <= VELOCIDADE * TEMPO_ATE_TOPO) {
          pular(VELOCIDADE_PULO, obstaculo);
          break;
        }
        if (obstaculo.acao === 'subir' && distancia > 0) {
          const topo = topoEm(obstaculo, agora);
          // Tempo até o Byte cair sobre o topo: subida até o ponto mais alto e queda até o topo.
          const tempoPouso = TEMPO_ATE_TOPO + Math.sqrt(2 * Math.max(0, ALTURA_PULO - topo) / GRAVIDADE);
          if (distancia <= VELOCIDADE * tempoPouso) {
            pular(VELOCIDADE_PULO, obstaculo);
            break;
          }
        }
      }
    }

    if (pulando || altura > 0) {
      const alturaAnterior = altura;
      velocidadeVertical -= GRAVIDADE * dt;
      altura += velocidadeVertical * dt;

      if (velocidadeVertical <= 0) {
        // Pouso: o topo mais alto sob o Byte que foi cruzado nesta queda.
        let topoPouso = null;
        let alvo = null;
        for (const obstaculo of obstaculos) {
          if (obstaculo.acao !== 'subir' || !solidoEm(obstaculo, agora) || !sobreByte(obstaculo)) continue;
          const topo = topoEm(obstaculo, agora);
          if (alturaAnterior >= topo - 0.001 && altura <= topo && (topoPouso === null || topo > topoPouso)) {
            topoPouso = topo;
            alvo = obstaculo;
          }
        }

        if (alvo) {
          altura = topoPouso;
          if (alvo.tipo === 'trampolim') {
            // Trampolim: o Byte é lançado de novo, com impulso reduzido.
            velocidadeVertical = VELOCIDADE_PULO * IMPULSO_TRAMPOLIM;
            pulando = true;
          } else {
            velocidadeVertical = 0;
            pulando = false;
          }
          if (alvo.tipo === 'quebradica' && !alvo.pisadaEm) alvo.pisadaEm = agora;
        } else if (altura <= 0) {
          altura = 0;
          velocidadeVertical = 0;
          pulando = false;
        }
      }
    }

    // Quem estava sobre uma superfície que saiu de baixo do Byte começa a cair.
    if (!pulando && altura > 0) {
      const apoiado = obstaculos.some((obstaculo) => obstaculo.acao === 'subir'
        && solidoEm(obstaculo, agora) && sobreByte(obstaculo)
        && Math.abs(topoEm(obstaculo, agora) - altura) < 0.5);
      if (!apoiado) {
        pulando = true;
        velocidadeVertical = 0;
      }
    }

    // Camadas de fundo: cada uma anda numa velocidade própria.
    for (const [nome, elemento] of Object.entries(camadas)) {
      const deslocamento = distanciaCamera * FATORES[nome];
      elemento.style.backgroundPosition = `${(-deslocamento * 100 / LARGURA).toFixed(3)}cqw bottom`;
    }
  }

  /** Verdadeiro quando o Byte precisa estar agachado agora (há um perigo de cabeça sobre ele). */
  function precisaAbaixar() {
    if (pulando || altura > 0) return false;
    return obstaculos.some((obstaculo) => obstaculo.acao === 'abaixar'
      && Math.abs(obstaculo.x + obstaculo.largura / 2 - CENTRO_BYTE) < obstaculo.largura / 2 + MARGEM_ABAIXAR);
  }

  function desenhar(agora) {
    ctx.clearRect(0, 0, LARGURA, ALTURA);

    for (const obstaculo of obstaculos) {
      if (!pronta(obstaculo.imagem)) continue;
      if (obstaculo.tipo === 'quebradica' && obstaculo.pisadaEm && agora - obstaculo.pisadaEm >= 600) continue;
      const quadro = quadroEm(obstaculo, agora);
      const larguraQuadro = obstaculo.imagem.naturalWidth / 4;
      const base = baseEm(obstaculo, agora);
      ctx.drawImage(obstaculo.imagem, quadro * larguraQuadro, 0, larguraQuadro, obstaculo.altura,
        Math.round(obstaculo.x), Math.round(LINHA_CHAO - base - obstaculo.altura),
        obstaculo.largura, obstaculo.altura);
    }

    let estado = 'correndo';
    if (pulando) estado = velocidadeVertical > 0 ? 'pulando' : 'caindo';
    else if (precisaAbaixar()) estado = 'agachado';
    const dx = Math.round(CENTRO_BYTE - 54 * ESCALA_BYTE);
    const dy = Math.round(LINHA_CHAO - altura - LINHA_PES_BYTE * ESCALA_BYTE);
    byte[estado].desenhar(ctx, agora / 1000, dx, dy, TAMANHO_BYTE, TAMANHO_BYTE);
  }

  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (!canvas.offsetParent) {
      ultimoTempo = null;
      return;
    }
    const dt = ultimoTempo === null ? 0 : Math.min((agora - ultimoTempo) / 1000, 0.05);
    ultimoTempo = agora;
    atualizar(dt, agora);
    desenhar(agora);
  }

  requestAnimationFrame(quadro);
}
