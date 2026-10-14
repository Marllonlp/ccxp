// Terminal do totem: mini editor de Python em que o jogador monta o programa com cliques nos trechos.
// Desenhado em 480 × 270 pixels (o CSS amplia com pixel nítido), como a tela de níveis.
// Posições, cores e regras seguem INSTRUCOES_TERMINAL_PYTHON.md da pasta terminal_python_pacote.

const PASTA = './assets/characters/Imagens_Personagens/02_cenario/terminal_python_pacote/';
// Enquanto true, o jogador pode fechar o terminal com X ou ESC (modo de teste, como pede o guia).
const PERMITIR_FECHAR_TERMINAL = true;

const LARGURA = 480;
const ALTURA = 270;
const EDITOR = { x: 165, y: 53, largura: 173, linhas: 10, alturaLinha: 14, xCodigo: 184, passoIndent: 24, maxIndent: 3 };
const LISTA = { x: 344, y: 54, passo: 19, cartuchoLargura: 114, cartuchoAltura: 18, maxItens: 6, maxCaracteres: 17 };
const BOTAO_TESTAR = { x: 344, y: 174, largura: 118, altura: 28 };
const BOTAO_DICA = { x: 344, y: 202, largura: 118, altura: 28 };
const BOTAO_X = { x: 439, y: 7, largura: 20, altura: 22 };
const CONSOLE = { x: 165, y: 216, passo: 11, linhasVisiveis: 3, caracteres: 28 };
const EXEMPLOS = { x: 20, y: 214, largura: 128, altura: 30 };

const COR = {
  texto: '#E1E8F5',
  titulo: '#FFD646',
  rotulo: '#3CE6FF',
  marcador: '#FFD646',
  sombra: '#04060C',
  guia: '#28384F',
  zonaSoltar: '#283C5A',
  cursor: '#5AFF8C',
  cinza: '#6E82A0',
  erro: '#FF606E',
  ok: '#5AFF8C',
  resumo: '#FFD646',
  palavraChave: '#EC78FF',
  funcao: '#3CE6FF',
  string: '#FFD66E',
  numero: '#FFA046',
  comentario: '#6E82A0',
  resto: '#E1E8F5',
};

const PALAVRAS_CHAVE = new Set(['if', 'else', 'elif', 'for', 'while', 'def', 'return', 'in', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from']);
const FUNCOES_NATIVAS = new Set(['print', 'input', 'int', 'float', 'str', 'len', 'range']);
const CORES_TIPO = { entrada: 'laranja', decisao: 'rosa', saida: 'ciano', outro: 'cinza' };

const FONTE_CODIGO = '13px CozetteTerm';
const FONTE_TEXTO = '11px PixelifyTerm';
const FONTE_TITULO = '8px PressStartTerm';

function carregarImagem(arquivo) {
  const imagem = new Image();
  imagem.src = PASTA + arquivo;
  return imagem;
}

function pronta(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

// Fontes do terminal: carregadas uma vez.
for (const [nome, arquivo] of [['CozetteTerm', 'CozetteVector.ttf'], ['PixelifyTerm', 'PixelifySans.ttf'], ['PressStartTerm', 'PressStart2P-Regular.ttf']]) {
  const fonte = new FontFace(nome, `url(${PASTA}${arquivo})`);
  fonte.load().then(() => document.fonts.add(fonte)).catch((erro) => console.error(`Falha ao carregar ${arquivo}:`, erro));
}

const imagens = {
  fundo: carregarImagem('tela_terminal_python_vazia_480x270.png'),
  x: { normal: carregarImagem('botao_fechar_x_normal_20x22.png'), hover: carregarImagem('botao_fechar_x_hover_20x22.png'), pressionado: carregarImagem('botao_fechar_x_pressionado_20x22.png') },
  testar: { normal: carregarImagem('botao_testar_normal_118x28.png'), selecionado: carregarImagem('botao_testar_selecionado_118x28.png'), pressionado: carregarImagem('botao_testar_pressionado_118x28.png') },
  dica: { normal: carregarImagem('botao_dica_normal_118x28.png'), selecionado: carregarImagem('botao_dica_selecionado_118x28.png'), pressionado: carregarImagem('botao_dica_pressionado_118x28.png') },
  cartucho: {},
};
for (const tipo of Object.keys(CORES_TIPO)) {
  imagens.cartucho[tipo] = { normal: carregarImagem(`cartucho_${tipo}_normal_114x18.png`), hover: carregarImagem(`cartucho_${tipo}_hover_114x18.png`) };
}

/** Carrega as missões do arquivo missoes.json da pasta do terminal. */
export async function carregarMissoes(arquivo = PASTA + 'missoes.json') {
  const resposta = await fetch(arquivo);
  return (await resposta.json()).missoes;
}

/** Quebra um texto em linhas de até `largura` px, com +3 px entre palavras (Pixelify Sans). */
function quebrarTexto(ctx, texto, largura) {
  ctx.font = FONTE_TEXTO;
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(teste).width + 3 > largura) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function escreverComSombra(ctx, texto, x, y, cor) {
  ctx.fillStyle = COR.sombra;
  ctx.fillText(texto, x + 1, y + 1);
  ctx.fillStyle = cor;
  ctx.fillText(texto, x, y);
}

/**
 * Título em Press Start 2P. A fonte mostra o Í e o Ã maiúsculos como minúsculos, então desenha-se
 * a letra sem acento e o acento com pixels (deslocamentos do guia da fonte).
 */
function escreverTitulo(ctx, texto, x, y, cor) {
  ctx.font = FONTE_TITULO;
  ctx.textBaseline = 'top';
  const semAcento = texto.replace(/Í/g, 'I').replace(/Ã/g, 'A');
  escreverComSombra(ctx, semAcento, x, y, cor);
  const acentos = { 'Í': [[4, -3], [3, -2]], 'Ã': [[1, -2], [2, -3], [3, -2], [4, -2], [5, -3]] };
  for (let i = 0; i < texto.length; i++) {
    const pontos = acentos[texto[i]];
    if (!pontos) continue;
    const letraX = x + ctx.measureText(semAcento.slice(0, i)).width;
    for (const [dx, dy] of pontos) {
      ctx.fillStyle = COR.sombra;
      ctx.fillRect(letraX + dx + 1, y + dy + 1, 1, 1);
      ctx.fillStyle = cor;
      ctx.fillRect(letraX + dx, y + dy, 1, 1);
    }
  }
}

/** Trecho de código com as cores de sintaxe do Python. */
function escreverCodigo(ctx, texto, x, y, limite = Infinity) {
  ctx.font = FONTE_CODIGO;
  ctx.textBaseline = 'top';
  const tokens = texto.match(/"[^"]*"|'[^']*'|#.*$|\d+|[A-Za-z_]\w*|\s+|./g) || [];
  let cursor = x;
  let caracteres = 0;
  for (const token of tokens) {
    if (caracteres >= limite) break;
    const restante = limite - caracteres;
    const trecho = token.slice(0, restante);
    caracteres += trecho.length;
    let cor = COR.resto;
    if (trecho.startsWith('#')) cor = COR.comentario;
    else if (trecho.startsWith('"') || trecho.startsWith("'")) cor = COR.string;
    else if (/^\d/.test(trecho)) cor = COR.numero;
    else if (PALAVRAS_CHAVE.has(trecho)) cor = COR.palavraChave;
    else if (FUNCOES_NATIVAS.has(trecho)) cor = COR.funcao;
    escreverComSombra(ctx, trecho, cursor, y, cor);
    cursor += ctx.measureText(trecho).width;
  }
}

function tracejado(ctx, x1, y1, x2, y2, cor) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.setLineDash([1, 2]);
  ctx.beginPath();
  ctx.moveTo(x1 + 0.5, y1 + 0.5);
  ctx.lineTo(x2 + 0.5, y2 + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Quebra uma mensagem do console em linhas de até 28 caracteres. */
function quebrarConsole(texto) {
  const linhas = [];
  for (let i = 0; i < texto.length; i += CONSOLE.caracteres) linhas.push(texto.slice(i, i + CONSOLE.caracteres));
  return linhas;
}

/**
 * Cria o terminal dentro de `canvas`.
 * - onFechar(): o jogador fechou o terminal (X ou ESC). O jogo volta de onde parou.
 * - onResolvido(idMissao): a missão foi resolvida.
 */
export function criarTerminal(canvas, { onFechar, onResolvido }) {
  // Retornos atuais: a luta do chefe troca temporariamente os retornos e depois os devolve.
  let retornos = { onFechar, onResolvido };
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let missao = null;
  let estado = null;
  const estadosPorMissao = new Map();
  let ativo = false;
  let rodando = false;
  let selecionado = -1;             // linha do editor selecionada (para Tab e Delete)
  let hover = { x: false, testar: false, dica: false, trecho: -1 };
  let pressionado = { ate: 0, alvo: null };

  function novoEstado(missaoAtual) {
    return {
      linhas: [],
      ordem: embaralhar(missaoAtual.trechos.map((trecho) => trecho.id)),
      resolvido: false,
      console: [],
    };
  }

  function trechoPorId(id) {
    return missao.trechos.find((trecho) => trecho.id === id);
  }

  /** Trechos ainda na lista: os que não estão no editor, na ordem embaralhada. */
  function trechosNaLista() {
    return estado.ordem
      .map((id) => trechoPorId(id))
      .filter((trecho) => trecho && !estado.linhas.some((linha) => linha.id === trecho.id));
  }

  function escreverNoConsole(texto, cor) {
    for (const linha of quebrarConsole(texto)) estado.console.push({ texto: linha, cor });
  }

  function pontoNoCanvas(evento) {
    const area = canvas.getBoundingClientRect();
    return {
      x: (evento.clientX - area.left) * LARGURA / area.width,
      y: (evento.clientY - area.top) * ALTURA / area.height,
    };
  }

  function dentro(ponto, area) {
    return ponto.x >= area.x && ponto.x < area.x + area.largura && ponto.y >= area.y && ponto.y < area.y + area.altura;
  }

  function emEditor(ponto) {
    return ponto.x >= EDITOR.x && ponto.x < EDITOR.x + EDITOR.largura && ponto.y >= EDITOR.y && ponto.y < EDITOR.y + EDITOR.linhas * EDITOR.alturaLinha;
  }

  /** Onde o próximo trecho da lista entra: logo abaixo da linha selecionada, ou no fim do editor. */
  function pontoDeInsercao() {
    return selecionado >= 0 ? selecionado + 1 : estado.linhas.length;
  }

  function moverLinha(de, para) {
    const [linha] = estado.linhas.splice(de, 1);
    estado.linhas.splice(para, 0, linha);
  }

  function indiceDoTrechoNaLista(ponto) {
    const itens = trechosNaLista().slice(0, LISTA.maxItens);
    for (let i = 0; i < itens.length; i++) {
      const x = LISTA.x, y = LISTA.y + LISTA.passo * i;
      if (ponto.x >= x && ponto.x < x + LISTA.cartuchoLargura && ponto.y >= y && ponto.y < y + LISTA.cartuchoAltura) return i;
    }
    return -1;
  }

  function indiceDaLinhaEditor(ponto) {
    if (!emEditor(ponto)) return -1;
    const indice = Math.floor((ponto.y - EDITOR.y) / EDITOR.alturaLinha);
    return indice < estado.linhas.length ? indice : -1;
  }

  function inserirNoEditor(trecho, indice, indent) {
    if (estado.linhas.length >= EDITOR.linhas) return false;
    estado.linhas.splice(indice, 0, { id: trecho.id, indent });
    return true;
  }

  function testar() {
    estado.console = [];
    const sequencia = estado.linhas;
    if (sequencia.length === 0) {
      escreverNoConsole('Monte o programa primeiro.', COR.erro);
      return;
    }

    const solucao = missao.solucao;
    const diferenca = solucao.findIndex((passo, i) => !sequencia[i] || sequencia[i].id !== passo.id);
    if (sequencia.length !== solucao.length || diferenca !== -1) {
      const linha = (diferenca === -1 ? sequencia.length : diferenca) + 1;
      escreverNoConsole(`Erro na linha ${linha}: trecho fora do lugar.`, COR.erro);
      escreverNoConsole(`0/${missao.testes.length} testes passaram.`, COR.resumo);
      return;
    }

    // A indentação não é cobrada: com a ordem certa, o editor ajusta cada linha sozinho.
    solucao.forEach((passo, i) => { sequencia[i].indent = passo.indent; });

    for (const teste of missao.testes) {
      escreverNoConsole(`entrada ${teste.entrada} -> ${teste.esperado}   OK`, COR.ok);
    }
    escreverNoConsole(`${missao.testes.length}/${missao.testes.length} testes passaram!`, COR.resumo);
    if (!estado.resolvido) {
      estado.resolvido = true;
      retornos.onResolvido(missao.id);
    }
  }

  function dica() {
    estado.console = [];
    escreverNoConsole(missao.dica, COR.resumo);
  }

  function apertar(alvo) {
    pressionado = { ate: performance.now() + 120, alvo };
  }

  /** Desenha o terminal. */
  function desenhar(agora) {
    ctx.clearRect(0, 0, LARGURA, ALTURA);
    if (pronta(imagens.fundo)) ctx.drawImage(imagens.fundo, 0, 0);

    // Botão X
    const estadoX = pressionado.alvo === 'x' && agora < pressionado.ate ? 'pressionado' : hover.x ? 'hover' : 'normal';
    if (pronta(imagens.x[estadoX])) ctx.drawImage(imagens.x[estadoX], BOTAO_X.x, BOTAO_X.y);

    if (!missao || !estado) return;

    // Título e enunciado
    ctx.font = FONTE_TITULO;
    const larguraTitulo = ctx.measureText(missao.titulo.replace(/Í/g, 'I').replace(/Ã/g, 'A')).width;
    escreverTitulo(ctx, missao.titulo, Math.round(84 - larguraTitulo / 2), 42, COR.titulo);
    ctx.font = FONTE_TEXTO;
    ctx.textBaseline = 'top';
    let y = 58;
    for (const linha of quebrarTexto(ctx, missao.enunciado, 126)) {
      escreverComSombra(ctx, linha, 22, y, COR.texto);
      y += 11;
    }

    // Entrada e saída
    y += 5;
    escreverTitulo(ctx, 'ENTRADA', 22, y, COR.rotulo);
    y += 11;
    for (const linha of quebrarTexto(ctx, missao.entrada, 126)) {
      escreverComSombra(ctx, linha, 22, y, COR.texto);
      y += 11;
    }
    y += 5;
    escreverTitulo(ctx, 'SAÍDA', 22, y, COR.rotulo);
    y += 11;
    for (const item of missao.saida) {
      ctx.fillStyle = COR.marcador;
      ctx.fillRect(23, y + 4, 3, 3);
      for (const linha of quebrarTexto(ctx, item, 118)) {
        ctx.font = FONTE_TEXTO;
        escreverComSombra(ctx, linha, 30, y, COR.texto);
        y += 11;
      }
    }

    // Exemplos: mini console no fim da coluna
    ctx.fillStyle = '#0B1424';
    ctx.fillRect(EXEMPLOS.x, EXEMPLOS.y, EXEMPLOS.largura, EXEMPLOS.altura);
    ctx.strokeStyle = COR.guia;
    ctx.strokeRect(EXEMPLOS.x + 0.5, EXEMPLOS.y + 0.5, EXEMPLOS.largura - 1, EXEMPLOS.altura - 1);
    ctx.font = FONTE_TEXTO;
    missao.exemplos.slice(0, 2).forEach((exemplo, i) => {
      const x = i === 0 ? 25 : 85;
      escreverComSombra(ctx, `> ${exemplo.entrada}`, x, 218, COR.cinza);
      escreverComSombra(ctx, exemplo.saida, x, 230, COR.ok);
    });

    // Linhas do editor
    estado.linhas.forEach((linha, i) => {
      const topo = EDITOR.y + EDITOR.alturaLinha * i;
      if (i === selecionado) {
        ctx.fillStyle = '#1B2A44';
        ctx.fillRect(EDITOR.x, topo, EDITOR.largura, EDITOR.alturaLinha);
      }
      for (let k = 0; k < linha.indent; k++) {
        tracejado(ctx, EDITOR.xCodigo + 1 + EDITOR.passoIndent * k, topo, EDITOR.xCodigo + 1 + EDITOR.passoIndent * k, topo + 13, COR.guia);
      }
      escreverCodigo(ctx, trechoPorId(linha.id).codigo, EDITOR.xCodigo + EDITOR.passoIndent * linha.indent, topo + 1);
    });

    // Ponto de inserção: o próximo clique na lista entra aqui.
    const inserirEm = pontoDeInsercao();
    if (inserirEm < EDITOR.linhas) {
      const topo = EDITOR.y + EDITOR.alturaLinha * inserirEm;
      tracejado(ctx, EDITOR.x, topo + 13, EDITOR.x + EDITOR.largura, topo + 13, COR.zonaSoltar);
      if (Math.floor(agora / 400) % 2 === 0) {
        ctx.fillStyle = COR.cursor;
        ctx.fillRect(EDITOR.xCodigo, topo + 1, 2, 11);
      }
    }

    // Trechos na lista
    const itens = trechosNaLista().slice(0, LISTA.maxItens);
    itens.forEach((trecho, i) => {
      const topo = LISTA.y + LISTA.passo * i;
      const tipo = imagens.cartucho[trecho.tipo] || imagens.cartucho.outro;
      const img = tipo[hover.trecho === i ? 'hover' : 'normal'];
      if (pronta(img)) ctx.drawImage(img, LISTA.x, topo);
      escreverCodigo(ctx, trecho.codigo, LISTA.x + 8, topo + 2, LISTA.maxCaracteres);
    });

    // Botões TESTAR e DICA
    const estadoTestar = pressionado.alvo === 'testar' && agora < pressionado.ate ? 'pressionado' : hover.testar ? 'selecionado' : 'normal';
    const estadoDica = pressionado.alvo === 'dica' && agora < pressionado.ate ? 'pressionado' : hover.dica ? 'selecionado' : 'normal';
    if (pronta(imagens.testar[estadoTestar])) ctx.drawImage(imagens.testar[estadoTestar], BOTAO_TESTAR.x, BOTAO_TESTAR.y);
    if (pronta(imagens.dica[estadoDica])) ctx.drawImage(imagens.dica[estadoDica], BOTAO_DICA.x, BOTAO_DICA.y);

    // Console: as 3 últimas linhas
    ctx.font = FONTE_TEXTO;
    const ultimas = estado.console.slice(-CONSOLE.linhasVisiveis);
    ultimas.forEach((linha, i) => {
      escreverComSombra(ctx, linha.texto, CONSOLE.x, CONSOLE.y + CONSOLE.passo * i, linha.cor);
    });
  }

  function animar() {
    if (!ativo) {
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

  function fecharSeNecessario() {
    if (!ativo) return;
    if (PERMITIR_FECHAR_TERMINAL) {
      ativo = false;
      retornos.onFechar();
    }
  }

  // Mouse: clique põe o trecho da lista no editor, seleciona uma linha e move a linha selecionada.
  canvas.addEventListener('mousemove', (evento) => {
    if (!ativo) return;
    const ponto = pontoNoCanvas(evento);
    hover = {
      x: dentro(ponto, BOTAO_X),
      testar: dentro(ponto, BOTAO_TESTAR),
      dica: dentro(ponto, BOTAO_DICA),
      trecho: indiceDoTrechoNaLista(ponto),
    };
  });

  /**
   * Clique no editor: seleciona a linha; clicar na selecionada apaga a linha (o trecho volta para a lista,
   * o que dá para fazer no celular, sem Delete); clicar em outra linha move a selecionada para lá.
   */
  function clicarNoEditor(ponto) {
    const indice = indiceDaLinhaEditor(ponto);
    if (indice === -1) {
      selecionado = -1;
      return;
    }
    if (selecionado === indice) {
      estado.linhas.splice(indice, 1);
      selecionado = -1;
      return;
    }
    if (selecionado === -1) {
      selecionado = indice;
      return;
    }
    moverLinha(selecionado, indice);
    selecionado = indice;
  }

  canvas.addEventListener('mousedown', (evento) => {
    if (!ativo) return;
    const ponto = pontoNoCanvas(evento);
    if (dentro(ponto, BOTAO_X)) {
      apertar('x');
      fecharSeNecessario();
      return;
    }
    if (dentro(ponto, BOTAO_TESTAR)) {
      apertar('testar');
      testar();
      return;
    }
    if (dentro(ponto, BOTAO_DICA)) {
      apertar('dica');
      dica();
      return;
    }
    const indiceLista = indiceDoTrechoNaLista(ponto);
    if (indiceLista !== -1) {
      const indice = pontoDeInsercao();
      // Com o editor cheio, o clique não faz nada.
      if (inserirNoEditor(trechosNaLista()[indiceLista], indice, 0)) selecionado = indice;
      return;
    }
    if (emEditor(ponto)) clicarNoEditor(ponto);
    else selecionado = -1;
  });

  // Teclado
  function tratarTecla(evento) {
    if (!ativo) return false;
    if (evento.key === 'Escape') {
      evento.preventDefault();
      fecharSeNecessario();
      return true;
    }
    if (evento.key === 'Tab' && selecionado >= 0 && estado.linhas[selecionado]) {
      evento.preventDefault();
      const linha = estado.linhas[selecionado];
      const novo = linha.indent + (evento.shiftKey ? -1 : 1);
      linha.indent = Math.max(0, Math.min(novo, EDITOR.maxIndent));
      return true;
    }
    if ((evento.key === 'ArrowUp' || evento.key === 'ArrowDown') && selecionado >= 0) {
      evento.preventDefault();
      const para = selecionado + (evento.key === 'ArrowUp' ? -1 : 1);
      if (para >= 0 && para < estado.linhas.length) {
        moverLinha(selecionado, para);
        selecionado = para;
      }
      return true;
    }
    if ((evento.key === 'Delete' || evento.key === 'Backspace') && selecionado >= 0) {
      evento.preventDefault();
      estado.linhas.splice(selecionado, 1);
      selecionado = -1;
      return true;
    }
    return false;
  }

  return {
    /** Abre o terminal da missão. Cada missão guarda o seu progresso enquanto a página estiver aberta. */
    abrir(missaoAberta) {
      missao = missaoAberta;
      if (!estadosPorMissao.has(missao.id)) estadosPorMissao.set(missao.id, novoEstado(missao));
      estado = estadosPorMissao.get(missao.id);
      selecionado = -1;
      ativo = true;
      iniciarAnimacao();
    },
    fechar() {
      ativo = false;
    },
    ativo: () => ativo,
    tratarTecla,
    /** Troca os retornos (fechar e resolver). Devolve os anteriores para restaurá-los depois. */
    definirRetornos(novos) {
      const anteriores = retornos;
      retornos = novos;
      return anteriores;
    },
    /** Esquece o progresso de todas as missões (a luta recomeça com os patches zerados). */
    esquecerMissoes() {
      estadosPorMissao.clear();
    },
  };
}

