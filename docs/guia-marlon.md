# Guia detalhado da parte do Marlon

Sua responsabilidade nesta sprint é preparar a base executável e conectar os módulos da equipe. Este guia explica o código entregue e como usá-lo na integração.

## 1. O caminho ao abrir o jogo

1. O navegador lê `index.html` e cria os elementos.
2. `styles/main.css` organiza a página e adapta a exibição do Canvas.
3. `main.js` encontra o Canvas e obtém o contexto 2D.
4. `main.js` chama `startGame`, importada de `game.js`.
5. `game.js` agenda o primeiro quadro.
6. Cada quadro calcula o tempo, lê ações, atualiza o personagem, resolve colisões e desenha.
7. O ciclo agenda o próximo quadro.

## 2. Entendendo index.html

### O cabeçalho do documento

- `<!DOCTYPE html>` indica um documento HTML atual.
- `lang="pt-BR"` informa o idioma.
- `charset="UTF-8"` permite acentos e outros caracteres.
- A configuração `viewport` adapta a largura da página à tela do celular.
- `link rel="stylesheet"` carrega o CSS.
- `script type="module"` permite usar `import` e `export`. Um módulo espera o HTML ser lido antes de executar.

### A superfície de desenho

```html
<canvas id="game-canvas" width="960" height="540">
  Seu navegador não oferece suporte ao Canvas.
</canvas>
```

`canvas` cria a superfície. O `id` permite encontrá-la pelo JavaScript. `width` e `height` definem a resolução interna: 960 × 540 pixels.

O canto superior esquerdo é `(0, 0)`. `x` aumenta para a direita; `y` aumenta para baixo. Posições e dimensões dos objetos precisam usar esse mesmo espaço.

No arquivo completo, `role="img"` e `aria-label` descrevem o desenho inicial para tecnologias assistivas. Atualize a descrição quando o conteúdo mudar; o Canvas não transmite automaticamente o significado de seus desenhos.

### Estado da inicialização

O elemento `game-status` começa com uma mensagem de carregamento. O JavaScript troca esse texto ao concluir a inicialização ou apresentar uma falha. `role="status"` identifica uma mensagem de estado.

### Espaço dos controles

O painel `.mobile-controls` fica fora do Canvas. Assim, a fase mantém sua superfície de desenho e os botões possuem espaço próprio.

Cada botão contém uma identificação:

```html
<button type="button" data-action="esquerda" disabled>←</button>
```

`data-action` permite que o módulo de entradas reconheça o comando. Os nomes combinados são `esquerda`, `direita`, `pulo` e `agachamento`.

Os botões estão desativados enquanto o módulo de teclado e toque não for integrado. Pedro conectará os eventos e habilitará os elementos. O visual atual é uma referência para receber o design do Kelvis.

O elemento `noscript` orienta o usuário se o JavaScript estiver desativado.

## 3. Entendendo styles/main.css

### Organização

`box-sizing: border-box` faz a largura e a altura declaradas incluírem preenchimento e bordas.

O `body` usa Flexbox para centralizar o conteúdo, tem pelo menos a altura da janela e mantém uma margem interna de 16 pixels.

`.game-shell` ocupa a largura disponível até 960 pixels. Sua grade separa cabeçalho, Canvas e controles com espaçamento.

### Resolução interna e tamanho visual

```css
#game-canvas {
  display: block;
  width: 100%;
  height: auto;
}
```

`width: 100%` acompanha o espaço disponível. `height: auto` preserva 16:9. `display: block` elimina o espaço de alinhamento que elementos em linha podem deixar abaixo da superfície.

Se a exibição tiver 480 pixels de largura, terá 270 de altura. O jogo continua calculando e desenhando em 960 × 540. O navegador reduz a apresentação.

Não altere `canvas.width` e `canvas.height` ao redimensionar a janela. Isso mudaria o espaço de coordenadas e apagaria o desenho; nesta base, a adaptação acontece pelo CSS.

A cor azul vem do CSS. `clearRect` torna a superfície transparente, deixando esse fundo aparecer. Se futuramente quiser exportar uma imagem com o fundo azul, será necessário desenhá-lo também pelo contexto 2D.

### Tela na horizontal

Os botões têm altura mínima de 48 pixels. Os grupos podem quebrar de linha em telas estreitas.

Uma regra `@media` muda a composição quando a tela está na horizontal, possui no máximo 740 pixels de altura e pelo menos 600 de largura. Nesse caso, o jogo e o painel ficam lado a lado.

```css
max-width: min(100%, calc((100dvh - 110px) * 16 / 9));
```

`100dvh` representa a altura atual da janela. Subtraímos 110 pixels para reservar cabeçalho, margem e espaçamento. Multiplicar por `16 / 9` transforma a altura restante em uma largura compatível com a proporção. `min` escolhe o menor valor, respeitando também a coluna disponível.

## 4. Entendendo src/main.js

Este arquivo é o ponto de entrada: prepara os recursos e inicia a execução.

```js
import { startGame } from './game.js';
```

`import` busca uma função exportada por outro arquivo. O projeto precisa ser aberto pelo servidor HTTP para carregar os módulos.

```js
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
```

A primeira linha encontra o elemento. A segunda obtém as ferramentas para desenhar formas, textos e imagens.

`const` guarda uma referência que não será substituída. Isso não impede chamar os métodos do objeto ou modificar suas propriedades.

O código verifica se o Canvas e o contexto existem. `try` tenta inicializar; `catch` apresenta uma orientação na página e registra o detalhe no console se ocorrer uma falha.

```js
const game = startGame(canvas, context);
```

A função inicia o ciclo e retorna `start`, `stop` e `destroy`. Os eventos `pagehide` e `pageshow` interrompem o trabalho ao sair e retomam se a página for restaurada. A proteção de `start` evita dois ciclos simultâneos.

Na integração, este arquivo também criará ou obterá o personagem, as entradas e o cenário e fornecerá suas funções ao ciclo.

## 5. Entendendo src/game.js

### Padrões antes da integração

`MAX_DELTA_TIME` vale `0.05` segundo: o intervalo usado em uma atualização não ultrapassa 50 milissegundos.

`EMPTY_ACTIONS` contém as quatro ações desligadas. `Object.freeze` impede alteração acidental do objeto. Ele é reutilizado, evitando criar outro objeto a cada quadro.

`doNothing` é o padrão de movimentação e colisões enquanto seus módulos não forem fornecidos. `drawTestRectangle` é o desenho inicial.

### Funções recebidas pelo ciclo

```js
startGame(canvas, context, {
  readActions,
  updatePlayer,
  resolveCollisions,
  drawScene,
});
```

O terceiro argumento é opcional. Suas funções são chamadas nos momentos combinados; uma função recebida para ser chamada depois também é chamada de callback.

| Função | O que recebe | O que faz na integração |
| --- | --- | --- |
| `readActions` | Nenhum argumento | Retorna as ações do módulo de entradas. |
| `updatePlayer` | Ações e tempo em segundos | Chama o movimento do personagem. |
| `resolveCollisions` | Tempo em segundos | Ajusta o estado ao encontrar obstáculos. |
| `drawScene` | Contexto 2D e Canvas | Desenha o estado final. |

As funções podem acessar variáveis do local onde foram criadas. Assim, `main.js` pode fornecer callbacks que compartilham o mesmo personagem e cenário, sem criar variáveis globais.

Os nomes das funções internas dos arquivos dos colegas precisam ser combinados. O README contém um exemplo de ligação que deve ser aplicado somente após os módulos exportarem as funções correspondentes.

### Estado da execução

| Variável | Significado |
| --- | --- |
| `previousTime` | Horário do quadro anterior; começa como `null`. |
| `animationFrameId` | Identificador do quadro agendado. |
| `running` | Indica se o ciclo está ativo. |
| `destroyed` | Indica se a instância foi encerrada definitivamente. |

Essas variáveis usam `let` porque seus valores mudam.

### A atualização

```js
const actions = readActions();
updatePlayer(actions, deltaTime);
resolveCollisions(deltaTime);
```

O ciclo lê comandos, atualiza o movimento e resolve contatos. Pedro e Dudu devem combinar os dados necessários para as colisões; Marlon garante a ordem e fornece o tempo.

### O desenho

```js
context.clearRect(0, 0, canvas.width, canvas.height);
drawScene(context, canvas);
```

Primeiro limpamos a superfície, evitando que desenhos anteriores deixem rastros. Depois desenhamos o estado atualizado e corrigido.

O desenho inicial é:

```js
context.fillStyle = '#e63946';
context.fillRect(100, 100, 50, 80);
```

`fillStyle` define a cor. `fillRect` recebe `x`, `y`, largura e altura: nosso retângulo começa em `(100, 100)` e mede 50 × 80 pixels internos.

### Tempo entre quadros

`requestAnimationFrame` entrega um horário em milissegundos. Calculamos:

```js
(currentTime - previousTime) / 1000
```

Se os horários forem 1000 e 1016, passaram 16 milissegundos, equivalentes a `0.016` segundo.

Para uma velocidade em pixels por segundo, o módulo de personagem poderá calcular:

```js
deslocamento = velocidade * deltaTime;
```

Uma velocidade de 100 pixels por segundo durante 0.016 segundo resulta em 1.6 pixel de deslocamento. Dessa forma, o movimento acompanha o tempo.

O primeiro quadro usa intervalo zero. `Math.min` limita o intervalo a 0.05 segundo, descartando atrasos excessivos em vez de tentar simular toda a interrupção de uma vez.

### Repetição

```js
animationFrameId = requestAnimationFrame(gameLoop);
```

Essa chamada agenda a função para um próximo quadro; ela não inicia uma repetição imediata. A primeira chamada acontece em `start`; as seguintes ficam no fim de `gameLoop`.

### Início, parada e limpeza

- `start()` ativa a execução, reinicia o relógio e agenda um quadro. Se já estiver ativo, não inicia outro ciclo.
- `stop()` desativa a execução e usa `cancelAnimationFrame` para cancelar o quadro pendente.
- `destroy()` também remove o observador de visibilidade e impede reiniciar essa instância.
- `resetClock()` reinicia o horário após mudar de aba, fazendo o próximo quadro usar intervalo zero.

Essas funções controlam tecnicamente a base. A interface e as regras de pausa da fase pertencem à etapa posterior do plano.

## 6. Como integrar as entregas

Você pode fornecer um callback por vez, mantendo os padrões dos demais:

1. Conecte `readActions` quando o módulo de entradas estiver pronto.
2. Conecte `updatePlayer` quando receber o personagem.
3. Conecte `resolveCollisions` quando receber cenário e contatos.
4. Conecte `drawScene` para desenhar os dados reais.
5. Substitua os desenhos de teste pelas imagens quando elas estiverem disponíveis.

Personagem e obstáculos compartilham pelo menos `x`, `y`, `width` e `height`. Posição anterior, velocidades, apoio e agachamento precisam ser acertados pelos responsáveis antes da integração.

Pedro deve habilitar os botões, tratar acionamentos simultâneos e liberar ações ao cancelar o toque ou perder o foco, conforme o plano da equipe.

## 7. Estrutura e Git

O remoto `origin` aponta para `Marllonlp/ccxp`. O repositório é privado e os integrantes precisam receber acesso.

`.gitignore` evita registrar alguns arquivos gerados pelo sistema. `.gitkeep` preserva as pastas de imagens, pois o Git não registra pastas vazias. Os arquivos de personagem, entradas, cenário e colisões contêm comentários que indicam os responsáveis e o acordo básico.

O README contém instruções de clonagem, servidor, teste pelo celular e uso de branches por tarefa.

## 8. Como investigar problemas

| Sintoma | O que conferir |
| --- | --- |
| A mensagem continua em “Carregando…” | Uso de HTTP e carregamento dos dois módulos JavaScript. |
| Aparece uma mensagem de falha | O console indica o problema do Canvas ou contexto. |
| O Canvas fica azul, sem o retângulo | Erros de importação ou de execução no console. |
| A página não abre no endereço local | Se o servidor está ativo e a porta está correta. |
| O celular não abre a página | IP do computador, mesma rede e servidor com `--bind 0.0.0.0`. |
| Os controles não respondem | Nesta base, os botões aguardam a integração das entradas. |

## 9. Condição da entrega

A base técnica está preparada quando página, contexto 2D, ciclo, tempo, retângulo e pontos de integração funcionam e suas instruções estão disponíveis.

A conclusão da sprint também depende da concessão dos acessos, da confirmação nos dispositivos dos quatro integrantes e da integração da fase jogável. Atualize as tabelas do README somente com confirmações reais.

Consulte [as verificações realizadas](verificacoes.md) para conhecer o que foi conferido no código e no navegador.
