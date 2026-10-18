// Terminal compartilhado pelo computador e pelo celular. O texto é HTML nativo,
// sem ampliar letras rasterizadas num canvas de baixa resolução.
const PASTA = './assets/characters/Imagens_Personagens/02_cenario/terminal_python_pacote/';
const MAX_LINHAS = 10;
const PALAVRAS = new Set(['if', 'else', 'elif', 'for', 'while', 'def', 'return', 'in', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from']);
const FUNCOES = new Set(['print', 'input', 'int', 'float', 'str', 'len', 'range']);

export async function carregarMissoes(arquivo = PASTA + 'missoes.json') {
  const resposta = await fetch(arquivo);
  if (!resposta.ok) throw new Error(`Não foi possível carregar as missões (${resposta.status}).`);
  return (await resposta.json()).missoes;
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function codigoColorido(texto) {
  const codigo = document.createElement('code');
  for (const token of texto.match(/"[^"]*"|'[^']*'|#.*$|\d+|[A-Za-z_]\w*|\s+|./g) ?? []) {
    const parte = document.createElement('span');
    parte.textContent = token;
    parte.className = token.startsWith('"') || token.startsWith("'") ? 'codigo-string'
      : /^\d/.test(token) ? 'codigo-numero'
      : token.startsWith('#') ? 'codigo-comentario'
      : PALAVRAS.has(token) ? 'codigo-palavra'
      : FUNCOES.has(token) ? 'codigo-funcao' : '';
    codigo.append(parte);
  }
  return codigo;
}

export function criarTerminal(secao, { onFechar, onResolvido }) {
  let retornos = { onFechar, onResolvido };
  let ativo = false;
  let missao = null;
  let estado = null;
  let selecionado = -1;
  const estados = new Map();
  const elementos = Object.fromEntries([
    'fechar', 'missao-titulo', 'enunciado', 'detalhes', 'linhas', 'trechos',
    'subir', 'descer', 'remover', 'testar', 'dica', 'resultado',
  ].map(nome => [nome, secao.querySelector(`#terminal-${nome}`)]));
  const trechoPorId = id => missao.trechos.find(trecho => trecho.id === id);
  /** Recuo da linha ao entrar no código: o da solução; um distrator segue a linha de cima, como num editor. */
  function recuo(id, indice) {
    const passo = missao.solucao.find(item => item.id === id);
    if (passo) return passo.indent ?? 0;
    const anterior = estado.linhas[indice - 1];
    if (!anterior) return 0;
    return anterior.indent + (trechoPorId(anterior.id).codigo.trimEnd().endsWith(':') ? 1 : 0);
  }
  const disponiveis = () => estado.ordem.map(trechoPorId)
    .filter(trecho => !estado.linhas.some(linha => linha.id === trecho.id));

  function atualizar() {
    elementos.linhas.replaceChildren(...estado.linhas.map((linha, indice) => {
      const item = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.classList.toggle('selecionada', indice === selecionado);
      botao.setAttribute('aria-pressed', String(indice === selecionado));
      const codigo = codigoColorido(trechoPorId(linha.id).codigo);
      codigo.style.paddingInlineStart = `${linha.indent * 4}ch`;
      botao.append(codigo);
      botao.addEventListener('click', () => executar(() => { selecionado = indice; }));
      item.append(botao);
      return item;
    }));
    elementos.trechos.replaceChildren(...disponiveis().map(trecho => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = `trecho-${trecho.tipo ?? 'outro'}`;
      botao.dataset.trecho = trecho.id;
      botao.append(codigoColorido(trecho.codigo));
      botao.addEventListener('click', () => executar(() => {
        if (estado.linhas.length >= MAX_LINHAS) return;
        const indice = selecionado >= 0 ? selecionado + 1 : estado.linhas.length;
        estado.linhas.splice(indice, 0, { id: trecho.id, indent: recuo(trecho.id, indice) });
        selecionado = indice;
      }));
      return botao;
    }));
    elementos.subir.disabled = selecionado <= 0;
    elementos.descer.disabled = selecionado < 0 || selecionado >= estado.linhas.length - 1;
    elementos.remover.disabled = selecionado < 0;
    elementos.resultado.replaceChildren(...estado.console.map(linha => {
      const p = document.createElement('p');
      p.textContent = linha.texto;
      p.className = `terminal-${linha.tipo}`;
      return p;
    }));
  }

  function executar(acao) {
    if (!ativo) return;
    const restaurarFoco = elementos.linhas.contains(document.activeElement)
      || elementos.trechos.contains(document.activeElement);
    acao();
    atualizar();
    if (ativo && selecionado >= 0) {
      elementos.linhas.querySelectorAll('button')[selecionado]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (restaurarFoco && ativo) {
      (elementos.linhas.querySelectorAll('button')[selecionado]
        ?? elementos.trechos.querySelector('button') ?? elementos.testar).focus({ preventScroll: true });
    }
  }

  function mover(delta) {
    const destino = selecionado + delta;
    if (selecionado < 0 || destino < 0 || destino >= estado.linhas.length) return;
    const [linha] = estado.linhas.splice(selecionado, 1);
    estado.linhas.splice(destino, 0, linha);
    selecionado = destino;
  }

  function remover() {
    if (selecionado < 0) return;
    estado.linhas.splice(selecionado, 1);
    selecionado = Math.min(selecionado, estado.linhas.length - 1);
  }

  function testar() {
    const linhas = estado.linhas;
    const ordens = [missao.solucao.map(passo => passo.id), ...(missao.alternativas ?? [])];
    const certa = ordens.some(ordem => ordem.length === linhas.length
      && ordem.every((id, i) => linhas[i].id === id));
    if (!certa) {
      estado.console = [{ texto: linhas.length ? 'Os trechos ainda estão fora de ordem. Você pode tentar novamente.'
        : 'Escolha os trechos e monte o programa primeiro.', tipo: 'erro' }];
      return;
    }
    estado.console = missao.testes.map(teste => ({
      texto: `Entrada: ${teste.entrada} → ${teste.esperado} · OK`, tipo: 'ok',
    }));
    estado.console.push({ texto: `${missao.testes.length}/${missao.testes.length} testes passaram!`, tipo: 'ok' });
    if (!estado.resolvido) {
      estado.resolvido = true;
      retornos.onResolvido(missao.id);
    }
  }

  function fechar() {
    if (!ativo) return;
    ativo = false;
    retornos.onFechar();
  }

  elementos.fechar.addEventListener('click', fechar);
  elementos.testar.addEventListener('click', () => executar(testar));
  elementos.dica.addEventListener('click', () => executar(() => {
    estado.console = [{ texto: missao.dica, tipo: 'dica' }];
  }));
  elementos.subir.addEventListener('click', () => executar(() => mover(-1)));
  elementos.descer.addEventListener('click', () => executar(() => mover(1)));
  elementos.remover.addEventListener('click', () => executar(remover));

  function tratarTecla(evento) {
    if (!ativo) return false;
    if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
      return true;
    }
    if (evento.key === 'Tab') {
      const botoes = [...secao.querySelectorAll('button:not(:disabled), summary')]
        .filter(item => item.getClientRects().length);
      const primeiro = botoes[0], ultimo = botoes.at(-1);
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault(); ultimo?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault(); primeiro?.focus();
      }
      return true;
    }
    if (selecionado >= 0 && elementos.linhas.contains(document.activeElement)) {
      if (evento.altKey && ['ArrowUp', 'ArrowDown'].includes(evento.key)) {
        evento.preventDefault();
        executar(() => mover(evento.key === 'ArrowUp' ? -1 : 1));
        return true;
      }
      if (['Delete', 'Backspace'].includes(evento.key)) {
        evento.preventDefault(); executar(remover); return true;
      }
    }
    return false;
  }

  return {
    abrir(missaoAberta) {
      missao = missaoAberta;
      if (!estados.has(missao.id)) estados.set(missao.id, {
        linhas: [], ordem: embaralhar(missao.trechos.map(trecho => trecho.id)), resolvido: false, console: [],
      });
      estado = estados.get(missao.id);
      selecionado = -1;
      ativo = true;
      elementos['missao-titulo'].textContent = missao.titulo;
      elementos.enunciado.textContent = missao.enunciado;
      elementos.detalhes.replaceChildren(...[
        `Entrada: ${missao.entrada}`,
        ...missao.saida.map(saida => `Saída: ${saida}`),
        ...missao.exemplos.map(exemplo => `Exemplo: ${exemplo.entrada} → ${exemplo.saida}`),
      ].map(texto => Object.assign(document.createElement('p'), { textContent: texto })));
      atualizar();
      secao.querySelector('.terminal-toque-missao').open = window.matchMedia('(min-width: 1000px)').matches;
      for (const painel of secao.querySelectorAll('.terminal-toque-missao, #terminal-linhas, #terminal-trechos, #terminal-resultado')) painel.scrollTop = 0;
      elementos.fechar.focus({ preventScroll: true });
    },
    fechar() { ativo = false; },
    ativo: () => ativo,
    tratarTecla,
    definirRetornos(novos) {
      const anteriores = retornos;
      retornos = novos;
      return anteriores;
    },
    esquecerMissoes() { estados.clear(); },
  };
}
