# CCXP

Protótipo de um jogo de plataforma 2D para navegador, feito com HTML, CSS e JavaScript. A versão atual possui uma fase de teste com plataformas, obstáculos, checkpoints e controles para computador e celular. O personagem e o cenário usam formas simples como visual provisório.

## Como jogar

Movimente o personagem pela fase, pule entre as plataformas e sobre o vão no chão. Use o agachamento para atravessar o trecho sob o bloco suspenso.

A fase possui checkpoints, ativados ao tocar neles. Quando um checkpoint é salvo, aparece a mensagem **“Checkpoint salvo”**, e seu marcador passa a mostrar um símbolo de confirmação.

Ao cair para fora da fase, o personagem perde uma vida e retorna ao último checkpoint ativado. Se nenhum checkpoint tiver sido ativado, retorna à posição inicial.

Há **quatro robôs sentinelas** pela fase: dois patrulham plataformas e dois ficam no chão, depois do terceiro checkpoint e no trecho final. Cada um anda entre dois marcos amarelos. Pule sobre os robôs no chão ou passe por baixo das plataformas patrulhadas. Qualquer contato desconta um coração e devolve o personagem ao ponto seguro, com um segundo de invulnerabilidade. Os robôs continuam patrulhando; nesta versão, eles não podem ser derrotados.

Para mudar os campos, edite `patrulhasSentinelas` em `src/level.js`: `inicioX` e `fimX` delimitam a área inteira do robô, `superficieY` indica a altura da superfície de apoio e `velocidade` é medida em pixels por segundo. A patrulha original vai de **1535 a 1645**, sobre o chão em **480**, a **80 px/s**. Mantenha cada área sobre chão ou plataforma contínua, sem paredes ou vãos, e longe das posições de retorno dos checkpoints. Para adicionar outro sentinela, inclua outra configuração na lista.

Há **cinco plantas inimigas**: três no chão (**x = 230, 1820 e 3120**), uma sobre o bloco suspenso inicial (**x = 680**) e uma na plataforma alta do trecho final (**x = 2684**). Elas permanecem no lugar e usam seu GIF animado. Pule sobre elas ou siga por outro nível da fase: o contato desconta um coração e retorna ao ponto seguro, com um segundo de invulnerabilidade. Para mover ou adicionar plantas, edite a lista `plantas` em `src/level.js`, usando `x` e `superficieY`.

Use o botão **Pausar** para interromper a partida e abrir o menu. Enquanto o jogo está pausado, o personagem e a simulação ficam parados. O botão **Retomar** fecha o menu e continua a partida de onde parou.

O progresso fica apenas na partida atual. Recarregar a página reinicia o personagem e os checkpoints.

## Controles

| Ação | Teclado | Celular |
| --- | --- | --- |
| Mover para a esquerda | Seta esquerda ou A | Segurar ← |
| Mover para a direita | Seta direita ou D | Segurar → |
| Pular | Seta para cima, W ou espaço | Tocar em Pular |
| Agachar | Seta para baixo ou S | Segurar Agachar |
| Pausar | Clicar no botão Pausar | Tocar em Pausar |
| Retomar | Clicar no botão Retomar | Tocar em Retomar |

Para saltar novamente, solte e acione outra vez a tecla ou o botão de pulo. O personagem só pula quando está apoiado no chão e não está agachado.

Pausa e retomada são acessadas pelos botões do jogo. Não há atalho específico de teclado para pausar ou reiniciar a fase.

## Como executar

É necessário Python 3 e um navegador com JavaScript, Canvas e suporte a módulos JavaScript. O projeto não exige instalação de pacotes.

Abra o terminal na pasta do projeto e execute:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

No Windows, se `python3` não estiver disponível, utilize:

```bash
py -m http.server 8000 --bind 127.0.0.1
```

Abra [http://localhost:8000](http://localhost:8000) no navegador. Mantenha o terminal aberto enquanto joga; `Ctrl+C` encerra o servidor.

Use o servidor em vez de abrir `index.html` diretamente, pois o jogo carrega módulos JavaScript com `import`. Se a porta 8000 estiver ocupada, use outra porta, como 8001, tanto no comando quanto no endereço do navegador.

### Jogar no celular

Conecte o computador e o celular à mesma rede Wi-Fi. Encerre o servidor anterior e execute:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

No Windows, substitua `python3` por `py`. Consulte o IP local do computador com `hostname -I` no Linux ou `ipconfig` no Windows. No celular, abra `http://IP_DO_COMPUTADOR:8000`, substituindo `IP_DO_COMPUTADOR` pelo endereço encontrado.

No celular, `localhost` aponta para o próprio celular; por isso, o endereço precisa usar o IP do computador que está executando o servidor.

## Estado atual do jogo

Movimentação, pulo, agachamento, colisões, checkpoints, retorno após queda e pausa/retomada estão conectados à partida.

A partida começa com três vidas. Quedas e contatos com inimigos descontam um coração. Ao perder todas as vidas, o jogo para e volta à tela inicial.

**Reiniciar fase** restaura as vidas, os checkpoints, a patrulha dos sentinelas e a animação das plantas. O botão **Jogar** na tela inicial também começa uma nova partida com esses estados restaurados.

## Estrutura do projeto

| Arquivo | Função |
| --- | --- |
| `index.html` | Página do jogo, Canvas, menus e controles de toque. |
| `styles/main.css` | Aparência e adaptação da página ao tamanho da tela. |
| `src/main.js` | Inicialização, integração dos módulos e estados da partida. |
| `src/game.js` | Ciclo de atualização e desenho do jogo. |
| `src/input.js` | Comandos de teclado e toque. |
| `src/player.js` | Estado, movimentação e desenho do personagem. |
| `src/enemies.js` | Movimento, animação, desenho e contatos dos inimigos. |
| `src/level.js` | Cenário, obstáculos, checkpoints e posições de retorno. |
| `src/collisions.js` | Colisões com o cenário e verificação de espaço. |
