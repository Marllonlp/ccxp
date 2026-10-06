// Responsável: Pedro. Arquivo reservado para estado e movimentação do personagem.
// As posições e dimensões usam os pixels internos do Canvas (960 × 540).
// A atualização será chamada pelo ciclo com ações e deltaTime em segundos.

// Estado do personagem
export const player = {
  x: 480, // Posição horizontal inicial (centro do canvas)
  y: 270, // Posição vertical inicial (centro do canvas)
  width: 50, // Largura do personagem
  height: 50, // Altura do personagem
  speed: 200 // Velocidade de movimentação (pixels por segundo)
};