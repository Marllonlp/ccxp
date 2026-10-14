// O mapa usa coordenadas próprias; a janela só altera a escala e a área visível.
export function pontoNoCanvas(canvas, evento, largura = canvas.width, altura = canvas.height) {
  const area = canvas.getBoundingClientRect();
  return {
    x: (evento.clientX - area.left) * largura / area.width,
    y: (evento.clientY - area.top) * altura / area.height,
  };
}

export function calcularVisao(largura, altura, margemControles = 0) {
  largura = Math.max(1, largura);
  altura = Math.max(1, altura);
  const escala = altura / 360;
  const margemInferior = Math.max(60 * escala, margemControles);
  return {
    largura,
    altura,
    escala,
    larguraMundo: largura / escala,
    alturaMundo: altura / escala,
    cameraY: 480 - (altura - margemInferior) / escala,
  };
}

export function ajustarCanvas(canvas, visao, densidade = window.devicePixelRatio || 1) {
  const pixelRatio = Math.min(2, Math.max(1, densidade));
  const largura = Math.round(visao.largura * pixelRatio);
  const altura = Math.round(visao.altura * pixelRatio);
  if (canvas.width !== largura) canvas.width = largura;
  if (canvas.height !== altura) canvas.height = altura;
  return pixelRatio;
}
