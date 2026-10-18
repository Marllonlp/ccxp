// Janela de desafio: pergunta de múltipla escolha do banco de desafios, aberta durante a partida.
// O jogo fica parado enquanto ela está aberta. Depois da resposta, mostra o resultado e o botão Continuar.

const LETRAS = ['A', 'B', 'C', 'D'];
const NOMES_CATEGORIA = { vida: 'Coração', monstro: 'Monstro', ponte: 'Ponte' };

/**
 * Cria a janela dentro de `secao` (elemento #tela-desafio do index.html).
 * Devolve abrir(id, desafio, { textoAcerto, textoErro, insistir, onFim }), ativo() e tratarTecla(evento).
 * onFim(acertou) é chamado quando o jogador clica em Continuar.
 * Com insistir, a resposta errada só é riscada e o jogador tenta de novo até acertar.
 */
export function criarJanelaDesafio(secao) {
  const categoria = secao.querySelector('.categoria-desafio');
  const titulo = secao.querySelector('.titulo-desafio');
  const enunciado = secao.querySelector('.enunciado-desafio');
  const codigo = secao.querySelector('.codigo-desafio');
  const alternativas = secao.querySelector('.alternativas-desafio');
  const resultado = secao.querySelector('.resultado-desafio');
  const botaoContinuar = secao.querySelector('.botao-continuar-desafio');

  let atual = null;      // { desafio, textoAcerto, textoErro, insistir, onFim }
  let acertou = null;    // null enquanto não respondeu
  let botoes = [];

  /** Mostra o código com a lacuna destacada. Depois da resposta, a lacuna recebe a alternativa certa. */
  function mostrarCodigo(preenchimento = null) {
    const partes = atual.desafio.codigo.split('___');
    codigo.replaceChildren();
    partes.forEach((parte, i) => {
      codigo.append(parte);
      if (i === partes.length - 1) return;
      const lacuna = document.createElement('span');
      lacuna.className = preenchimento ? 'lacuna preenchida' : 'lacuna';
      lacuna.textContent = preenchimento ?? '___';
      codigo.append(lacuna);
    });
  }

  /** Errou numa pergunta com insistir: risca a alternativa e deixa escolher outra, sem mostrar a certa. */
  function tentarDeNovo(indice) {
    const botao = botoes[indice];
    botao.disabled = true;
    botao.classList.add('errada');
    resultado.className = 'resultado-desafio erro';
    resultado.replaceChildren(
      Object.assign(document.createElement('strong'), { textContent: 'Ainda não. Tente de novo!' }),
    );
    resultado.hidden = false;
    botoes.find((outro) => !outro.disabled)?.focus({ preventScroll: true });
  }

  function responder(indice) {
    if (!atual || acertou !== null || botoes[indice].disabled) return;
    const { desafio, textoAcerto, textoErro, insistir } = atual;
    if (insistir && indice !== desafio.correta) {
      tentarDeNovo(indice);
      return;
    }
    acertou = indice === desafio.correta;

    botoes.forEach((botao, i) => {
      botao.disabled = true;
      if (i === desafio.correta) botao.classList.add('certa');
      else if (i === indice) botao.classList.add('errada');
    });
    mostrarCodigo(desafio.alternativas[desafio.correta]);

    const certa = `${LETRAS[desafio.correta]}) ${desafio.alternativas[desafio.correta]}`;
    resultado.className = `resultado-desafio ${acertou ? 'acerto' : 'erro'}`;
    resultado.replaceChildren(
      Object.assign(document.createElement('strong'), {
        textContent: acertou ? `Correto! ${textoAcerto}` : `Resposta certa: ${certa}. ${textoErro}`,
      }),
      Object.assign(document.createElement('span'), { textContent: desafio.explicacao }),
    );
    resultado.hidden = false;
    botaoContinuar.hidden = false;
    botaoContinuar.focus({ preventScroll: true });
  }

  function continuar() {
    if (!atual || acertou === null) return;
    const { onFim } = atual;
    const resposta = acertou;
    atual = null;
    secao.hidden = true;
    onFim(resposta);
  }

  botaoContinuar.addEventListener('click', continuar);

  return {
    abrir(id, desafio, { textoAcerto, textoErro = '', insistir = false, onFim }) {
      atual = { desafio, textoAcerto, textoErro, insistir, onFim };
      acertou = null;

      categoria.textContent = `${NOMES_CATEGORIA[desafio.categoria] ?? 'Desafio'} · ${id}`;
      titulo.textContent = desafio.titulo;
      enunciado.textContent = desafio.enunciado;
      mostrarCodigo();

      botoes = desafio.alternativas.map((texto, i) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'alternativa-desafio';
        const letra = Object.assign(document.createElement('span'), { className: 'letra', textContent: `${LETRAS[i]})` });
        const valor = Object.assign(document.createElement('code'), { textContent: texto });
        botao.append(letra, valor);
        botao.addEventListener('click', () => responder(i));
        return botao;
      });
      alternativas.replaceChildren(...botoes);

      resultado.hidden = true;
      botaoContinuar.hidden = true;
      secao.hidden = false;
      botoes[0].focus({ preventScroll: true });
    },

    ativo: () => atual !== null,

    /** Teclas: A/B/C ou 1/2/3 respondem; setas trocam a alternativa; Esc continua depois da resposta. */
    tratarTecla(evento) {
      if (!atual) return;
      if (evento.key === 'Tab') {
        const disponiveis = [...secao.querySelectorAll('button:not(:disabled)')]
          .filter(botao => !botao.hidden);
        const primeiro = disponiveis[0], ultimo = disponiveis.at(-1);
        if ((evento.shiftKey && document.activeElement === primeiro)
          || (!evento.shiftKey && document.activeElement === ultimo)) {
          evento.preventDefault();
          (evento.shiftKey ? ultimo : primeiro)?.focus();
        }
        return;
      }
      if (acertou !== null) {
        if (evento.key === 'Escape') {
          evento.preventDefault();
          continuar();
        }
        return;
      }

      const tecla = evento.key.toUpperCase();
      const porLetra = LETRAS.indexOf(tecla);
      const porNumero = Number.parseInt(tecla, 10) - 1;
      const escolha = porLetra !== -1 ? porLetra : porNumero;
      if (escolha >= 0 && escolha < botoes.length) {
        evento.preventDefault();
        responder(escolha);
        return;
      }

      const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[evento.key];
      if (passo) {
        evento.preventDefault();
        const foco = botoes.indexOf(document.activeElement);
        // Pula as alternativas já riscadas.
        let proximo = foco === -1 ? 0 : foco;
        for (let i = 0; i < botoes.length; i++) {
          proximo = (proximo + passo + botoes.length) % botoes.length;
          if (!botoes[proximo].disabled) break;
        }
        botoes[proximo].focus({ preventScroll: true });
      }
    },
  };
}
