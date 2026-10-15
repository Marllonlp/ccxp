import { AnimacaoSprite } from './animacao.js';

// Quadros extraídos dos GIFs originais, preservando dimensões e duração em ms.
const dados = {
  byteParado: { largura: 96, altura: 96, quadros: 2, duracao: 1000 },
  byteCorrendo: { largura: 96, altura: 96, quadros: 8, duracao: 80 },
  bytePulando: { largura: 96, altura: 96, quadros: 2, duracao: 1000 },
  byteCaindo: { largura: 96, altura: 96, quadros: 2, duracao: 130 },
  byteAgachado: { largura: 96, altura: 96, quadros: 2, duracao: 500 },
  byteDano: { largura: 96, altura: 96, quadros: 3, duracao: 200 },
  byteMorte: { largura: 96, altura: 96, quadros: 3, duracao: 330 },
  vidaCheia: {
    arquivo: 'assets/characters/Imagens_Personagens/04_vidas_e_itens/02_vida.png',
    largura: 32, altura: 32, quadros: 1, duracao: 80,
  },
  vidaVazia: { largura: 32, altura: 32, quadros: 1, duracao: 80 },
  vidaUltima: { largura: 32, altura: 32, quadros: 2, duracao: 500 },
  poder: { largura: 16, altura: 15, quadros: 4, duracao: 80 },
  vidaItem: { largura: 16, altura: 16, quadros: 4, duracao: 200 },
  moeda: { largura: 16, altura: 16, quadros: 4, duracao: 140 },
  planta: { largura: 96, altura: 96, quadros: 12, duracao: 250 },
  plantaMorrendo: { largura: 96, altura: 96, quadros: 4, duracao: 250 },
  sentinela: { largura: 96, altura: 96, quadros: 4, duracao: 200 },
  sentinelaMorrendo: { largura: 96, altura: 96, quadros: 4, duracao: 250 },
};

// A demonstração e as fases compartilham as imagens, com tempos independentes.
export const sprites = Object.fromEntries(
  Object.entries(dados).map(([nome, animacao]) => [nome, new AnimacaoSprite({
    arquivo: `assets/animacoes/${nome}.png`,
    ...animacao,
  })]),
);
