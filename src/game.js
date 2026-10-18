// Segundos: um intervalo de atualização nunca ultrapassa 50 ms.
const MAX_DELTA_TIME = 0.05;

/**
 * Inicia o ciclo de atualização e desenho com os módulos fornecidos por main.js.
 *
 * @param {HTMLCanvasElement} canvas Superfície de desenho, em pixels internos.
 * @param {CanvasRenderingContext2D} context Contexto de desenho 2D.
 * @param {object} modules Funções fornecidas pela integração em main.js.
 * @param {function(): object} modules.readActions Retorna as ações atuais.
 * @param {function(object, number): void} modules.updatePlayer Recebe ações e deltaTime.
 * @param {function(number): void} modules.resolveCollisions Recebe deltaTime.
 * @param {function(CanvasRenderingContext2D, HTMLCanvasElement): void} modules.drawScene Desenha o estado final.
 * @returns {{start: function, stop: function, draw: function, destroy: function}} Controle do ciclo e desenho.
 */
export function startGame(canvas, context, {
  readActions,
  updatePlayer,
  resolveCollisions,
  drawScene,
}) {
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
