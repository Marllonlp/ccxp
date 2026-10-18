# As aventuras de Byte (CCXP) 

Jogo de plataforma 2D em pixel art com desafios de programação em Python. Desenvolvido com HTML, CSS e JavaScript para computador e celular.

## Recursos

- Cinco fases, tutorial da ADA e chefe final Kernel Panic.
- Perguntas de programação e missões com montagem de código no terminal.
- Checkpoints, moedas, vidas e avaliação por estrelas.
- Níveis, estrelas e moedas salvos no navegador; moedas coletadas não reaparecem.
- Controles de toque com multitoque, menu de pausa e ajustes de música e efeitos.
- Porta de pedra e madeira em pixel art, com animação do Byte entrando antes da troca de fase.
- Acesso ao Kernel Panic por um computador corrompido: Byte vira pixels e atravessa para o núcleo.
- Luta final com um computador que troca de posição, avisos de ataque e tiros de energia na quantidade indicada em cada desafio.
- Contador dos exercícios obrigatórios; corações são opcionais.
- Terminal com texto nativo e layout adaptável ao computador e ao celular.

## Executar localmente

Requer Python 3 e um navegador moderno. Sem instalação de dependências.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Acesse [localhost:8000](http://localhost:8000). No Windows, substitua `python3` por `py`. Abra o jogo pelo servidor para permitir o carregamento dos módulos JavaScript.

Para acessar pelo celular, conecte os dispositivos à mesma rede Wi-Fi e execute:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

No celular, abra `http://IP_DO_COMPUTADOR:8000` e jogue na horizontal.

## Controles

| Ação | Teclado | Celular |
| --- | --- | --- |
| Mover | ← / → ou A / D | Segurar ← / → |
| Pular | ↑, W ou espaço | Tocar em ↑ |
| Agachar | ↓ ou S | Segurar ↓ |
| Pausar / retomar | P ou Esc | Botões Pausar / Retomar |
| Reiniciar fase | R | Menu de pausa |

O menu **Como jogar** apresenta as instruções. No terminal, selecione os trechos de código e use **Testar código**. O progresso pode ser zerado em **Apagar dados**, na tela de título.

Cada fase tem quatro exercícios obrigatórios. O contador **Exercícios** mostra quantos foram resolvidos. Resolva todos para abrir a porta de saída; exercícios principais permitem novas tentativas. Os desafios de coração são opcionais: com três vidas, o jogo apenas avisa; com menos vidas, é possível aceitar uma tentativa para recuperar uma vida. Errar consome o coração, sem descontar vidas atuais.

As moedas indicam trajetos e caminhos de exploração. Corações ficam em áreas de recuperação e desvios; nenhum deles é exigido para avançar. Barreiras invisíveis nas duas extremidades impedem sair pelas laterais do mapa.

Os rios dos exercícios exigem a ponte, que se monta em módulos após o acerto. Nas travessias com plataformas mecânicas, use o apoio central; trampolins e ventiladores dão acesso a bônus altos. Portas e pistões ficam em passagens baixas, com espaço seguro antes de cada obstáculo. A porta de pressão tem botões dos dois lados para permitir voltar.

No terminal, selecione uma linha e use **Subir**, **Descer** ou **Remover**. Pelo teclado, **Alt + ↑/↓** move a linha selecionada e **Delete** a remove. **Esc** fecha o terminal; **Tab** percorre seus controles.

## Build e publicação

Requer Node.js 22 ou superior.

```bash
node scripts/build-pwa.mjs
```

A Vercel executa o build e publica `dist/`, conforme `vercel.json`. A pasta é gerada automaticamente e não deve ser editada.

O build ignora prévias e guias de arte (`*_preview*` e `*_guia*`). Mantenha em `assets/` apenas os recursos usados pelo jogo. Imagens idênticas usadas por várias telas ficam em `assets/compartilhados/`; as fontes ficam em `assets/fontes/`. Reutilize esses caminhos ao adicionar telas.

Para abrir a versão de produção localmente:

```bash
python3 -m http.server 8001 --bind 127.0.0.1 --directory dist
```

A PWA permite instalação e uso offline após o primeiro download completo. Use HTTPS ou `localhost`; o acesso por IP local com HTTP serve apenas para desenvolvimento.

O aviso na tela de título aparece somente quando há uma atualização pronta. Para aplicá-la, feche todas as abas e janelas do jogo e abra novamente. O progresso salvo é preservado.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `index.html` | Interface, menus e controles. |
| `src/` | Lógica do jogo, fases, desafios e interfaces. |
| `styles/` | Estilos e adaptação às telas. |
| `assets/` | Imagens, sons, fontes e dados das missões. |
| `assets/animacoes/` | Animações do personagem, inimigos e coletáveis em PNG. |
| `assets/compartilhados/` | Imagens reutilizadas pela introdução, ADA, portal e chefe. |
| `assets/fontes/` | Uma cópia de cada fonte usada no jogo. |
| `pwa/` | Service worker para cache offline e atualizações. |
| `scripts/build-pwa.mjs` | Build de produção. |
