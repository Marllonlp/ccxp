# ADA — a assistente de código (tutorial no início de cada fase)

**ADA** é uma coruja-robô flutuante, branca com visor escuro e olhos ciano. O nome é uma homenagem a Ada Lovelace, considerada a primeira programadora.
No **começo de cada nível**, ela se teletransporta para perto do Byte e explica o conceito de Python daquela fase. Enquanto fala, um **painel holográfico** mostra um código de exemplo com as linhas importantes **destacadas**. Ela termina com **"Boa sorte, Byte!"** e some.

Referência visual: `ada_tutorial_if_else_preview.gif` (~20 s), que mostra o tutorial do nível de **if/else**. **O GIF é a fonte da verdade visual.**
O texto de todos os níveis está em `tutoriais.json`. **Nenhum texto fica dentro das imagens.**

---

## 0. Antes de começar
1. Identifique a engine e verifique se o **sistema de cutscene/diálogo** da intro do Nível 1 (`INSTRUCOES_CUTSCENE_INTRO.md`) já existe. **Reaproveite-o**: caixa de diálogo, máquina de escrever, ESC para pular.
2. Mostre um plano curto antes de alterar código. Não apague nem sobrescreva arquivos existentes.
3. Coloque os assets em uma pasta própria (ex.: `assets/ada/`).

## 1. Regras visuais
- **Tela:** 480×270, ampliada com escala inteira; filtro Point/Nearest; fonte sem suavização. Viewport próprio, como na cutscene da intro.
- **Coordenadas:** canto superior esquerdo de cada sprite. O chão fica em y=213 (o Byte em pé usa y=167).
- **Fontes** (inclusas):
  - **Press Start 2P**, 8 px: textos do diálogo.
  - **Cozette**, 13 px: código no painel (monoespaçada, 6 px por caractere).

## 2. Assets
| Arquivo | Uso |
|---|---|
| `ada_parado_4f_32x32.png` | flutuando e piscando (loop, 180 ms/frame) |
| `ada_falando_4f_32x32.png` | enquanto o texto dela está sendo escrito (loop, 110 ms/frame) |
| `ada_acenar_4f_32x32.png` | acenando com olhos felizes ^ ^ na fala "Boa sorte" (loop, 180 ms/frame) |
| `ada_aparecer_4f_32x32.png` / `ada_sumir_4f_32x32.png` | teletransporte para dentro e para fora (110 ms/frame, uma vez) |
| `ada_olhando_tela_1f_32x32.png` | ADA com "cara de paisagem" (olhinhos de ponto), encarando o jogador |
| `byte_olhando_tela_1f_48x48.png` | Byte de frente com "cara de paisagem", encarando o jogador |
| `retrato_ada_44x44.png` | retrato na caixa de diálogo |
| `caixa_dialogo_ada_468x82.png` | caixa de diálogo da ADA (borda verde-menta) |
| `painel_holograma_220x96.png` | painel holográfico vazio (o código é desenhado por cima) |
| `tutoriais.json` | falas, código de exemplo e destaques de cada nível |
| `reutilizados/` | cenário, Byte parado, caixa e retrato do Byte (use as versões do projeto, se existirem) |

## 3. Posições (480×270)
| Elemento | Posição |
|---|---|
| Byte | (120, 167), parado |
| ADA | **(182, 128)**: flutuando ao lado da cabeça do Byte |
| Caixa de diálogo | (8, 24), no topo; retrato em (21, 46); nome `ADA` em verde-menta `#5AFFB4` em (84, 28); texto em (82, 46), 3 linhas de 13 px, 46 caracteres por linha |
| Painel holográfico | **(236, 110)**, 220×96 |
| Feixe de projeção | linhas pontilhadas ciano `#78F0FF` saindo do olho da ADA (198, 140) até os dois cantos esquerdos do painel (236,110) e (236,205); a cada frame acenda 1 em cada 3 pontos, alternando, para parecer energia correndo |

## 4. Painel holográfico (código de exemplo)
- **Título:** `exemplo.py` em (241, 110), Cozette, ciano-claro.
- **Linha *i* do código:** topo em `y = 126 + 14·i`.
  - Número da linha em x=242, azul-acinzentado `#5A96B4`.
  - Código em `x = 256 + 24·recuo`.
  - Até **5 linhas** de no máximo **25 caracteres**, contando o recuo.
- **Cores de sintaxe:** as mesmas do terminal.

  | Token | Cor |
  |---|---|
  | palavras-chave | `#EC78FF` |
  | funções nativas | `#3CE6FF` |
  | strings | `#FFD66E` |
  | números | `#FFA046` |
  | resto | `#E1E8F5` |
- **Destaque:** as linhas listadas em `destaque` recebem uma faixa amarela translúcida (`#FFD646` com ~27% de opacidade) da borda esquerda à direita do painel, mais uma barrinha amarela sólida de 2 px na esquerda.
- **Guias:** quando `guias: true`, desenhe uma linha pontilhada amarela em x=257 nas linhas recuadas, para mostrar o recuo.
- **Entrada e saída:** o painel aparece com fade (0→1 em ~300 ms) na **primeira página que tem `destaque`** e some com fade na página final ("Boa sorte"). Enquanto ele está visível, o feixe de projeção fica ligado.

## 5. Sequência (para cada nível)
1. O nível carrega → o Byte aparece parado e o **input de gameplay fica bloqueado**.
2. A ADA toca `aparecer` (4 frames) em (182,128) e depois fica em `parado`.
3. Para cada página de `tutoriais.json → niveis[n].paginas`:
   - Abra a caixa de diálogo de quem fala (`ADA` ou `BYTE`), com máquina de escrever (~50 caracteres/s).
   - Enquanto a **ADA** escreve, ela usa `falando`; com o texto completo, volta para `parado`.
   - Atualize os destaques e as guias do painel conforme a página.
   - **Enter, Espaço ou clique:** completa o texto; se já estiver completo, avança.
   - Páginas com `acenar: true` usam a animação `acenar`.
   - Páginas com `balao` mostram o balão sobre o Byte enquanto a fala estiver na tela.
   - Páginas com `acao: "olhar_para_tela"` não têm texto: fazem a pausa cômica descrita no item "Nível 1" abaixo.
4. Depois da última página, a ADA toca `sumir` (4 frames) e o painel faz fade out.
5. O input é liberado e o nível começa de verdade.

- **ESC: PULAR** no canto superior direito, como na cutscene: pula o tutorial inteiro.
- **Nível 1: a ADA aparece pela primeira vez.** Se o jogo tocar a intro do Nível 1 antes, o tutorial entra **logo depois** da cutscene. Referência: `ada_nivel1_apresentacao_preview.gif`.
  1. Logo depois de a ADA aparecer, o Byte fica com o balão **"!?"** (`balao_surpresa`, offset +26, −14) e pergunta: **"QUEM É VOCÊ?? E COMO APARECEU????"**.
  2. ADA: **"Isso não importa. Os desenvolvedores decidiram que ia ser assim."**
  3. **Pausa cômica:** página `{"acao": "olhar_para_tela", "ms": 2000}`.
     - Feche a caixa de diálogo.
     - Troque o Byte por `byte_olhando_tela` e a ADA por `ada_olhando_tela`, com a ADA **sem flutuar** e sem animar.
     - Os dois **encaram o jogador em silêncio por 2 s**.
     - Nessa pausa o jogador **não** consegue avançar com Enter. Só o ESC (pular) funciona.
  4. Depois, a história continua normalmente: "Enfim! Eu sou a ADA..." e o tutorial de `print`/`input`.

## 6. Quando o tutorial toca
- **Sempre** na primeira vez em cada nível.
  - Salve `tutorial_nivel_N_visto = true` ao terminar ou pular.
  - Nas vezes seguintes, **não toca automaticamente**.
- **Para rever:** crie um botão/tecla **"?" (Ajuda)** durante o nível que reabre o tutorial daquele nível. Ele é útil para quem esqueceu o conceito antes de abrir um totem.
- Integração com os totens: na tela do terminal, o botão **DICA** pode mostrar uma linha do tutorial do nível, além da dica da missão.

## 7. Etapas
1. Sprites e animações da ADA na cena (aparecer → parado → sumir).
2. Diálogo usando o sistema da cutscene, com a caixa e o retrato da ADA, lendo `tutoriais.json`.
3. Painel holográfico: código com cores, destaques, guias, fade e feixe.
4. Disparo no início de cada nível, flags no save, ESC para pular, botão "?" para rever.

## 8. Checklist
- [ ] Ao entrar no nível, a ADA se teletransporta ao lado do Byte.
- [ ] Nível 1: o Byte pergunta quem ela é, ela responde e os dois encaram a tela por 2 s antes de continuar.
- [ ] As falas aparecem letra por letra; Enter completa e avança.
- [ ] O painel aparece com o código colorido e as linhas certas destacadas em cada página.
- [ ] As guias de recuo aparecem nas páginas com `guias: true`.
- [ ] O Byte responde na própria caixa de diálogo (borda ciano).
- [ ] "Boa sorte, Byte!" com a ADA acenando → ela some → o jogo começa.
- [ ] ESC pula; na segunda vez o tutorial não toca sozinho; o botão "?" reabre o tutorial.
- [ ] Trocar um texto no `tutoriais.json` muda o tutorial sem mexer em imagens.
