// Tutorial da ADA no começo de cada nível.
// Desenhado em 480 × 270, como a cutscene da intro, cuja fonte e máquina de escrever são reaproveitadas.
// Falas, código de exemplo e destaques vêm de assets/ada/tutoriais.json.
import { carregarFonte, escrever, quebrar } from './cutscene.js';

const LARGURA = 480;
const ALTURA = 270;
const LETRAS_POR_SEGUNDO = 50;
const TEMPO_SAIDA_MS = 300;
const FADE_PAINEL_MS = 300;

const BYTE = { x: 120, y: 167 };
const ADA = { x: 182, y: 128 };
const OLHO_ADA = { x: 198, y: 140 };
const PAINEL = { x: 236, y: 110, largura: 220, altura: 96 };
const FLUTUAR = { amplitude: 2, periodo: 1200 };

const COR_TEXTO = '#FFFFFF';
const COR_NOME = { ADA: '#5AFFB4', BYTE: '#FFD646' };
const COR_AMARELO = '#FFD646';
const COR_CINZA = '#8C92A6';
const COR_FEIXE = '#78F0FF';
const COR_NUMERO_LINHA = '#5A96B4';
const COR_TITULO_PAINEL = '#A8F4FF';
const COR_SINTAXE = { palavraChave: '#EC78FF', funcao: '#3CE6FF', string: '#FFD66E', numero: '#FFA046', resto: '#E1E8F5' };
const PALAVRAS_CHAVE = new Set(['if', 'else', 'elif', 'for', 'while', 'def', 'return', 'in', 'and', 'or', 'not', 'True', 'False', 'None']);
const FUNCOES_NATIVAS = new Set(['print', 'input', 'int', 'float', 'str', 'len', 'range']);

// Animações da ADA: arquivo, quadros, ms por quadro e se repete.
const ANIMACOES_ADA = {
  parado: { arquivo: 'ada_parado_4f_32x32.png', quadros: 4, ms: 180, loop: true },
  falando: { arquivo: 'ada_falando_4f_32x32.png', quadros: 4, ms: 110, loop: true },
  acenar: { arquivo: 'ada_acenar_4f_32x32.png', quadros: 4, ms: 180, loop: true },
  aparecer: { arquivo: 'ada_aparecer_4f_32x32.png', quadros: 4, ms: 110, loop: false },
  sumir: { arquivo: 'ada_sumir_4f_32x32.png', quadros: 4, ms: 110, loop: false },
  olhando: { arquivo: 'ada_olhando_tela_1f_32x32.png', quadros: 1, ms: 1000, loop: false },
};

const ARQUIVOS = {
  cenario: '../compartilhados/cenario_intro_dia_480x270.png',
  byte_parado: '../compartilhados/byte_parado_2f_48x48.png',
  byte_olhando: 'byte_olhando_tela_1f_48x48.png',
  caixa_ada: 'caixa_dialogo_ada_468x82.png',
  caixa_byte: '../compartilhados/caixa_dialogo_byte_468x82.png',
  retrato_ada: 'retrato_ada_44x44.png',
  retrato_byte: '../compartilhados/retrato_byte_44x44.png',
  painel: 'painel_holograma_220x96.png',
  balao_surpresa: '../compartilhados/balao_surpresa_16x16.png',
  ...Object.fromEntries(Object.entries(ANIMACOES_ADA).map(([nome, anim]) => [`ada_${nome}`, anim.arquivo])),
};

function carregarImagem(url) {
  return new Promise((ok, falha) => {
    const imagem = new Image();
    imagem.onload = () => ok(imagem);
    imagem.onerror = () => falha(new Error(`Falha ao carregar ${url}`));
    imagem.src = url;
  });
}

async function carregarRecursos(pasta) {
  const cozette = new FontFace('CozetteAda', 'url(./assets/fontes/CozetteVector.ttf)');
  const fontes = Promise.all([
    carregarFonte(),
    cozette.load().then(() => document.fonts.add(cozette)).catch((erro) => console.error('Falha ao carregar a fonte Cozette:', erro)),
  ]);
  const imagens = Promise.all(Object.entries(ARQUIVOS).map(async ([nome, arquivo]) => [nome, await carregarImagem(pasta + arquivo)]));
  const roteiro = fetch(pasta + 'tutoriais.json').then((resposta) => {
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em tutoriais.json`);
    return resposta.json();
  });
  const [lista, json] = await Promise.all([imagens, roteiro, fontes]);
  return { imagens: Object.fromEntries(lista), niveis: json.niveis };
}

/** Linha de código com as cores de sintaxe do terminal (Cozette 13 px, 6 px por caractere). */
function escreverCodigo(ctx, texto, x, y) {
  ctx.font = '13px CozetteAda';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const tokens = texto.match(/"[^"]*"|'[^']*'|\d+|[A-Za-z_]\w*|\s+|./g) || [];
  let cursor = x;
  for (const token of tokens) {
    let cor = COR_SINTAXE.resto;
    if (token.startsWith('"') || token.startsWith("'")) cor = COR_SINTAXE.string;
    else if (/^\d/.test(token)) cor = COR_SINTAXE.numero;
    else if (PALAVRAS_CHAVE.has(token)) cor = COR_SINTAXE.palavraChave;
    else if (FUNCOES_NATIVAS.has(token)) cor = COR_SINTAXE.funcao;
    ctx.fillStyle = cor;
    ctx.fillText(token, cursor, y);
    cursor += ctx.measureText(token).width;
  }
}

/** Pontos de uma reta pixelada, de (x0, y0) até (x1, y1), um a cada `passo` px. */
function pontosDaReta(x0, y0, x1, y1, passo) {
  const pontos = [];
  const total = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= total; i += passo) {
    pontos.push([Math.round(x0 + ((x1 - x0) * i) / total), Math.round(y0 + ((y1 - y0) * i) / total)]);
  }
  return pontos;
}

/**
 * Cria o tutorial dentro de `canvas` (480 × 270). `pasta` tem as imagens e tutoriais.json.
 * tocar(nivel, { aoTerminar }) toca o tutorial do nível (1 = primeiro); aoTerminar roda ao acabar ou ao pular.
 */
export function criarTutorialAda(canvas, { pasta }) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let recursos = null;
  let s = null;

  // --- Roteiro --------------------------------------------------------------

  function animarAda(nome) {
    if (s.ada.nome === nome) return;
    s.ada = { nome, t: 0 };
  }

  /** Começa a página `i`; sem mais páginas, a ADA some. */
  function abrirPagina(i) {
    s.pagina = i;
    const pagina = s.nivel.paginas[i];
    if (!pagina) {
      s.etapa = 'sumir';
      s.dialogo = null;
      s.painelVisivel = false;
      animarAda('sumir');
      return;
    }
    s.etapa = 'pagina';
    if (pagina.destaque) s.painelVisivel = true;
    // A despedida ("Boa sorte") esconde o painel.
    if (pagina.acenar) s.painelVisivel = false;
    if (pagina.acao === 'olhar_para_tela') {
      s.dialogo = null;
      s.pausa = pagina.ms ?? 2000;
      animarAda('olhando');
      return;
    }
    s.pausa = 0;
    const linhas = quebrar(pagina.texto, 46);
    s.dialogo = { quem: pagina.quem, linhas, total: linhas.reduce((soma, linha) => soma + linha.length, 0), letras: 0 };
    s.destaque = new Set(pagina.destaque ?? s.ultimoDestaque);
    if (pagina.destaque) s.ultimoDestaque = pagina.destaque;
    s.guias = pagina.guias === true;
  }

  function avancar() {
    if (!s || s.pulando || s.etapa !== 'pagina' || s.pausa > 0 || !s.dialogo) return;
    if (s.dialogo.letras < s.dialogo.total) s.dialogo.letras = s.dialogo.total;
    else abrirPagina(s.pagina + 1);
  }

  function pular() {
    if (!s || s.pulando) return;
    s.pulando = true;
    s.saida = 0;
  }

  function finalizar() {
    const aoTerminar = s.aoTerminar;
    s = null;
    window.removeEventListener('keydown', aoTecla);
    canvas.parentElement.removeEventListener('click', avancar);
    aoTerminar();
  }

  function aoTecla(evento) {
    if (!s) return;
    if (evento.key === 'Escape') {
      evento.preventDefault();
      pular();
      return;
    }
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault();
    if (!evento.repeat) avancar();
  }

  // --- Atualização ----------------------------------------------------------

  function atualizar(dt) {
    const ms = dt * 1000;
    s.tempo += ms;
    s.ada.t += ms;
    s.painel = Math.max(0, Math.min(1, s.painel + (s.painelVisivel ? 1 : -1) * (ms / FADE_PAINEL_MS)));
    const anim = ANIMACOES_ADA[s.ada.nome];
    const animacaoAcabou = !anim.loop && s.ada.t >= anim.quadros * anim.ms;

    if (s.pulando) {
      s.saida += ms;
      return s.saida >= TEMPO_SAIDA_MS;
    }
    if (s.etapa === 'aparecer') {
      if (animacaoAcabou) {
        animarAda('parado');
        abrirPagina(0);
      }
    } else if (s.etapa === 'pagina') {
      const pagina = s.nivel.paginas[s.pagina];
      if (s.pausa > 0) {
        s.pausa -= ms;
        if (s.pausa <= 0) {
          animarAda('parado');
          abrirPagina(s.pagina + 1);
        }
      } else if (s.dialogo) {
        s.dialogo.letras = Math.min(s.dialogo.total, s.dialogo.letras + dt * LETRAS_POR_SEGUNDO);
        const escrevendo = s.dialogo.letras < s.dialogo.total;
        if (pagina.acenar) animarAda('acenar');
        else if (pagina.quem === 'ADA' && escrevendo) animarAda('falando');
        else animarAda('parado');
      }
    } else if (s.etapa === 'sumir' && animacaoAcabou && s.painel === 0) {
      return true;
    }
    return false;
  }

  // --- Desenho --------------------------------------------------------------

  function desenharQuadro(imagem, quadro, largura, altura, x, y) {
    ctx.drawImage(imagem, quadro * largura, 0, largura, altura, Math.round(x), Math.round(y), largura, altura);
  }

  function desenharByte() {
    const { imagens } = recursos;
    const pausa = s.pausa > 0;
    if (pausa) desenharQuadro(imagens.byte_olhando, 0, 48, 48, BYTE.x, BYTE.y);
    else desenharQuadro(imagens.byte_parado, Math.floor(s.tempo / 550) % 2, 48, 48, BYTE.x, BYTE.y);
    const pagina = s.etapa === 'pagina' ? s.nivel.paginas[s.pagina] : null;
    if (pagina?.balao === 'surpresa') ctx.drawImage(imagens.balao_surpresa, BYTE.x + 26, BYTE.y - 14);
  }

  function desenharAda() {
    const anim = ANIMACOES_ADA[s.ada.nome];
    const i = Math.floor(s.ada.t / anim.ms);
    const quadro = anim.loop ? i % anim.quadros : Math.min(i, anim.quadros - 1);
    // Na pausa cômica ela fica parada no ar, sem flutuar.
    const flutuar = s.ada.nome === 'olhando' ? 0 : Math.round(FLUTUAR.amplitude * Math.sin((2 * Math.PI * s.tempo) / FLUTUAR.periodo));
    desenharQuadro(recursos.imagens[`ada_${s.ada.nome}`], quadro, 32, 32, ADA.x, ADA.y + flutuar);
  }

  /** Feixe pontilhado do olho da ADA até os cantos esquerdos do painel; 1 em cada 3 pontos acende por vez. */
  function desenharFeixe() {
    const fase = Math.floor(s.tempo / 80) % 3;
    ctx.fillStyle = COR_FEIXE;
    for (const [x, y] of [[PAINEL.x, PAINEL.y], [PAINEL.x, PAINEL.y + PAINEL.altura - 1]]) {
      pontosDaReta(OLHO_ADA.x, OLHO_ADA.y, x, y, 2).forEach(([px, py], i) => {
        ctx.globalAlpha = s.painel * (i % 3 === fase ? 1 : 0.35);
        ctx.fillRect(px, py, 1, 1);
      });
    }
    ctx.globalAlpha = 1;
  }

  function desenharPainel() {
    ctx.globalAlpha = s.painel;
    ctx.drawImage(recursos.imagens.painel, PAINEL.x, PAINEL.y);
    ctx.font = '13px CozetteAda';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COR_TITULO_PAINEL;
    ctx.fillText('exemplo.py', PAINEL.x + 5, PAINEL.y);
    s.nivel.codigo.forEach(([codigo, recuo], i) => {
      const y = 126 + 14 * i;
      if (s.destaque.has(i)) {
        ctx.fillStyle = 'rgba(255, 214, 70, 0.27)';
        ctx.fillRect(PAINEL.x + 1, y, PAINEL.largura - 2, 14);
        ctx.fillStyle = COR_AMARELO;
        ctx.fillRect(PAINEL.x + 1, y, 2, 14);
      }
      if (s.guias && recuo > 0) {
        ctx.fillStyle = COR_AMARELO;
        for (let k = 0; k < 14; k += 2) ctx.fillRect(257, y + k, 1, 1);
      }
      ctx.font = '13px CozetteAda';
      ctx.fillStyle = COR_NUMERO_LINHA;
      ctx.fillText(String(i + 1), 242, y);
      escreverCodigo(ctx, codigo, 256 + 24 * recuo, y);
    });
    ctx.globalAlpha = 1;
  }

  function desenharDialogo() {
    const { imagens } = recursos;
    const d = s.dialogo;
    const ada = d.quem === 'ADA';
    ctx.drawImage(ada ? imagens.caixa_ada : imagens.caixa_byte, 8, 24);
    ctx.drawImage(ada ? imagens.retrato_ada : imagens.retrato_byte, 21, 46);
    escrever(ctx, d.quem, 84, 28, 8, COR_NOME[d.quem] ?? COR_TEXTO);
    let mostrar = Math.floor(d.letras);
    d.linhas.forEach((linha, i) => {
      escrever(ctx, linha, 82, 46 + 13 * i, 8, COR_TEXTO, Math.max(0, mostrar));
      mostrar -= linha.length;
    });
    // Seta piscando: o texto está completo e Enter avança.
    if (d.letras >= d.total && Math.floor(s.tempo / 400) % 2 === 0) {
      ctx.fillStyle = COR_AMARELO;
      [[455, 9], [456, 7], [457, 5], [458, 3], [459, 1]].forEach(([x, largura], i) => ctx.fillRect(x, 87 + i, largura, 1));
    }
  }

  function desenhar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(recursos.imagens.cenario, 0, 0);
    if (s.painel > 0) desenharFeixe();
    desenharByte();
    desenharAda();
    if (s.painel > 0) desenharPainel();
    if (s.dialogo && !s.pulando) desenharDialogo();
    if (Math.floor(s.tempo / 600) % 2 === 0) escrever(ctx, 'ESC: PULAR', 388, 6, 8, COR_CINZA);
    if (s.pulando) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, s.saida / TEMPO_SAIDA_MS)})`;
      ctx.fillRect(0, 0, LARGURA, ALTURA);
    }
  }

  function quadro(agora) {
    if (!s) return;
    const dt = Math.min(0.05, (agora - s.ultimo) / 1000);
    s.ultimo = agora;
    if (atualizar(dt)) {
      finalizar();
      return;
    }
    desenhar();
    requestAnimationFrame(quadro);
  }

  async function tocar(numeroNivel, { aoTerminar }) {
    if (s) return;
    try {
      recursos ??= await carregarRecursos(pasta);
    } catch (erro) {
      // Sem o tutorial, o nível começa do mesmo jeito.
      console.error('Falha ao carregar o tutorial da ADA:', erro);
      aoTerminar();
      return;
    }
    const nivel = recursos.niveis.find((item) => item.nivel === numeroNivel);
    if (!nivel) {
      aoTerminar();
      return;
    }
    s = {
      nivel,
      aoTerminar,
      etapa: 'aparecer',
      ada: { nome: 'aparecer', t: 0 },
      pagina: -1,
      dialogo: null,
      pausa: 0,
      painel: 0,
      painelVisivel: false,
      destaque: new Set(),
      ultimoDestaque: [],
      guias: false,
      tempo: 0,
      pulando: false,
      saida: 0,
      ultimo: performance.now(),
    };
    window.addEventListener('keydown', aoTecla);
    canvas.parentElement.addEventListener('click', avancar);
    requestAnimationFrame(quadro);
  }

  return { tocar, ativo: () => s !== null };
}
