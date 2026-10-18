// Loja de skins: um cartão por skin, com o Byte parado animado, o nome e o que dá para fazer.
// O texto é HTML para ficar nítido e acessível; as setas movem o foco entre os cartões e Enter confirma.
import { SKINS, skinLiberada } from './skins.js';
import { pastaDaSkin } from './player.js';

/**
 * Cria a Loja dentro de `secao`. `opcoes`:
 * - progresso(): o progresso salvo, alterado aqui ao comprar, liberar ou equipar;
 * - salvar(): grava o progresso;
 * - totalNiveis: quantos níveis contam para a conquista das 3 estrelas;
 * - onEquipar(id): troca as animações do Byte;
 * - onVoltar(): volta à tela de título.
 */
export function criarLoja(secao, { progresso, salvar, totalNiveis, onEquipar, onVoltar }) {
  const grade = secao.querySelector('#loja-grade');
  const saldo = secao.querySelector('#loja-saldo');
  const aviso = secao.querySelector('#loja-aviso');
  const botaoVoltar = secao.querySelector('#botao-loja-voltar');
  let avisoTimer = 0;

  const cartoes = SKINS.map((skin) => {
    const cartao = document.createElement('li');
    cartao.className = 'loja-cartao';
    cartao.style.setProperty('--cor-skin', skin.cor);
    const retrato = document.createElement('div');
    retrato.className = 'loja-retrato';
    const byte = document.createElement('div');
    byte.className = 'loja-byte';
    byte.style.backgroundImage = `url('${pastaDaSkin(skin.id)}byteParado.png')`;
    retrato.append(byte);
    const nome = document.createElement('h3');
    nome.className = 'loja-nome';
    nome.textContent = skin.nomeCurto ?? skin.nome;
    const estado = document.createElement('p');
    estado.className = 'loja-estado';
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'loja-acao';
    botao.addEventListener('click', () => agir(skin, cartao));
    cartao.append(retrato, nome, estado, botao);
    grade.append(cartao);
    return { skin, cartao, estado, botao };
  });

  /** Situação da skin: equipada, liberada, à venda, social ou bloqueada (conquista). */
  function situacao(skin) {
    const p = progresso();
    if (p.skinEquipada === skin.id) return 'equipada';
    if (skinLiberada(skin, p, totalNiveis)) return 'liberada';
    if (skin.tipo === 'compra') return 'venda';
    if (skin.tipo === 'social') return 'social';
    return 'bloqueada';
  }

  function atualizar() {
    const carteira = progresso().carteira;
    saldo.textContent = String(carteira);
    saldo.parentElement.setAttribute('aria-label', `Saldo: ${carteira} moedas`);
    for (const { skin, cartao, estado, botao } of cartoes) {
      const atual = situacao(skin);
      cartao.dataset.situacao = atual;
      let textoEstado = '';
      let textoBotao = 'Equipar';
      let desativado = false;
      if (atual === 'equipada') {
        textoEstado = '✓ Equipada';
        textoBotao = 'Equipada';
        desativado = true;
      } else if (atual === 'venda') {
        textoEstado = String(skin.preco);
        textoBotao = 'Comprar';
        desativado = carteira < skin.preco;
      } else if (atual === 'social') {
        textoEstado = skin.requisito;
        textoBotao = 'Abrir Instagram';
      } else if (atual === 'bloqueada') {
        textoEstado = skin.requisito;
        textoBotao = 'Bloqueada';
        desativado = true;
      } else {
        textoEstado = 'Liberada';
      }
      estado.textContent = textoEstado;
      botao.textContent = textoBotao;
      // aria-disabled mantém o botão no caminho das setas e do Tab, e Enter explica o motivo.
      botao.setAttribute('aria-disabled', String(desativado));
      botao.setAttribute('aria-label', `${skin.nome}: ${textoBotao}${atual === 'venda' ? `, ${skin.preco} moedas` : ''}`
        + (atual === 'bloqueada' || atual === 'social' ? `. ${skin.requisito}` : ''));
    }
  }

  function avisar(texto) {
    aviso.textContent = texto;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { aviso.textContent = ''; }, 2600);
  }

  function tremer(cartao) {
    cartao.classList.remove('tremendo');
    void cartao.offsetWidth;
    cartao.classList.add('tremendo');
  }

  function equipar(skin) {
    progresso().skinEquipada = skin.id;
    salvar();
    onEquipar(skin.id);
  }

  function agir(skin, cartao) {
    const p = progresso();
    const atual = situacao(skin);
    if (atual === 'equipada') {
      avisar(`${skin.nome} já está equipada.`);
    } else if (atual === 'liberada') {
      equipar(skin);
      avisar(`${skin.nome} equipada!`);
    } else if (atual === 'venda') {
      if (p.carteira < skin.preco) {
        tremer(cartao);
        const faltam = skin.preco - p.carteira;
        avisar(`Faltam ${faltam} ${faltam === 1 ? 'moeda' : 'moedas'}. Conclua fases para juntar mais.`);
        return;
      }
      p.carteira -= skin.preco;
      p.skinsCompradas.push(skin.id);
      equipar(skin);
      avisar(`${skin.nome} comprada e equipada!`);
    } else if (atual === 'social') {
      window.open(skin.url, '_blank', 'noopener');
      p.skinsSociais.push(skin.id);
      salvar();
      avisar('Skin liberada! Obrigado por seguir');
    } else {
      tremer(cartao);
      avisar(`Para liberar: ${skin.requisito}.`);
    }
    atualizar();
  }

  /** Move o foco pela grade: esquerda/direita na ordem, cima/baixo para o cartão mais próximo na coluna. */
  function mover(tecla) {
    const botoes = cartoes.map(({ botao }) => botao);
    const indice = botoes.indexOf(document.activeElement);
    if (indice < 0) {
      if (tecla === 'ArrowDown' || document.activeElement !== botaoVoltar) botoes[0].focus();
      return;
    }
    if (tecla === 'ArrowLeft' || tecla === 'ArrowRight') {
      const passo = tecla === 'ArrowRight' ? 1 : -1;
      botoes[(indice + passo + botoes.length) % botoes.length].focus();
      return;
    }
    const atual = cartoes[indice].cartao.getBoundingClientRect();
    const centro = atual.left + atual.width / 2;
    const linhas = cartoes.map(({ cartao }) => cartao.getBoundingClientRect())
      .map((r, i) => ({ i, topo: r.top, centro: r.left + r.width / 2 }))
      .filter(({ topo }) => (tecla === 'ArrowDown' ? topo > atual.top + 1 : topo < atual.top - 1));
    if (linhas.length === 0) {
      if (tecla === 'ArrowUp') botaoVoltar.focus();
      return;
    }
    const topoAlvo = tecla === 'ArrowDown'
      ? Math.min(...linhas.map(({ topo }) => topo)) : Math.max(...linhas.map(({ topo }) => topo));
    const naLinha = linhas.filter(({ topo }) => Math.abs(topo - topoAlvo) < 1);
    const alvo = naLinha.reduce((a, b) => (Math.abs(b.centro - centro) < Math.abs(a.centro - centro) ? b : a));
    botoes[alvo.i].focus();
  }

  botaoVoltar.addEventListener('click', () => onVoltar());
  grade.addEventListener('focusin', (evento) => {
    evento.target.closest('.loja-cartao')?.scrollIntoView({ block: 'nearest' });
  });

  return {
    /** Abre a Loja com o cartão da skin equipada em foco. */
    mostrar() {
      aviso.textContent = '';
      atualizar();
      secao.hidden = false;
      const equipada = cartoes.find(({ skin }) => skin.id === progresso().skinEquipada) ?? cartoes[0];
      equipada.botao.focus({ preventScroll: true });
      equipada.cartao.scrollIntoView({ block: 'nearest' });
    },

    esconder() {
      secao.hidden = true;
      clearTimeout(avisoTimer);
    },

    /** Setas movem o foco, Enter confirma e ESC volta ao título. */
    tratarTecla(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onVoltar();
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(evento.key)) {
        evento.preventDefault();
        mover(evento.key);
      } else if (evento.key === 'Enter' && evento.target instanceof HTMLButtonElement) {
        // Impede o clique nativo depois de o foco mudar de tela.
        evento.preventDefault();
        evento.target.click();
      }
    },
  };
}
