# CCXP

Protótipo de um jogo de plataforma 2D para navegador, feito com HTML, CSS e JavaScript. A versão atual possui uma fase de teste com plataformas, obstáculos, checkpoints e controles para computador e celular. O personagem, os inimigos e o cenário usam sprites em pixel art.

## Como jogar

Movimente o personagem pela fase, pule entre as plataformas e sobre o vão no chão. Use o agachamento para atravessar o trecho sob o bloco suspenso.

A fase possui checkpoints, ativados ao tocar neles. Quando um checkpoint é salvo, aparece a mensagem **“Checkpoint salvo”**, e seu marcador passa a mostrar um símbolo de confirmação.

Ao cair para fora da fase, o personagem perde uma vida e retorna ao último checkpoint ativado. Se nenhum checkpoint tiver sido ativado, retorna à posição inicial.

Há **três robôs sentinelas** pela fase: um patrulha uma plataforma e dois ficam no chão, depois do terceiro checkpoint e no trecho final. Cada um anda entre dois marcos amarelos. Pule sobre os robôs no chão ou passe por baixo da plataforma patrulhada. Qualquer contato desconta um coração e devolve o personagem ao ponto seguro, com um segundo de invulnerabilidade. Os robôs continuam patrulhando; nesta versão, eles não podem ser derrotados.

Para mudar os campos, edite `patrulhasSentinelas` em `src/level.js`: `inicioX` e `fimX` delimitam a área inteira do robô, `superficieY` indica a altura da superfície de apoio e `velocidade` é medida em pixels por segundo. A patrulha original vai de **1535 a 1645**, sobre o chão em **480**, a **80 px/s**. Mantenha cada área sobre chão ou plataforma contínua, sem paredes ou vãos, e longe das posições de retorno dos checkpoints. Para adicionar outro sentinela, inclua outra configuração na lista.

Há **quatro plantas inimigas**: duas no chão (**x = 1820 e 3120**), uma sobre o bloco suspenso inicial (**x = 680**) e uma na plataforma alta do trecho final (**x = 2684**). Elas permanecem no lugar e usam seu GIF animado. Pule sobre elas ou siga por outro nível da fase: o contato desconta um coração e retorna ao ponto seguro, com um segundo de invulnerabilidade. Para mover ou adicionar plantas, edite a lista `plantas` em `src/level.js`, usando `x` e `superficieY`.

Use o botão **Pausar** para interromper a partida e abrir o menu. Enquanto o jogo está pausado, o personagem e a simulação ficam parados. O botão **Retomar** fecha o menu e continua a partida de onde parou.

Os níveis liberados, as estrelas e as moedas coletadas ficam salvos no navegador. O contador de moedas mostra o total acumulado em todas as fases. Cada moeda é salva ao ser coletada e não reaparece ao voltar à fase, reiniciá-la ou recarregar a página. Use **Apagar dados** na tela de título para zerar esse progresso.

A posição do personagem e os checkpoints valem apenas para a partida atual: recarregar a página reinicia a fase.

## Controles

| Ação | Teclado | Celular |
| --- | --- | --- |
| Mover para a esquerda | Seta esquerda ou A | Segurar ← |
| Mover para a direita | Seta direita ou D | Segurar → |
| Pular | Seta para cima, W ou espaço | Tocar em Pular |
| Agachar | Seta para baixo ou S | Segurar Agachar |
| Pausar | P ou botão Pausar | Tocar em Pausar |
| Retomar | P ou botão Retomar | Tocar em Retomar |
| Reiniciar | R ou botão Reiniciar fase | Reiniciar fase no menu de pausa |

Para saltar novamente, solte e acione outra vez a tecla ou o botão de pulo. O personagem só pula quando está apoiado no chão e não está agachado.

Os controles de toque aceitam andar e pular ao mesmo tempo. Soltar o botão, cancelar o toque ou pausar limpa as ações para evitar movimento preso.

## Adaptação às telas

O cenário ocupa a área disponível da janela, com escala uniforme para personagens, inimigos e plataformas. A câmera mostra mais cenário em telas largas e acompanha os saltos nas plataformas altas. As coordenadas do mapa e a física permanecem iguais em todas as telas.

Redimensionar a janela preserva a posição, as vidas, os checkpoints e os itens coletados. Os corações, o contador de moedas e as mensagens ficam em uma camada fixa, com tamanho independente do zoom. A resolução de desenho considera a densidade da tela, limitada a 2×.

No celular e no tablet, jogue na horizontal. Ao girar para a vertical durante uma partida, o jogo pausa e mostra o aviso de orientação. Depois de girar de volta, use **Retomar**. Os controles respeitam as bordas do aparelho, e a câmera reserva espaço para eles quando o personagem está no chão.

O aviso desaparece ao girar o aparelho para a horizontal. O jogo se adapta automaticamente ao espaço disponível.

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

## PWA e publicação na Vercel

A versão de produção pode ser instalada e usada offline depois do primeiro download completo. A Vercel continua sendo a hospedagem: `vercel.json` executa `node scripts/build-pwa.mjs` e publica a pasta `dist`, com HTTPS no endereço do projeto. O build requer Node.js 22 ou posterior e usa apenas módulos nativos, sem dependências de execução.

O build copia HTML, CSS, JavaScript, manifesto e recursos de `assets` para `dist`. Inclui também as variantes de arte dos pacotes, para cobrir os caminhos montados dinamicamente pelo jogo. Apenas os arquivos do jogo são publicados. A lista de cache, a integridade de cada arquivo e a versão são geradas automaticamente a partir do conteúdo. Não edite `dist` nem altere números de versão manualmente.

### Testar a PWA localmente

```bash
node scripts/build-pwa.mjs
python3 -m http.server 8001 --bind 127.0.0.1 --directory dist
```

Abra `http://localhost:8001` e aguarde **“Pronto para jogar offline”** na tela de título. Depois, desligue a conexão pelo modo Offline do DevTools e recarregue o jogo. A primeira visita precisa de internet até esse aviso aparecer, incluindo o download de imagens, sons, fontes e dados de missões e níveis.

O servidor da raiz na porta 8000 continua sendo o modo de desenvolvimento, sem registrar service worker. Use portas diferentes para desenvolvimento e teste da PWA; assim, o cache de produção não esconde as alterações locais. Se já houver um worker registrado na porta usada para desenvolvimento, remova-o em DevTools → Application → Service Workers → Unregister e limpe o Cache Storage desse endereço.

O acesso por IP local com HTTP permite testar o jogo no celular, mas não a instalação e o cache offline da PWA. Para esse teste, use o endereço HTTPS da Vercel.

### Instalar e atualizar

- Nos navegadores compatíveis, o botão **Instalar jogo** aparece na tela de título quando a instalação está disponível. Também é possível usar a opção de instalação do navegador.
- No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início**. O jogo mostra essa orientação quando está aberto no navegador.
- A orientação preferida é horizontal; o aviso para girar o celular continua atendendo aos navegadores que não aplicam essa preferência.
- Ao minimizar o jogo ou bloquear a tela durante uma partida, o jogo e a música pausam. Use **Retomar** ao voltar.
- Uma nova versão é baixada em um cache separado. Se algum arquivo falhar, a versão anterior continua ativa. Quando o download terminar, a tela de título informa que há uma atualização pronta.
- Para aplicar uma atualização, feche **todas as abas e janelas do jogo**, inclusive a PWA instalada, e abra novamente. A versão não é trocada durante uma partida. Só após a ativação o cache antigo é removido; níveis, estrelas e moedas em `localStorage` são preservados.

O armazenamento é local ao dispositivo e ao endereço usado. Limpar os dados do site remove cache e progresso; os endereços de preview da Vercel têm armazenamento separado do endereço principal. O modo offline continua disponível enquanto os arquivos permanecerem armazenados pelo navegador.

### Validação antes de publicar

Confira a instalação, o nome e o ícone do aplicativo; a abertura offline; as telas de níveis e missões; os sprites e sons; o retorno após minimizar; e uma atualização com duas abas abertas. Teste também em Android e iPhone/iPad reais. No Chrome, o painel Application permite inspecionar Manifest, Service Workers e Cache Storage.

Os ícones PNG prontos ficam em `assets/icons/` e são publicados diretamente. O projeto não exige instalação de pacotes.

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
| `src/collisions.js` | Colisões com o cenário, coleta de itens e verificação de espaço. |
| `src/viewport.js` | Escala, área visível e resolução do Canvas conforme a tela. |
