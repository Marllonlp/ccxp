import { startGame } from './game.js';

const status = document.getElementById('game-status');

try {
  // Inicialização: encontra a superfície e obtém as ferramentas de desenho.
  const canvas = document.getElementById('game-canvas');
  if (!canvas) throw new Error('O elemento game-canvas não foi encontrado.');

  const context = canvas.getContext('2d');
  if (!context) throw new Error('O contexto de desenho 2D não está disponível.');

  // Os módulos da equipe serão conectados aqui, conforme o README.
  const game = startGame(canvas, context);
  if (status) status.textContent = 'Base carregada. Retângulo de teste em exibição.';

  // Interrompe o trabalho ao sair e retoma se a página for restaurada.
  window.addEventListener('pagehide', game.stop);
  window.addEventListener('pageshow', game.start);
} catch (error) {
  if (status) status.textContent = 'Não foi possível iniciar o jogo. Consulte o console do navegador.';
  console.error('Falha ao iniciar a base do jogo:', error);
}
