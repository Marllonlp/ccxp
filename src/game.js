// Segundos: um intervalo de atualização nunca ultrapassa 50 ms.
const MAX_DELTA_TIME = 0.05;

// Reutilizamos este objeto enquanto o módulo de controles não estiver integrado.
const EMPTY_ACTIONS = Object.freeze({
  esquerda: false,
  direita: false,
  pulo: false,
  agachamento: false,
});

function doNothing() {}

function drawTestRectangle(context) {
  context.fillStyle = '#e63946';
  context.fillRect(100, 100, 50, 80);
}

/**
 * Inicia a coordenação dos módulos, com um desenho de teste como padrão.
 * As funções recebidas permitem integrar a equipe sem reescrever o ciclo.
 *
 * @param {HTMLCanvasElement} canvas Superfície de desenho, em pixels internos.
 * @param {CanvasRenderingContext2D} context Contexto de desenho 2D.
 * @param {object} [modules] Funções fornecidas pela integração em main.js.
 * @param {function(): object} [modules.readActions] Retorna as ações atuais.
 * @param {function(object, number): void} [modules.updatePlayer] Recebe ações e deltaTime.
 * @param {function(number): void} [modules.resolveCollisions] Recebe deltaTime.
 * @param {function(CanvasRenderingContext2D, HTMLCanvasElement): void} [modules.drawScene] Desenha o estado final.
 * @returns {{start: function, stop: function, draw: function, destroy: function}} Controle do ciclo e desenho.
 */
export function startGame(canvas, context, {
  readActions = () => EMPTY_ACTIONS,
  updatePlayer = doNothing,
  resolveCollisions = doNothing,
  drawScene = drawTestRectangle,
} = {}) {
  let previousTime = null;
  let animationFrameId = null;
  let running = false;
  let destroyed = false;

  function update(deltaTime) {
    const actions = readActions();
    updatePlayer(actions, deltaTime);
    resolveCollisions(deltaTime);
  }

  function draw() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawScene(context, canvas);
  }

  function gameLoop(currentTime) {
    if (!running) return;
    animationFrameId = null;

    // requestAnimationFrame informa o tempo em milissegundos.
    const elapsedTime = previousTime === null
      ? 0
      : (currentTime - previousTime) / 1000;

    // Limita o intervalo para evitar saltos grandes após uma interrupção.
    const deltaTime = Math.min(elapsedTime, MAX_DELTA_TIME);
    previousTime = currentTime;

    update(deltaTime);
    draw();

    if (running) animationFrameId = requestAnimationFrame(gameLoop);
  }

  function start() {
    // Evita iniciar outro ciclo quando o atual já está funcionando.
    if (running || destroyed) return;
    running = true;
    previousTime = null;
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function stop() {
    running = false;
    previousTime = null;
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function resetClock() {
    // A primeira atualização após mudar de aba usa deltaTime zero.
    previousTime = null;
  }

  function destroy() {
    stop();
    destroyed = true;
    document.removeEventListener('visibilitychange', resetClock);
  }

  document.addEventListener('visibilitychange', resetClock);
  start();

  return { start, stop, draw, destroy };
}
