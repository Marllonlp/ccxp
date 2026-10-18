// Banco de desafios de Python. Segue o roteiro de exercicios_python_5_niveis_revisado.pdf (pacote da ADA):
// Nível 1: variáveis e print(); Nível 2: input() e operações; Nível 3: if/else; Nível 4: for e while;
// Nível 5: revisão geral e operadores lógicos (and, or).
// Cada desafio tem um id no formato F<fase>-<categoria><número>, ligado a um elemento da fase
// (level.js para a Fase 1, fasesExtra.js para as outras):
// Pontes e monstros usam o computador de mesmo id; corações oferecem a pergunta ao toque:
// - V (corações): Acertou: recupera 1 vida. Errou: o coração some.
// - M (monstros): Acertou: o Byte lança o poder </> e derrota o sentinela ou a planta. Errou: ele continua no lugar.
// - P (pontes): Errou: tenta de novo até acertar. Acertou: surge a ponte.
// No código, ___ marca a lacuna. `correta` é o índice da alternativa certa (0 = A).
// `porqueErrado` explica, pelo índice, por que cada alternativa errada não serve.

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
    porqueErrado: {
      0: 'input() serve para o programa esperar o jogador digitar alguma coisa. Ele recebe informação, mas não mostra nenhuma mensagem na tela.',
      2: 'mostrar não é um comando do Python. O Python só entende os comandos que já existem na linguagem, então essa linha daria erro.',
    },
  },
  'F1-M1': {
    categoria: 'monstro',
    titulo: 'Apresentação',
    enunciado: 'O que colocar no print para aparecer Byte na tela?',
    codigo: 'nome = "Byte"\nprint(___)',
    alternativas: ['"nome"', 'nome', 'Byte'],
    correta: 1,
    explicacao: 'Sem aspas, nome é a variável e mostra o que ela guarda. Com aspas, apareceria a palavra nome.',
    porqueErrado: {
      0: 'Entre aspas, "nome" deixa de ser a variável e vira um texto qualquer. O print mostraria a própria palavra nome, e não o que a variável guarda.',
      2: 'Sem aspas, o Python acha que Byte é o nome de uma variável. Como nenhuma variável chamada Byte foi criada, o programa daria erro.',
    },
  },
  'F1-V1': {
    categoria: 'vida',
    titulo: 'Minha idade',
    enunciado: 'Qual opção guarda a idade 12 como NÚMERO?',
    codigo: 'idade = ___',
    alternativas: ['"12"', '12', 'doze'],
    correta: 1,
    explicacao: 'Número vai sem aspas. "12" entre aspas é um texto, e doze sem aspas seria uma variável que não existe.',
    porqueErrado: {
      0: 'Tudo o que está entre aspas é texto, mesmo que pareça número. Com "12" guardado como texto, não daria para fazer contas com a idade.',
      2: 'Uma palavra sem aspas é tratada como nome de variável. Como não existe nenhuma variável chamada doze, o programa daria erro.',
    },
  },
  'F1-V2': {
    categoria: 'vida',
    titulo: 'Mais uma chance',
    enunciado: 'Qual comando mostra o valor guardado na variável vidas?',
    codigo: 'vidas = 2\n___',
    alternativas: ['print("vidas")', 'print(vidas)', 'vidas(print)'],
    correta: 1,
    explicacao: 'print(vidas) mostra o número 2. Com aspas, seria exibida a palavra vidas.',
    porqueErrado: {
      0: 'As aspas transformam vidas em um texto comum. O print mostraria a palavra vidas na tela, e não o número guardado dentro da variável.',
      2: 'A ordem está invertida. No Python, o comando vem primeiro e o que ele vai usar fica dentro dos parênteses.',
    },
  },
  'F1-M2': {
    categoria: 'monstro',
    titulo: 'Meu personagem',
    enunciado: 'O que aparece na tela?',
    codigo: 'nome = "Byte"\npontos = 50\nprint(nome, pontos)',
    alternativas: ['nome pontos', 'Byte 50', 'Byte, 50'],
    correta: 1,
    explicacao: 'O print mostra o valor de cada variável, separado por um espaço: Byte 50.',
    porqueErrado: {
      0: 'Sem aspas, nome e pontos são variáveis. O print não mostra o nome delas, e sim o valor que cada uma guarda.',
      2: 'A vírgula dentro do print só separa os valores no código. Ela não aparece na tela: o print coloca um espaço no lugar.',
    },
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
    porqueErrado: {
      0: 'print() mostra uma mensagem na tela, mas não para o programa para esperar o jogador. Assim, nome não receberia nada digitado.',
      2: 'int() só transforma um texto em número. Ele não lê nada do teclado, então o jogador não teria onde digitar.',
    },
  },
  'F2-M1': {
    categoria: 'monstro',
    titulo: 'Texto em número',
    enunciado: 'O input() devolve texto. Como transformar o que foi digitado em número inteiro?',
    codigo: 'n = ___(input())',
    alternativas: ['int', 'str', 'print'],
    correta: 0,
    explicacao: 'int() transforma o texto em número inteiro, para dar para fazer contas.',
    porqueErrado: {
      1: 'str() transforma um valor em texto. Como o que foi digitado já chega como texto, nada mudaria e ainda não daria para fazer contas.',
      2: 'print() só mostra algo na tela. Ele não transforma o valor, então n não viraria um número.',
    },
  },
  'F2-M2': {
    categoria: 'monstro',
    titulo: 'Dobro de um número',
    enunciado: 'Complete para mostrar o dobro de n.',
    codigo: 'n = 7\nprint(n ___ 2)',
    alternativas: ['+', '*', '/'],
    correta: 1,
    explicacao: 'O * multiplica: 7 * 2 = 14.',
    porqueErrado: {
      0: 'O + faz uma soma. 7 + 2 dá 9, que não é o dobro de 7.',
      2: 'O / faz uma divisão. 7 / 2 dá 3.5, que é a metade de 7, e não o dobro.',
    },
  },
  'F2-V1': {
    categoria: 'vida',
    titulo: 'Idade futura',
    enunciado: 'O que aparece na tela?',
    codigo: 'idade = 12\nprint(idade + 5)',
    alternativas: ['125', '17', 'idade + 5'],
    correta: 1,
    explicacao: 'idade guarda um número, então o + soma: 12 + 5 = 17.',
    porqueErrado: {
      0: '125 seria o resultado de colar dois textos, um do lado do outro. Mas idade guarda um número, então o + faz uma conta.',
      2: 'Como idade + 5 está sem aspas, o print não mostra esse texto. Primeiro ele calcula a conta e depois mostra o resultado.',
    },
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
    porqueErrado: {
      0: 'Um = sozinho serve para guardar um valor numa variável, e não para comparar. Dentro do if, o Python daria erro.',
      2: '!= quer dizer "diferente de". Com ele, a porta abriria para qualquer senha que NÃO fosse "byte", o contrário do que queremos.',
    },
  },
  'F3-V1': {
    categoria: 'vida',
    titulo: 'Os dois-pontos',
    enunciado: 'O que falta no fim da linha do if?',
    codigo: 'if idade >= 18___\n    print("Maior de idade")',
    alternativas: [';', ':', '.'],
    correta: 1,
    explicacao: 'Depois da condição do if (e do else) vêm os dois-pontos.',
    porqueErrado: {
      0: 'O ponto e vírgula não abre o bloco do if no Python. Sem o sinal certo, o Python não sabe onde começam as linhas de dentro do if.',
      2: 'O ponto não tem a função de abrir blocos no Python. A linha do if ficaria incompleta e daria erro.',
    },
  },
  'F3-M2': {
    categoria: 'monstro',
    titulo: 'Número positivo',
    enunciado: 'O que aparece na tela?',
    codigo: 'n = -3\nif n > 0:\n    print("Positivo")\nelse:\n    print("Negativo")',
    alternativas: ['Positivo', 'Negativo', 'Positivo e Negativo'],
    correta: 1,
    explicacao: '-3 não é maior que 0, então o programa segue o caminho do else. Só um dos caminhos roda.',
    porqueErrado: {
      0: 'Positivo só aparece quando n > 0 é verdade. Como -3 é menor que 0, essa condição é falsa e o print de dentro do if é pulado.',
      2: 'O if e o else nunca rodam juntos. O programa testa a condição uma vez e segue só um dos dois caminhos.',
    },
  },
  'F3-P1': {
    categoria: 'ponte',
    titulo: 'Aprovado ou reprovado',
    enunciado: 'Complete para aprovar quem tirou 6 ou mais.',
    codigo: 'nota = 7\nif nota ___ 6:\n    print("Aprovado")',
    alternativas: ['>=', '<', '=='],
    correta: 0,
    explicacao: '>= quer dizer maior ou igual: quem tira 6 também passa.',
    porqueErrado: {
      1: '< quer dizer "menor que". Com ele, seriam aprovados só os alunos que tiraram menos de 6, o contrário do que queremos.',
      2: '== só é verdade quando a nota é exatamente 6. Quem tirou 7, 8 ou mais ficaria reprovado.',
    },
  },
  'F3-V2': {
    categoria: 'vida',
    titulo: 'Desafio da pontuação',
    enunciado: 'Qual palavra abre o caminho do SENÃO?',
    codigo: 'if pontos >= 100:\n    print("Você venceu!")\n___:\n    print("Continue tentando!")',
    alternativas: ['else', 'if', 'while'],
    correta: 0,
    explicacao: 'O else roda quando a condição do if é falsa.',
    porqueErrado: {
      1: 'if sempre começa uma nova condição e precisa de uma comparação logo depois. Ele não serve para o caminho de quando a condição é falsa.',
      2: 'while é um laço de repetição: ele repete um bloco várias vezes. Ele não cria o caminho alternativo de um if.',
    },
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
    porqueErrado: {
      0: 'O range(4) começa a contar do 0, e não do 1. Contando 0, 1, 2 e 3, o laço roda mais vezes do que parece.',
      2: 'O range para antes de chegar ao número entre parênteses. Por isso o laço não dá tantas voltas assim.',
    },
  },
  'F4-M2': {
    categoria: 'monstro',
    titulo: 'Contagem',
    enunciado: 'Complete para mostrar os números de 1 até 10.',
    codigo: 'for i in range(1, ___):\n    print(i)',
    alternativas: ['10', '11', '9'],
    correta: 1,
    explicacao: 'O range para ANTES do último número: range(1, 11) vai de 1 até 10.',
    porqueErrado: {
      0: 'O range para antes do último número. Com 10, a contagem pararia no 9, e o 10 nunca apareceria.',
      2: 'O range para antes do último número. Com 9, a contagem pararia no 8, e faltariam o 9 e o 10.',
    },
  },
  'F4-P1': {
    categoria: 'ponte',
    titulo: 'Enquanto for verdade',
    enunciado: 'Qual laço repete ENQUANTO a condição for verdadeira?',
    codigo: 'n = 10\n___ n > 0:\n    print(n)\n    n = n - 1',
    alternativas: ['if', 'while', 'else'],
    correta: 1,
    explicacao: 'O while repete enquanto a condição for verdadeira. O if só decide uma vez.',
    porqueErrado: {
      0: 'O if testa a condição uma única vez. Ele não volta para testar de novo, então o bloco não se repetiria.',
      2: 'else não tem condição e só existe junto de um if. Ele não sabe testar n > 0 nem repetir nada.',
    },
  },
  'F4-V1': {
    categoria: 'vida',
    titulo: 'Tabuada',
    enunciado: 'Complete para mostrar a tabuada do 3.',
    codigo: 'n = 3\nfor i in range(1, 11):\n    print(n ___ i)',
    alternativas: ['+', '*', '-'],
    correta: 1,
    explicacao: 'Tabuada é multiplicação: 3 * 1, 3 * 2, ..., 3 * 10.',
    porqueErrado: {
      0: 'Com + o programa faria somas: 3 + 1, 3 + 2... Na tabuada, cada número é multiplicado, e não somado.',
      2: 'Com - o programa faria subtrações: 3 - 1, 3 - 2... Na tabuada, cada número é multiplicado, e não subtraído.',
    },
  },
  'F4-V2': {
    categoria: 'vida',
    titulo: 'Contagem regressiva',
    enunciado: 'O que faz este while terminar?',
    codigo: 'n = 10\nwhile n > 0:\n    print(n)\n    n = n ___ 1\nprint("Começou!")',
    alternativas: ['+', '-', '*'],
    correta: 1,
    explicacao: 'Diminuindo n, uma hora n > 0 fica falso e o laço para. Com +, ele nunca terminaria.',
    porqueErrado: {
      0: 'Somando 1, n só cresce. Então n > 0 continua sempre verdadeiro e o laço nunca termina.',
      2: 'Multiplicar por 1 não muda o valor de n. A condição continua verdadeira para sempre e o laço não para.',
    },
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
    porqueErrado: {
      1: '11 seria o resultado de a + b. Repare no sinal da primeira conta: ele não é de soma.',
      2: 'A primeira conta está certa, mas a segunda não. 11 seria uma soma, e o sinal da segunda conta é outro.',
    },
  },
  'F5-P1': {
    categoria: 'ponte',
    titulo: 'Cadastro de jogador',
    enunciado: 'Se o jogador digitar Ana e depois 12, o que aparece?',
    codigo: 'nome = input()\nidade = int(input())\nprint(nome, idade)',
    alternativas: ['nome idade', 'Ana 12', 'Ana12'],
    correta: 1,
    explicacao: 'Cada input() guarda o que foi digitado, e o print mostra os valores: Ana 12.',
    porqueErrado: {
      0: 'Sem aspas, nome e idade são variáveis. O print não mostra os nomes delas, e sim o que o jogador digitou.',
      2: 'O print não cola os valores um no outro. Quando há uma vírgula entre eles, ele coloca um espaço na tela.',
    },
  },
  'F5-M2': {
    categoria: 'monstro',
    titulo: 'Os dois precisam valer',
    enunciado: 'A porta abre?',
    codigo: 'idade = 20\nsenha = "abc"\nif idade >= 18 and senha == "byte":\n    print("Acesso permitido")',
    alternativas: ['Sim, a idade basta', 'Não, a senha está errada', 'Dá erro'],
    correta: 1,
    explicacao: 'Com and, as DUAS condições precisam ser verdadeiras. A idade passa, mas a senha não.',
    porqueErrado: {
      0: 'Com and, não basta uma condição: as duas precisam ser verdadeiras. Mesmo com a idade certa, a outra condição também conta.',
      2: 'O código está escrito corretamente e não dá erro. A condição apenas é falsa, então o print é pulado.',
    },
  },
  'F5-V1': {
    categoria: 'vida',
    titulo: 'Basta um',
    enunciado: 'Qual operador abre a porta com a chave OU com a senha?',
    codigo: 'if tem_chave ___ tem_senha:\n    print("Porta aberta")',
    alternativas: ['and', 'or', 'not'],
    correta: 1,
    explicacao: 'Com or, basta UMA das condições ser verdadeira.',
    porqueErrado: {
      0: 'Com and, as duas coisas precisariam ser verdade ao mesmo tempo. Quem tivesse só a chave, ou só a senha, ficaria de fora.',
      2: 'not inverte uma condição: o que é verdade vira falso. Ele não serve para juntar duas condições.',
    },
  },
  'F5-V2': {
    categoria: 'vida',
    titulo: 'Contagem numérica',
    enunciado: 'Se o jogador digitar 3, o que aparece?',
    codigo: 'n = int(input())\nfor i in range(1, n + 1):\n    print(i)',
    alternativas: ['1 2 3', '0 1 2', '1 2'],
    correta: 0,
    explicacao: 'range(1, n + 1) vai de 1 até n. Com n = 3: 1, 2 e 3.',
    porqueErrado: {
      1: 'O range começa do primeiro número que está entre parênteses, e esse número é 1. O 0 nunca aparece.',
      2: 'O n + 1 faz o range ir até o próprio n. Sem contar o último número, a contagem ficaria incompleta.',
    },
  },
};
