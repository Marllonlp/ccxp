// O último acesso transforma um computador do cenário em passagem para o núcleo.
const arena = new Image();
arena.src = './assets/chefe/arena_chefe_fundo_480x270.png';

export function desenharPortalChefe(ctx, centro, piso, abertura, exercicios) {
  const x = centro - 58;
  const y = piso - 128;
  const tempo = performance.now() / 1000;
  const ligado = exercicios.concluidos === exercicios.total;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Cabos e pés enterrados na grama ligam a carcaça ao cenário.
  ctx.fillStyle = '#263c36';
  ctx.fillRect(x - 18, piso - 4, 152, 4);
  ctx.fillRect(x - 24, piso - 12, 10, 10);
  ctx.fillRect(x + 132, piso - 10, 10, 8);
  ctx.fillStyle = ligado ? '#9760bc' : '#53685c';
  ctx.fillRect(x - 18, piso - 4, 24, 2);
  ctx.fillRect(x + 112, piso - 4, 22, 2);
  ctx.fillStyle = '#253330';
  ctx.fillRect(x + 8, y, 100, 8);
  ctx.fillRect(x, y + 8, 116, 108);
  ctx.fillRect(x + 16, piso - 12, 84, 12);
  ctx.fillStyle = '#637368';
  ctx.fillRect(x + 8, y + 4, 100, 8);
  ctx.fillRect(x + 4, y + 12, 108, 100);
  ctx.fillStyle = '#96a18a';
  ctx.fillRect(x + 8, y + 8, 98, 2);
  ctx.fillRect(x + 4, y + 12, 3, 96);
  ctx.fillStyle = '#36483e';
  ctx.fillRect(x + 109, y + 14, 3, 96);
  ctx.fillRect(x + 8, y + 110, 100, 4);
  ctx.fillRect(x + 22, piso - 10, 72, 4);

  // Vidro fundo, com a paisagem do chefe do outro lado.
  ctx.fillStyle = '#172525';
  ctx.fillRect(x + 12, y + 16, 92, 92);
  ctx.fillStyle = '#080f1a';
  ctx.fillRect(x + 16, y + 20, 84, 84);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 16, y + 20, 84, 84);
  ctx.clip();
  ctx.globalAlpha = abertura;
  if (arena.complete && arena.naturalWidth) {
    ctx.drawImage(arena, 250, 65, 205, 205, x + 16, y + 20, 84, 84);
  } else {
    ctx.fillStyle = '#382b70';
    ctx.fillRect(x + 16, y + 20, 84, 84);
  }
  ctx.fillStyle = '#100f24';
  ctx.fillRect(centro - 17, y + 48, 34, 28);
  ctx.fillRect(centro - 23, y + 60, 46, 32);
  ctx.fillStyle = '#fd7599';
  ctx.fillRect(centro - 11, y + 58, 7, 3);
  ctx.fillRect(centro + 4, y + 58, 7, 3);
  // Pequenos pacotes atravessam o vidro; sem flashes sobre a tela inteira.
  for (let i = 0; i < 9; i++) {
    const py = y + 22 + Math.floor((tempo * 18 + i * 11) % 78);
    ctx.fillStyle = i % 2 ? '#c181e8' : '#6ed7d2';
    ctx.fillRect(x + 19 + (i * 29) % 76, py, 2, 4);
  }
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#090c20';
  for (let linha = 0; linha < 21; linha++) {
    ctx.fillRect(x + 16, y + 20 + linha * 4, 84, 1);
  }
  ctx.restore();

  // O selo se retrai conforme os quatro exercícios alimentam o monitor.
  if (abertura < 1) {
    ctx.fillStyle = '#26343b';
    const altura = Math.ceil(42 * (1 - abertura));
    ctx.fillRect(x + 16, y + 20, 84, altura);
    ctx.fillRect(x + 16, y + 104 - altura, 84, altura);
    ctx.fillStyle = '#74827b';
    ctx.fillRect(x + 16, y + 18 + altura, 84, 2);
    ctx.fillRect(x + 16, y + 104 - altura, 84, 2);
  }
  ctx.strokeStyle = ligado ? '#b279d6' : '#40534d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 15, y + 19, 86, 86);
  for (let i = 0; i < exercicios.total; i++) {
    ctx.fillStyle = i < exercicios.concluidos ? '#79d9a6' : '#2d423c';
    ctx.fillRect(centro - 23 + i * 13, y + 116, 8, 4);
  }
  // Musgo nos cantos conserva o mesmo material das portas anteriores.
  for (const [dx, dy] of [[8, 6], [18, 2], [100, 8], [2, 98], [104, 104]]) {
    ctx.fillStyle = '#42774e';
    ctx.fillRect(x + dx, y + dy, 10, 4);
    ctx.fillRect(x + dx + 2, y + dy - 3, 4, 4);
    ctx.fillStyle = '#82ab64';
    ctx.fillRect(x + dx + 2, y + dy, 4, 2);
  }
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px monospace';
  ctx.shadowColor = '#090b18';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#f0c0ee';
  ctx.fillText('KERNEL PANIC', centro, y - 20);
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = ligado ? '#a7e4ce' : '#ffd646';
  ctx.fillText(ligado ? 'ENTRAR NO NÚCLEO' : 'CONCLUA OS DESAFIOS', centro, y - 7);
  ctx.restore();
}

/** Fragmentos do Byte são puxados para o centro do monitor. */
export function desenharPixelsEntrada(ctx, entrada) {
  ctx.save();
  const cores = ['#49c6e5', '#efba46', '#9776de', '#bceee4'];
  for (let i = 0; i < 32; i++) {
    const t = (entrada.tempo - 0.55 - i * 0.012) / 0.6;
    if (t <= 0 || t >= 1) continue;
    const origemX = entrada.centro - 30 + (i * 19) % 60;
    const origemY = entrada.piso - 96 + (i * 13) % 64;
    const x = origemX + (entrada.centro - origemX) * t;
    const y = origemY + (entrada.piso - 66 - origemY) * t;
    ctx.globalAlpha = Math.sin(t * Math.PI);
    ctx.fillStyle = cores[i % cores.length];
    const tamanho = i % 3 === 0 ? 4 : 2;
    ctx.fillRect(Math.round(x), Math.round(y), tamanho, tamanho);
  }
  ctx.restore();
}

/** A passagem cobre a cena em blocos antes de revelar a arena. */
export function desenharTransicaoChefe(ctx, visao, tempo, centroX, centroY) {
  const progresso = Math.min(1, Math.max(0, (tempo - 1.45) / 0.65));
  if (progresso <= 0) return;
  const tamanho = Math.max(24, Math.ceil(visao.largura / 60));
  const diagonal = Math.hypot(visao.largura, visao.altura);
  ctx.save();
  for (let y = 0, linha = 0; y < visao.altura; y += tamanho, linha++) {
    for (let x = 0, coluna = 0; x < visao.largura; x += tamanho, coluna++) {
      const distancia = Math.hypot(x - centroX, y - centroY) / diagonal;
      const atraso = distancia * 0.75 + ((coluna * 17 + linha * 23) % 11) * 0.012;
      if (progresso < atraso) continue;
      ctx.fillStyle = progresso < 0.95 && progresso - atraso < 0.08 ? '#674076' : '#100f24';
      ctx.fillRect(x, y, tamanho, tamanho);
    }
  }
  ctx.restore();
}
