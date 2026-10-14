// Botão de tela cheia: põe a página inteira (jogo, menus e controles de toque) em tela cheia.
// Funciona no computador e no Android. O iPhone não deixa páginas entrarem em tela cheia:
// lá o botão fica escondido e o jogo instalado na Tela de Início já abre sem as barras do navegador.

const botao = document.getElementById('botao-tela-cheia');
const pagina = document.documentElement;

const entrar = pagina.requestFullscreen ?? pagina.webkitRequestFullscreen;
const sair = document.exitFullscreen ?? document.webkitExitFullscreen;

function elementoEmTelaCheia() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function atualizarBotao() {
  const ativa = elementoEmTelaCheia() !== null;
  botao.classList.toggle('ativa', ativa);
  botao.setAttribute('aria-label', ativa ? 'Sair da tela cheia' : 'Tela cheia');
  botao.title = ativa ? 'Sair da tela cheia' : 'Tela cheia';
}

async function alternarTelaCheia() {
  try {
    if (elementoEmTelaCheia()) {
      await sair.call(document);
      return;
    }
    await entrar.call(pagina, { navigationUI: 'hide' });
    // No celular, aproveita a tela cheia para travar na horizontal (nem todo navegador deixa).
    await screen.orientation?.lock?.('landscape').catch(() => {});
  } catch (erro) {
    console.warn('Não foi possível alternar a tela cheia:', erro);
  }
}

if (botao) {
  if (entrar && sair) {
    botao.hidden = false;
    botao.addEventListener('click', () => {
      alternarTelaCheia();
      // Tira o foco do botão para Enter e espaço voltarem a valer para o jogo.
      botao.blur();
    });
    document.addEventListener('fullscreenchange', atualizarBotao);
    document.addEventListener('webkitfullscreenchange', atualizarBotao);
    atualizarBotao();
  } else {
    botao.hidden = true;
  }
}
