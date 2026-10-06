# Base do jogo — parte do Marlon

Esta é a entrega local de estrutura e integração da primeira sprint. O objetivo é disponibilizar uma página executável, com Canvas, ciclo central e desenho de teste, pronta para receber os módulos da equipe.

## 1. O que está implementado nesta entrega

| Entrega do Marlon | Onde está |
| --- | --- |
| Estrutura inicial de arquivos e pastas | `src`, `styles` e `assets` |
| Página, Canvas e espaço para controles móveis | `index.html` |
| Apresentação adaptável à tela | `styles/main.css` |
| Inicialização do Canvas e contexto 2D | `src/main.js` |
| Ciclo do jogo e tempo entre quadros | `src/game.js` |
| Retângulo de teste | Desenho padrão de `src/game.js` |
| Pontos para integrar os módulos | Funções recebidas por `startGame` |
| Instruções para executar e conferir | Este README |

A base exibe um retângulo vermelho parado. O ciclo limpa e redesenha a superfície a cada quadro. Os botões reservados estão desativados, aguardando o módulo de entradas.

## 2. Como executar no computador

Abra o terminal na pasta `ccxp`. É necessário Python 3 para servir os arquivos e um navegador com suporte a módulos JavaScript. O projeto não utiliza bibliotecas externas nem exige instalação de pacotes.

Execute:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

No Windows, se `python3` não estiver disponível, tente:

```bash
py -m http.server 8000 --bind 127.0.0.1
```

Abra **http://localhost:8000**. Mantenha o terminal aberto durante o uso; `Ctrl+C` encerra o servidor.

O servidor é necessário porque `main.js` utiliza `import` para carregar `game.js`. Abrir o HTML diretamente como arquivo pode bloquear o carregamento dos módulos.

Se a porta 8000 estiver ocupada, encerre o servidor anterior ou utilize outra porta, como 8001, no comando e no endereço do navegador.

### Conferir no celular

Coloque computador e celular na mesma rede Wi-Fi. Encerre o servidor anterior e execute:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Descubra o IP local do computador, por exemplo com `hostname -I` no Linux ou `ipconfig` no Windows. No celular, abra `http://IP_DO_COMPUTADOR:8000`, substituindo o nome pelo endereço encontrado.

No celular, `localhost` aponta para o próprio celular. É preciso usar o IP do computador que está executando o servidor.

## 3. Estrutura preparada

```text
ccxp/
├── index.html
├── README.md
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   ├── game.js
│   ├── input.js
│   ├── player.js
│   ├── level.js
│   └── collisions.js
└── assets/
    ├── characters/
    ├── tiles/
    └── ui/
```

O código da base está em `index.html`, `styles/main.css`, `src/main.js` e `src/game.js`.

`input.js` e `player.js` ficam reservados para Pedro; `level.js` e `collisions.js`, para Dudu. Atualmente possuem somente comentários de orientação. As pastas de imagens ficam reservadas para Kelvis. Criar esses espaços faz parte da preparação da estrutura comum.

## 4. Página e apresentação

`index.html` monta três áreas: cabeçalho com estado da inicialização, Canvas e painel reservado para controles móveis.

O Canvas é identificado por `id="game-canvas"`. Os atributos `width="960"` e `height="540"` definem sua resolução interna. O texto dentro do elemento serve como alternativa se o navegador não oferecer suporte ao Canvas.

O script usa `type="module"` para permitir `import` e `export`. Módulos aguardam a leitura do HTML antes de executar.

O painel dos controles fica fora do Canvas. Seus botões possuem `data-action` com os nomes combinados: `esquerda`, `direita`, `pulo` e `agachamento`. Esses atributos são identificações para a futura integração; a base não captura os comandos.

O CSS acompanha a largura disponível, mantendo `height: auto` no Canvas para preservar a proporção 16:9. Em telas baixas na horizontal, o painel fica ao lado; nas demais, fica abaixo. A aparência atual serve de referência para receber o design da equipe.

### Coordenadas internas

- A origem `(0, 0)` fica no canto superior esquerdo.
- `x` aumenta para a direita.
- `y` aumenta para baixo.
- Posições e dimensões usam os pixels internos de 960 × 540.

Se o Canvas aparecer com 480 × 270 na tela, seus desenhos continuam sendo calculados em 960 × 540. A redução é visual. O JavaScript não altera `canvas.width` e `canvas.height` ao redimensionar a janela.

## 5. Inicialização em main.js

`main.js` importa `startGame`, encontra o Canvas e solicita o contexto 2D:

```js
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
```

O contexto oferece as ferramentas para desenhar formas, textos e imagens. O código verifica se o elemento e o contexto estão disponíveis e inicia o ciclo com `startGame(canvas, context)`.

Se a inicialização funciona, a mensagem da página muda para “Base carregada. Retângulo de teste em exibição.” Se falha, o usuário recebe uma orientação e o console registra o detalhe.

Os eventos `pagehide` e `pageshow` interrompem o trabalho ao sair da página e retomam se o navegador a restaurar. A função de início evita criar um segundo ciclo quando o primeiro já está ativo.

## 6. Ciclo central em game.js

Cada chamada do ciclo segue esta ordem:

1. Calcula o tempo desde o quadro anterior.
2. Lê as ações por meio do ponto de integração.
3. Chama a atualização do personagem.
4. Chama a resolução das colisões.
5. Limpa o Canvas.
6. Chama o desenho do estado resultante.
7. Agenda o próximo quadro com `requestAnimationFrame`.

`requestAnimationFrame` agenda a função para a próxima atualização da tela. A primeira chamada acontece ao iniciar o jogo; as seguintes são agendadas no fim do ciclo.

### Tempo entre quadros

O navegador informa o tempo em milissegundos. A diferença entre os horários é convertida para segundos:

```js
(currentTime - previousTime) / 1000
```

Uma diferença de 16 milissegundos corresponde a `0.016` segundo. Os módulos de movimentação poderão utilizar esse intervalo para calcular deslocamentos a partir de velocidades em pixels por segundo.

O primeiro quadro usa intervalo zero. O valor é limitado a `0.05` segundo para evitar uma atualização muito grande após uma interrupção. Uma mudança de visibilidade reinicia o relógio, e o primeiro quadro seguinte usa zero.

### Desenho de teste

O contexto é limpo com `clearRect` antes de cada desenho. O padrão de teste é:

```js
context.fillStyle = '#e63946';
context.fillRect(100, 100, 50, 80);
```

O retângulo começa em `(100, 100)`, possui 50 pixels de largura e 80 de altura. O fundo azul vem do CSS e reaparece nas regiões limpas.

### Controle da execução técnica

`startGame` retorna um objeto com:

- `start()`: inicia a execução; se já estiver ativa, não cria outra repetição.
- `stop()`: interrompe o ciclo e cancela o quadro pendente.
- `destroy()`: também remove o observador de visibilidade e encerra definitivamente a instância.

Essas funções organizam a execução da base. A interface e as regras de pausa da fase pertencem à etapa posterior do plano.

## 7. Pontos de integração

O terceiro argumento de `startGame` é opcional e recebe quatro funções:

| Função | Argumentos | Papel no ciclo |
| --- | --- | --- |
| `readActions` | Nenhum | Retorna as ações do módulo de entradas. |
| `updatePlayer` | `actions`, `deltaTime` | Chama o módulo de movimentação. |
| `resolveCollisions` | `deltaTime` | Chama o módulo de colisões após o movimento. |
| `drawScene` | `context`, `canvas` | Desenha o estado atualizado. |

Os módulos serão ligados em `main.js` quando suas entregas estiverem prontas. As funções podem compartilhar as referências do personagem e do cenário criadas nesse arquivo.

Por enquanto, a leitura retorna as quatro ações desligadas; movimentação e colisões utilizam funções vazias; o desenho utiliza o retângulo de teste. `EMPTY_ACTIONS` é um objeto reutilizado e protegido contra alterações acidentais.

Os nomes dessas funções são pontos de conexão do ciclo. Eles não implementam a movimentação, a captura de teclado/toque ou os contatos com obstáculos.

Antes de conectar cada entrega, combine com seu responsável a assinatura das funções e os dados compartilhados. O ciclo fornece a sequência e o tempo entre quadros.

## 8. Conferência da sua entrega

- Abrir pelo servidor e visualizar o retângulo vermelho e a mensagem de inicialização.
- Redimensionar a página e confirmar a proporção 16:9.
- Confirmar que a resolução interna permanece 960 × 540.
- Conferir a área reservada de controles na vertical e na horizontal.
- Verificar o cálculo do tempo e a ordem dos pontos de integração.
- Mudar de aba e retornar, conferindo a continuidade do desenho.
- Conferir o console para erros de inicialização ou importação.

A confirmação de execução nos aparelhos de cada integrante deve ser feita pela própria pessoa. A fase jogável será validada após a integração das entregas da equipe.
