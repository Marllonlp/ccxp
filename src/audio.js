// Controle de volume da música de fundo e dos efeitos sonoros.
// Os valores de volume vão de 0 a 1 e são aplicados a tudo que já foi registrado.

// Volume da música antes do ajuste do jogador: deixa a trilha baixa e agradável.
const VOLUME_BASE_MUSICA = 0.2;

// Começam em 50%, como os controles do painel de som no index.html.
const volumes = { musica: 0.5, efeitos: 0.5 };
const efeitos = new Set();
const ganhosMusica = new Set();

/** Registra um efeito (elemento Audio). `base` é o volume do efeito antes do ajuste do jogador. */
export function registrarEfeito(audio, base = 1) {
  efeitos.add({ audio, base });
  audio.volume = base * volumes.efeitos;
}

/** Registra o ganho de uma faixa de música criada com Web Audio. */
export function registrarGanhoMusica(ganho) {
  ganhosMusica.add(ganho);
  ganho.gain.value = VOLUME_BASE_MUSICA * volumes.musica;
}

export function removerGanhoMusica(ganho) {
  ganhosMusica.delete(ganho);
}

/** Ajusta o volume de 'musica' ou 'efeitos' (valor de 0 a 1) e aplica nos sons já criados. */
export function definirVolume(tipo, valor) {
  volumes[tipo] = valor;

  for (const { audio, base } of efeitos) {
    audio.volume = base * volumes.efeitos;
  }

  for (const ganho of ganhosMusica) {
    ganho.gain.value = VOLUME_BASE_MUSICA * volumes.musica;
  }
}
