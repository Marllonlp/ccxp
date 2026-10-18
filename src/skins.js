// Skins do Byte vendidas na Loja (dados do pacote assets/loja/loja_skins_pacote/skins.json).
// As animações ficam em assets/animacoes/skins/<id>/; o Clássico usa as de assets/animacoes/.
// tipo: 'padrao' (sempre liberada), 'compra' (preço em moedas), 'conquista' (condição do progresso)
// ou 'social' (liberada ao abrir o perfil `url`). `cor` é a borda do cartão na Loja.

export const SKINS = [
  { id: 'classico', cor: '#7dd3fc', nome: 'Byte Clássico', tipo: 'padrao', descricao: 'O visual original do Byte.' },
  { id: 'pythonista', cor: '#facc15', nome: 'Byte Pythonista', tipo: 'compra', preco: 40, descricao: 'Moletom azul e amarelo, as cores do Python.' },
  {
    id: 'hacker', cor: '#22c55e', nome: 'Byte Hacker', tipo: 'compra', preco: 30, efeito: 'rastro_terminal',
    descricao: 'Moletom preto e óculos de lente verde. O pulo deixa um rastro de caracteres de terminal.',
  },
  { id: 'astronauta', cor: '#fb923c', nome: 'Byte Astronauta', tipo: 'compra', preco: 60, descricao: 'Traje espacial branco e laranja, com capacete de vidro.' },
  {
    id: 'glitch', cor: '#e040fb', nome: 'Byte Glitch', tipo: 'compra', preco: 45, efeito: 'tremor_glitch',
    descricao: 'Infectado pelo Kernel Panic: o Byte treme e falha de vez em quando.',
  },
  { id: 'dourado', cor: '#fbbf24', nome: 'Byte Dourado', tipo: 'conquista', condicao: 'tres_estrelas_em_todos', requisito: '3 estrelas em todos os níveis' },
  { id: 'matador', cor: '#ef4444', nome: 'Matador de Vírus', tipo: 'conquista', condicao: 'chefe_derrotado', requisito: 'Derrote o Kernel Panic' },
  {
    id: 'pda', cor: '#a78bfa', nome: 'Byte Programadores do Amanhã', nomeCurto: 'Programadores do Amanhã', tipo: 'social',
    url: 'https://www.instagram.com/programadoresdoamanha/', requisito: 'Siga no Instagram',
  },
  {
    id: 'framework', cor: '#2dd4bf', nome: 'Byte Framework Digital', nomeCurto: 'Framework Digital', tipo: 'social',
    url: 'https://www.instagram.com/framework.digital/', requisito: 'Siga no Instagram',
  },
];

export const IDS_SKINS = new Set(SKINS.map((skin) => skin.id));

export function buscarSkin(id) {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

/** Condições das skins de conquista, lidas do progresso salvo. */
const CONDICOES = {
  tres_estrelas_em_todos: (progresso, totalNiveis) => (
    Array.from({ length: totalNiveis }, (_, i) => progresso.estrelas[i] ?? 0).every((estrelas) => estrelas === 3)
  ),
  chefe_derrotado: (progresso) => progresso.chefe_derrotado === true,
};

/** Verdadeiro se a skin pode ser equipada com o progresso atual. */
export function skinLiberada(skin, progresso, totalNiveis) {
  if (skin.tipo === 'padrao') return true;
  if (skin.tipo === 'compra') return progresso.skinsCompradas.includes(skin.id);
  if (skin.tipo === 'social') return progresso.skinsSociais.includes(skin.id);
  return CONDICOES[skin.condicao]?.(progresso, totalNiveis) === true;
}
