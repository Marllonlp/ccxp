// Banco de desafios de Python. Segue o roteiro de exercicios_python_5_niveis_revisado.pdf (pacote da ADA):
// Nível 1: variáveis e print(); Nível 2: input() e operações; Nível 3: if/else; Nível 4: for e while;
// Nível 5: revisão geral e operadores lógicos (and, or).
// Cada desafio tem um id no formato F<fase>-<categoria><número>, ligado a um elemento da fase
// (level.js para a Fase 1, fasesExtra.js para as outras):
// A pergunta só abre no computador de desafio com o mesmo id (botão ABRIR DESAFIO):
// - V (corações): Acertou: recupera 1 vida. Errou: o coração some.
// - M (monstros): Acertou: o Byte lança o poder </> e derrota o sentinela ou a planta. Errou: ele continua no lugar.
// - P (pontes): Errou: tenta de novo até acertar. Acertou: surge a ponte.
// No código, ___ marca a lacuna. `correta` é o índice da alternativa certa (0 = A).

export const BANCO_DESAFIOS = {
  // --- Fase 1: variáveis e print() ---
  'F1-P1': {
    categoria: 'ponte',
    titulo: 'Meu primeiro programa',
    enunciado: 'Você terá que criar a ponte. Para isso, faça seu primeiro programa: qual comando mostra a mensagem na tela?',
    codigo: '___("Olá, mundo!")',
    alternativas: ['input', 'print', 'mostrar'],
    correta: 1,
    explicacao: 'print() mostra na tela o que está entre os parênteses.',
  },
  'F1-M1': {
    categoria: 'monstro',
    titulo: 'Apresentação',
    enunciado: 'O que colocar no print para aparecer Byte na tela?',
    codigo: 'nome = "Byte"\nprint(___)',
    alternativas: ['"nome"', 'nome', 'Byte'],
    correta: 1,
    explicacao: 'Sem aspas, nome é a variável e mostra o que ela guarda. Com aspas, apareceria a palavra nome.',
  },
  'F1-V1': {
    categoria: 'vida',
    titulo: 'Minha idade',
    enunciado: 'Qual opção guarda a idade 12 como NÚMERO?',
    codigo: 'idade = ___',
    alternativas: ['"12"', '12', 'doze'],
    correta: 1,
    explicacao: 'Número vai sem aspas. "12" entre aspas é um texto, e doze sem aspas seria uma variável que não existe.',
  },
  'F1-M2': {
    categoria: 'monstro',
    titulo: 'Meu personagem',
    enunciado: 'O que aparece na tela?',
    codigo: 'nome = "Byte"\npontos = 50\nprint(nome, pontos)',
    alternativas: ['nome pontos', 'Byte 50', 'Byte, 50'],
    correta: 1,
    explicacao: 'O print mostra o valor de cada variável, separado por um espaço: Byte 50.',
  },

  // --- Fase 2: input() e operações matemáticas ---
  'F2-P1': {
    categoria: 'ponte',
    titulo: 'Qual é o seu nome?',
    enunciado: 'Qual comando espera o jogador digitar alguma coisa?',
    codigo: 'nome = ___()\nprint("Bem-vindo,", nome)',
    alternativas: ['print', 'input', 'int'],
    correta: 1,
    explicacao: 'input() espera o jogador digitar e devolve o que foi escrito.',
  },
  'F2-M1': {
    categoria: 'monstro',
    titulo: 'Texto em número',
    enunciado: 'O input() devolve texto. Como transformar o que foi digitado em número inteiro?',
    codigo: 'n = ___(input())',
    alternativas: ['int', 'str', 'print'],
    correta: 0,
    explicacao: 'int() transforma o texto em número inteiro, para dar para fazer contas.',
  },
  'F2-M2': {
    categoria: 'monstro',
    titulo: 'Dobro de um número',
    enunciado: 'Complete para mostrar o dobro de n.',
    codigo: 'n = 7\nprint(n ___ 2)',
    alternativas: ['+', '*', '/'],
    correta: 1,
    explicacao: 'O * multiplica: 7 * 2 = 14.',
  },
  'F2-V1': {
    categoria: 'vida',
    titulo: 'Idade futura',
    enunciado: 'O que aparece na tela?',
    codigo: 'idade = 12\nprint(idade + 5)',
    alternativas: ['125', '17', 'idade + 5'],
    correta: 1,
    explicacao: 'idade guarda um número, então o + soma: 12 + 5 = 17.',
  },

  // --- Fase 3: condições (if e else) ---
  'F3-M1': {
    categoria: 'monstro',
    titulo: 'Senha correta',
    enunciado: 'Qual sinal COMPARA se a senha é igual a "byte"?',
    codigo: 'if senha ___ "byte":\n    print("Entrou")',
    alternativas: ['=', '==', '!='],
    correta: 1,
    explicacao: '== compara dois valores. Um = sozinho só guarda valor numa variável.',
  },
  'F3-V1': {
    categoria: 'vida',
    titulo: 'Os dois-pontos',
    enunciado: 'O que falta no fim da linha do if?',
    codigo: 'if idade >= 18___\n    print("Maior de idade")',
    alternativas: [';', ':', '.'],
    correta: 1,
    explicacao: 'Depois da condição do if (e do else) vêm os dois-pontos.',
  },
  'F3-M2': {
    categoria: 'monstro',
    titulo: 'Número positivo',
    enunciado: 'O que aparece na tela?',
    codigo: 'n = -3\nif n > 0:\n    print("Positivo")\nelse:\n    print("Negativo")',
    alternativas: ['Positivo', 'Negativo', 'Positivo e Negativo'],
    correta: 1,
    explicacao: '-3 não é maior que 0, então o programa segue o caminho do else. Só um dos caminhos roda.',
  },
  'F3-P1': {
    categoria: 'ponte',
    titulo: 'Aprovado ou reprovado',
    enunciado: 'Complete para aprovar quem tirou 6 ou mais.',
    codigo: 'nota = 7\nif nota ___ 6:\n    print("Aprovado")',
    alternativas: ['>=', '<', '=='],
    correta: 0,
    explicacao: '>= quer dizer maior ou igual: quem tira 6 também passa.',
  },
  'F3-V2': {
    categoria: 'vida',
    titulo: 'Desafio da pontuação',
    enunciado: 'Qual palavra abre o caminho do SENÃO?',
    codigo: 'if pontos >= 100:\n    print("Você venceu!")\n___:\n    print("Continue tentando!")',
    alternativas: ['else', 'if', 'while'],
    correta: 0,
    explicacao: 'O else roda quando a condição do if é falsa.',
  },

  // --- Fase 4: repetições (for e while) ---
  'F4-M1': {
    categoria: 'monstro',
    titulo: 'Quantas vezes?',
    enunciado: 'Quantas vezes aparece Pulo! na tela?',
    codigo: 'for i in range(4):\n    print("Pulo!")',
    alternativas: ['3', '4', '5'],
    correta: 1,
    explicacao: 'range(4) gera 0, 1, 2 e 3: o for repete 4 vezes.',
  },
  'F4-M2': {
    categoria: 'monstro',
    titulo: 'Contagem',
    enunciado: 'Complete para mostrar os números de 1 até 10.',
    codigo: 'for i in range(1, ___):\n    print(i)',
    alternativas: ['10', '11', '9'],
    correta: 1,
    explicacao: 'O range para ANTES do último número: range(1, 11) vai de 1 até 10.',
  },
  'F4-P1': {
    categoria: 'ponte',
    titulo: 'Enquanto for verdade',
    enunciado: 'Qual laço repete ENQUANTO a condição for verdadeira?',
    codigo: 'n = 10\n___ n > 0:\n    print(n)\n    n = n - 1',
    alternativas: ['if', 'while', 'else'],
    correta: 1,
    explicacao: 'O while repete enquanto a condição for verdadeira. O if só decide uma vez.',
  },
  'F4-V1': {
    categoria: 'vida',
    titulo: 'Tabuada',
    enunciado: 'Complete para mostrar a tabuada do 3.',
    codigo: 'n = 3\nfor i in range(1, 11):\n    print(n ___ i)',
    alternativas: ['+', '*', '-'],
    correta: 1,
    explicacao: 'Tabuada é multiplicação: 3 * 1, 3 * 2, ..., 3 * 10.',
  },
  'F4-V2': {
    categoria: 'vida',
    titulo: 'Contagem regressiva',
    enunciado: 'O que faz este while terminar?',
    codigo: 'n = 10\nwhile n > 0:\n    print(n)\n    n = n ___ 1\nprint("Começou!")',
    alternativas: ['+', '-', '*'],
    correta: 1,
    explicacao: 'Diminuindo n, uma hora n > 0 fica falso e o laço para. Com +, ele nunca terminaria.',
  },

  // --- Fase 5: revisão geral e operadores lógicos ---
  'F5-M1': {
    categoria: 'monstro',
    titulo: 'Calculadora',
    enunciado: 'O que aparece na tela?',
    codigo: 'a = 8\nb = 3\nprint(a - b, a * b)',
    alternativas: ['5 24', '11 24', '5 11'],
    correta: 0,
    explicacao: '8 - 3 = 5 e 8 * 3 = 24.',
  },
  'F5-P1': {
    categoria: 'ponte',
    titulo: 'Cadastro de jogador',
    enunciado: 'Se o jogador digitar Ana e depois 12, o que aparece?',
    codigo: 'nome = input()\nidade = int(input())\nprint(nome, idade)',
    alternativas: ['nome idade', 'Ana 12', 'Ana12'],
    correta: 1,
    explicacao: 'Cada input() guarda o que foi digitado, e o print mostra os valores: Ana 12.',
  },
  'F5-M2': {
    categoria: 'monstro',
    titulo: 'Os dois precisam valer',
    enunciado: 'A porta abre?',
    codigo: 'idade = 20\nsenha = "abc"\nif idade >= 18 and senha == "byte":\n    print("Acesso permitido")',
    alternativas: ['Sim, a idade basta', 'Não, a senha está errada', 'Dá erro'],
    correta: 1,
    explicacao: 'Com and, as DUAS condições precisam ser verdadeiras. A idade passa, mas a senha não.',
  },
  'F5-V1': {
    categoria: 'vida',
    titulo: 'Basta um',
    enunciado: 'Qual operador abre a porta com a chave OU com a senha?',
    codigo: 'if tem_chave ___ tem_senha:\n    print("Porta aberta")',
    alternativas: ['and', 'or', 'not'],
    correta: 1,
    explicacao: 'Com or, basta UMA das condições ser verdadeira.',
  },
  'F5-V2': {
    categoria: 'vida',
    titulo: 'Contagem numérica',
    enunciado: 'Se o jogador digitar 3, o que aparece?',
    codigo: 'n = int(input())\nfor i in range(1, n + 1):\n    print(i)',
    alternativas: ['1 2 3', '0 1 2', '1 2'],
    correta: 0,
    explicacao: 'range(1, n + 1) vai de 1 até n. Com n = 3: 1, 2 e 3.',
  },
};
