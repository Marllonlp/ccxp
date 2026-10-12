// Banco de desafios de Python (banco_de_desafios_python.pdf).
// Cada desafio tem um id no formato F<fase>-<categoria><número>, ligado a um elemento da fase em level.js:
// - V (corações): ao tocar o coração. Acertou: recupera 1 vida. Errou: o coração some.
// - M (monstros): ao chegar perto do sentinela ou da planta. Acertou: o Byte lança o poder </> e derrota o
//   monstro. Errou: ele continua no lugar.
// - P (pontes): na borda do vão. Errou: tenta de novo até acertar. Acertou: surge a ponte.
// No código, ___ marca a lacuna. `correta` é o índice da alternativa certa (0 = A).
// Por enquanto só a Fase 1, a única desenvolvida.

export const BANCO_DESAFIOS = {
  // --- Fase 1: Laboratório das Variáveis ---
  'F1-V1': {
    categoria: 'vida',
    titulo: 'Vidas iniciais',
    enunciado: 'O jogador começa com 3 vidas. Complete a variável.',
    codigo: 'vidas = ___',
    alternativas: ['1', '3', '0'],
    correta: 1,
    explicacao: 'O sinal = guarda o valor da direita na variável da esquerda.',
  },
  'F1-V2': {
    categoria: 'vida',
    titulo: 'Atualizar as vidas',
    enunciado: 'O jogador tinha 1 vida e recuperou 1. Qual é o novo valor?',
    codigo: 'vidas = 1\nvidas = ___',
    alternativas: ['2', '1', '3'],
    correta: 0,
    explicacao: 'Uma nova atribuição troca o valor antigo: 1 + 1 = 2.',
  },
  'F1-M1': {
    categoria: 'monstro',
    titulo: 'Valor do ataque',
    enunciado: 'Qual valor será enviado ao comando atacar()?',
    codigo: 'dano = 4\natacar(dano)',
    alternativas: ['2', '4', '6'],
    correta: 1,
    explicacao: 'Usar a variável dano envia o valor guardado nela: 4.',
  },
  'F1-M2': {
    categoria: 'monstro',
    titulo: 'Estado do escudo',
    enunciado: 'Complete com o valor booleano que desliga o escudo.',
    codigo: 'escudo_ativo = ___',
    alternativas: ['True', '"False"', 'False'],
    correta: 2,
    explicacao: 'False, sem aspas, é booleano. "False" entre aspas é só um texto.',
  },
  // Pergunta extra, fora do PDF: guarda a planta da saída da fase.
  'F1-M3': {
    categoria: 'monstro',
    titulo: 'Nome do poder',
    enunciado: 'Para lançar o poder na planta, guarde-o em uma variável. Qual nome é válido em Python?',
    codigo: '___ = 10',
    alternativas: ['poder ataque', '2poder', 'poder_ataque'],
    correta: 2,
    explicacao: 'Nomes não podem ter espaços nem começar com número. Use _ para separar as palavras.',
  },
  'F1-P1': {
    categoria: 'ponte',
    titulo: 'Energia armazenada',
    enunciado: 'A ponte precisa de 9 unidades de energia. Complete a variável.',
    codigo: 'energia = ___',
    alternativas: ['3', '0', '9'],
    correta: 2,
    explicacao: 'A variável energia precisa guardar o valor 9.',
  },
  'F1-P2': {
    categoria: 'ponte',
    titulo: 'Transferir um valor',
    enunciado: 'Copie a energia da bateria para a variável da ponte.',
    codigo: 'bateria = 6\nenergia_ponte = ___',
    alternativas: ['"bateria"', 'bateria', '0'],
    correta: 1,
    explicacao: 'Sem aspas, bateria é a variável e copia o 6. Com aspas, seria só o texto.',
  },
};
