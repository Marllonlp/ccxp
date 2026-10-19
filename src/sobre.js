// Tela Sobre: créditos da equipe. O Byte entra correndo pelo chão e para no centro; em seguida
// aparecem a logo, a frase da equipe, os nomes (um por vez) e a cidade. A sequência fica no CSS
// (animation-delay); aqui ela só é reiniciada a cada abertura e o Byte troca de corrida para parado.

/**
 * Cria a tela dentro de `secao`. `opcoes`:
 * - pastaByte(): pasta das tiras do Byte (a skin equipada);
 * - onVoltar(): volta à tela de título.
 */
export function criarSobre(secao, { pastaByte, onVoltar }) {
  const byte = secao.querySelector('.sobre-byte');
  const botaoVoltar = secao.querySelector('#botao-sobre-voltar');

  botaoVoltar.addEventListener('click', () => onVoltar());
  // Fim da corrida (animação 'sobre-entrada'): o Byte fica parado olhando os créditos.
  byte.addEventListener('animationend', (evento) => {
    if (evento.animationName === 'sobre-entrada') secao.classList.add('byte-chegou');
  });

  return {
    mostrar() {
      // Endereço absoluto: uma url() vinda de variável seria resolvida a partir de styles/, não da página.
      const pasta = new URL(pastaByte(), location.href).href;
      byte.style.setProperty('--byte-correndo', `url('${pasta}byteCorrendo.png')`);
      byte.style.setProperty('--byte-parado', `url('${pasta}byteParado.png')`);
      // Tirar a classe e forçar um reflow reinicia todas as animações do CSS.
      secao.classList.remove('animando', 'byte-chegou');
      secao.hidden = false;
      void secao.offsetWidth;
      secao.classList.add('animando');
      botaoVoltar.focus({ preventScroll: true });
    },

    esconder() {
      secao.hidden = true;
      secao.classList.remove('animando', 'byte-chegou');
    },

    /** Esc, Enter ou espaço voltam ao título. */
    tratarTecla(evento) {
      if (['Escape', 'Enter', ' '].includes(evento.key)) {
        evento.preventDefault();
        onVoltar();
      }
    },
  };
}
