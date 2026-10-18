// Tela de seleção de níveis. Desenha tudo em 480 × 270 pixels; o CSS amplia o canvas com pixel nítido.
import { pontoNoCanvas } from './viewport.js';
import { movimentoReduzido } from './acessibilidade.js';

const PASTA = './assets/characters/Imagens_Personagens/02_cenario/tela_niveis_editavel_pacote/';
const TOTAL_CARTOES = 5;
const COR_BLOQUEADO = '#8C92A6';
const COR_TEXTO = '#FFFFFF';
const COR_SOMBRA = '#0C0E1C';
const FONTE_NOME = '8px PressStart2PNiveis';
// Botão SAIR: fica no canto superior esquerdo do painel, fora da área dos cartões e do título.
const BOTAO_SAIR = { x: 26, y: 22, largura: 50, altura: 16 };
const COR_SAIR = { normal: '#B91C3C', selecionado: '#DC2626', pressionado: '#7F1D1D' };

function carregarImagem(arquivo) {
  const imagem = new Image();
  imagem.src = PASTA + arquivo;
  return imagem;
}

function pronta(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

const fonte = new FontFace('PressStart2PNiveis', 'url(./assets/fontes/PressStart2P-Regular.ttf)');
fonte.load()
  .then(() => document.fonts.add(fonte))
  .catch((erro) => console.error('Falha ao carregar a fonte da tela de níveis:', erro));

/** Escreve um texto com a sombra 1 px abaixo e à direita, como manda a arte. */
function escreverComSombra(ctx, texto, x, y, cor) {
  ctx.fillStyle = COR_SOMBRA;
  ctx.fillText(texto, x + 1, y + 1);
  ctx.fillStyle = cor;
  ctx.fillText(texto, x, y);
}

/**
 * Escreve um nome centralizado. A fonte mostra o Í maiúsculo como minúsculo, então desenha-se
 * o I e o acento agudo com pixels, na mesma cor e com a mesma sombra.
 */
function escreverNome(ctx, texto, centroX, y, cor) {
  const semAcento = texto.replace(/Í/g, 'I');
  ctx.textAlign = 'left';
  const x = Math.round(centroX - ctx.measureText(semAcento).width / 2);
  escreverComSombra(ctx, semAcento, x, y, cor);
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] !== 'Í') continue;
    const letraX = x + ctx.measureText(semAcento.slice(0, i)).width;
    for (const [dx, dy] of [[4, -3], [3, -2]]) {
      ctx.fillStyle = COR_SOMBRA;
      ctx.fillRect(letraX + dx + 1, y + dy + 1, 1, 1);
      ctx.fillStyle = cor;
      ctx.fillRect(letraX + dx, y + dy, 1, 1);
    }
  }
}

/**
 * Cria a tela de níveis dentro de `canvas`.
 * - onEscolher(indice): o jogador confirmou um nível jogável.
 * - onVoltar(): volta à tela inicial (ESC ou botão Voltar).
 * - implementados: quantos níveis já têm fase jogável. Os demais aparecem travados.
 */
export function criarTelaNiveis(canvas, { onEscolher, onVoltar, onSair, implementados }) {
  canvas.width = 480;
  canvas.height = 270;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const fundo = carregarImagem('tela_niveis_painel_com_cenario_480x270.png');
  const cursor = carregarImagem('cursor_baixo_2f_11x10.png');
  const estrelas = {
    cheia: carregarImagem('estrela_cheia_11x11.png'),
    vazia: carregarImagem('estrela_vazia_11x11.png'),
  };
  const botaoVoltar = {
    normal: carregarImagem('botao_voltar_normal_156x32.png'),
    selecionado: carregarImagem('botao_voltar_selecionado_156x32.png'),
    pressionado: carregarImagem('botao_voltar_pressionado_156x32.png'),
  };

  // Cartões: normal e, quando selecionado, a versão com borda dourada (o bloqueado não tem).
  const cartoes = {};
  for (let n = 1; n <= TOTAL_CARTOES; n++) {
    for (const estado of ['completo', 'disponivel', 'bloqueado']) {
      cartoes[`${n}-${estado}`] = carregarImagem(`card_nivel${n}_${estado}_sem_nome_86x124.png`);
      if (estado !== 'bloqueado') {
        cartoes[`${n}-${estado}-sel`] = carregarImagem(`card_nivel${n}_${estado}_selecionado_sem_nome_86x124.png`);
      }
    }
  }

  let niveis = [];
  let selecionado = 0;
  let noVoltar = false;
  let visivel = false;
  let rodando = false;
  let tremorIndice = -1;
  let tremorAte = 0;
  let pressionadoAte = 0;
  let hoverVoltar = false;
  let hoverSair = false;
  let pressionadoSairAte = 0;

  const jogavel = (i) => i < implementados && niveis[i] !== undefined && niveis[i].estado !== 'bloqueado';

  function desenhar(agora) {
    ctx.clearRect(0, 0, 480, 270);
    if (pronta(fundo)) ctx.drawImage(fundo, 0, 0);

    // Com movimento reduzido, o cartão fica parado e a dica do rodapé não pisca.
    const reduzido = movimentoReduzido();
    niveis.forEach((nivel, i) => {
      const estado = i < implementados ? nivel.estado : 'bloqueado';
      const sel = visivel && i === selecionado && !noVoltar;
      // Cartão selecionado sobe e desce entre −1 e −2 px a cada 400 ms; nome e estrelas acompanham.
      const bob = sel && !reduzido ? (Math.floor(agora / 400) % 2 === 0 ? -1 : -2) : 0;
      // Tremor de ±1 px por 200 ms quando um cartão travado é escolhido.
      const tremor = (!reduzido && i === tremorIndice && agora < tremorAte) ? (Math.floor(agora / 50) % 2 === 0 ? 1 : -1) : 0;

      const chave = sel && estado !== 'bloqueado' ? `${i + 1}-${estado}-sel` : `${i + 1}-${estado}`;
      const cartao = cartoes[chave];
      if (cartao && pronta(cartao)) ctx.drawImage(cartao, 27 + 86 * i + tremor, 51 + bob);

      ctx.font = FONTE_NOME;
      ctx.textBaseline = 'top';
      const cor = estado === 'bloqueado' ? COR_BLOQUEADO : COR_TEXTO;
      escreverNome(ctx, nivel.nome, Math.round(70 + 86 * i + tremor), 116 + bob, cor);

      if (estado !== 'bloqueado') {
        for (let k = 0; k < 3; k++) {
          const estrela = k < nivel.estrelas ? estrelas.cheia : estrelas.vazia;
          if (pronta(estrela)) ctx.drawImage(estrela, 53 + 86 * i + 12 * k + tremor, 129 + bob);
        }
      }
    });

    if (visivel && !noVoltar && niveis.length > 0) {
      const quadro = Math.floor(agora / 200) % 2;
      const largura = cursor.naturalWidth / 2;
      if (pronta(cursor)) {
        ctx.drawImage(cursor, quadro * largura, 0, largura, cursor.naturalHeight,
          65 + 86 * selecionado, 40 + quadro, largura, cursor.naturalHeight);
      }
    }

    // Dica do rodapé: pisca a cada 800 ms.
    if (reduzido || Math.floor(agora / 800) % 2 === 0) {
      ctx.font = FONTE_NOME;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      escreverComSombra(ctx, 'SETAS: ESCOLHER   ENTER: JOGAR', 240, 184, COR_TEXTO);
    }

    let estadoVoltar = 'normal';
    if (agora < pressionadoAte) estadoVoltar = 'pressionado';
    else if (noVoltar || hoverVoltar) estadoVoltar = 'selecionado';
    if (pronta(botaoVoltar[estadoVoltar])) ctx.drawImage(botaoVoltar[estadoVoltar], 162, 205);

    // Botão SAIR: retângulo vermelho com borda escura e o texto da fonte.
    const { x, y, largura, altura } = BOTAO_SAIR;
    let corSair = COR_SAIR.normal;
    if (agora < pressionadoSairAte) corSair = COR_SAIR.pressionado;
    else if (hoverSair) corSair = COR_SAIR.selecionado;
    ctx.fillStyle = COR_SOMBRA;
    ctx.fillRect(x, y, largura, altura);
    ctx.fillStyle = corSair;
    ctx.fillRect(x + 1, y + 1, largura - 2, altura - 2);
    ctx.font = FONTE_NOME;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    escreverComSombra(ctx, 'SAIR', x + largura / 2, y + 4, COR_TEXTO);
  }

  function animar() {
    if (!visivel) {
      rodando = false;
      return;
    }
    desenhar(performance.now());
    requestAnimationFrame(animar);
  }

  function iniciarAnimacao() {
    if (rodando) return;
    rodando = true;
    requestAnimationFrame(animar);
  }

  function tremer(indice) {
    tremorIndice = indice;
    tremorAte = performance.now() + 200;
  }

  function pressionarVoltar() {
    pressionadoAte = performance.now() + 100;
    setTimeout(onVoltar, 100);
  }

  function pressionarSair() {
    pressionadoSairAte = performance.now() + 100;
    setTimeout(onSair, 100);
  }

  function moverSelecao(direcao) {
    if (noVoltar) return;
    // Pula os cartões travados, como pede a especificação.
    for (let i = selecionado + direcao; i >= 0 && i < niveis.length; i += direcao) {
      if (jogavel(i)) {
        selecionado = i;
        return;
      }
    }
  }

  function cartaoEm(ponto) {
    for (let i = 0; i < niveis.length; i++) {
      const x = 27 + 86 * i;
      if (ponto.x >= x && ponto.x < x + 86 && ponto.y >= 51 && ponto.y < 175) return i;
    }
    return -1;
  }

  function voltarEm(ponto) {
    return ponto.x >= 162 && ponto.x < 318 && ponto.y >= 205 && ponto.y < 237;
  }

  function sairEm(ponto) {
    const { x, y, largura, altura } = BOTAO_SAIR;
    return ponto.x >= x && ponto.x < x + largura && ponto.y >= y && ponto.y < y + altura;
  }

  canvas.addEventListener('mousemove', (evento) => {
    if (!visivel) return;
    const ponto = pontoNoCanvas(canvas, evento, 480, 270);
    hoverVoltar = voltarEm(ponto);
    hoverSair = sairEm(ponto);
    const indice = cartaoEm(ponto);
    if (indice >= 0) {
      selecionado = indice;
      noVoltar = false;
    }
  });

  canvas.addEventListener('click', (evento) => {
    if (!visivel) return;
    const ponto = pontoNoCanvas(canvas, evento, 480, 270);
    if (sairEm(ponto)) {
      pressionarSair();
      return;
    }
    if (voltarEm(ponto)) {
      pressionarVoltar();
      return;
    }
    const indice = cartaoEm(ponto);
    if (indice < 0) return;
    selecionado = indice;
    noVoltar = false;
    if (jogavel(indice)) onEscolher(indice);
    else tremer(indice);
  });

  return {
    /** Mostra a tela com os dados dos níveis. `indice` é o cartão que começa selecionado. */
    mostrar(dados, indice = 0) {
      niveis = dados;
      selecionado = Math.max(0, Math.min(indice, dados.length - 1));
      noVoltar = false;
      visivel = true;
      iniciarAnimacao();
    },

    esconder() {
      visivel = false;
    },

    /** Trata uma tecla enquanto a tela está aberta. Devolve true se a tecla foi usada. */
    tratarTecla(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onVoltar();
      } else if (evento.key === 'ArrowLeft' || evento.key === 'a' || evento.key === 'A') {
        evento.preventDefault();
        moverSelecao(-1);
      } else if (evento.key === 'ArrowRight' || evento.key === 'd' || evento.key === 'D') {
        evento.preventDefault();
        moverSelecao(1);
      } else if (evento.key === 'ArrowDown') {
        evento.preventDefault();
        noVoltar = true;
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault();
        noVoltar = false;
      } else if (evento.key === 'Enter') {
        // Impede o Enter nativo de disparar um clique depois da troca de tela.
        evento.preventDefault();
        if (noVoltar) pressionarVoltar();
        else if (jogavel(selecionado)) onEscolher(selecionado);
        else tremer(selecionado);
      } else {
        return false;
      }
      return true;
    },
  };
}
