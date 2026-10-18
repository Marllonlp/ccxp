// Controle de volume da música de fundo e dos efeitos sonoros.
// Os valores de volume vão de 0 a 1 e são aplicados a tudo que já foi registrado.

// Volume da música antes do ajuste do jogador: deixa a trilha baixa e agradável.
const VOLUME_BASE_MUSICA = 0.2;

// Começam em 50%, como os controles do painel de som no index.html.
const volumes = { musica: 0.5, efeitos: 0.5 };
const efeitos = new Set();
const ganhosMusica = new Set();
let contextoEfeitos = null;
let ganhoEfeitos = null;

const SONS_ELETRONICOS = {
  tiro: { onda: 'triangle', inicio: 1200, fim: 180, duracao: 0.13, volume: 0.2 },
  impacto: { onda: 'triangle', inicio: 380, fim: 70, duracao: 0.2, volume: 0.25 },
  pulo: { onda: 'triangle', inicio: 330, fim: 720, duracao: 0.13, volume: 0.16 },
  dano: { onda: 'sawtooth', inicio: 180, fim: 65, duracao: 0.2, volume: 0.12 },
  alerta: { onda: 'square', inicio: 650, fim: 880, duracao: 0.12, volume: 0.07 },
  laser: { onda: 'sawtooth', inicio: 460, fim: 110, duracao: 0.5, volume: 0.09 },
  terminal: { onda: 'sine', inicio: 740, fim: 1250, duracao: 0.15, volume: 0.18 },
};

function prepararEfeitos() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  if (!contextoEfeitos) {
    contextoEfeitos = new Contexto();
    ganhoEfeitos = contextoEfeitos.createGain();
    ganhoEfeitos.gain.value = volumes.efeitos;
    ganhoEfeitos.connect(contextoEfeitos.destination);
  }
  if (contextoEfeitos.state === 'suspended') {
    contextoEfeitos.resume().catch(erro => console.error('Falha ao ativar os efeitos sonoros:', erro));
  }
  return contextoEfeitos;
}

// Desbloqueia os efeitos na primeira interação, inclusive em navegadores móveis.
window.addEventListener('pointerdown', prepararEfeitos, { once: true });
window.addEventListener('keydown', prepararEfeitos, { once: true });

export function tocarEfeitoEletronico(nome) {
  const som = SONS_ELETRONICOS[nome];
  if (!som || volumes.efeitos === 0) return;
  const contexto = prepararEfeitos();
  if (!contexto || contexto.state !== 'running') return;
  const agora = contexto.currentTime;
  const oscilador = contexto.createOscillator();
  const envelope = contexto.createGain();
  oscilador.type = som.onda;
  oscilador.frequency.setValueAtTime(som.inicio, agora);
  oscilador.frequency.exponentialRampToValueAtTime(som.fim, agora + som.duracao);
  envelope.gain.setValueAtTime(0, agora);
  envelope.gain.linearRampToValueAtTime(som.volume, agora + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.001, agora + som.duracao);
  oscilador.connect(envelope).connect(ganhoEfeitos);
  oscilador.start(agora);
  oscilador.stop(agora + som.duracao);
  oscilador.onended = () => { oscilador.disconnect(); envelope.disconnect(); };
}

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
  if (ganhoEfeitos) ganhoEfeitos.gain.value = volumes.efeitos;

  for (const { audio, base } of efeitos) {
    audio.volume = base * volumes.efeitos;
  }

  for (const ganho of ganhosMusica) {
    ganho.gain.value = VOLUME_BASE_MUSICA * volumes.musica;
  }
}
