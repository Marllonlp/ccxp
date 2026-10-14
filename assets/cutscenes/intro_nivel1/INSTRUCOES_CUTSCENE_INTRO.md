# Cutscene de introdução do Nível 1 — instruções para o Claude Code

## A história
1. Num dia tranquilo, **Byte** está sentado no chão programando em Python no notebook.
2. O céu escurece, a tela treme e aparece um "!" sobre ele.
3. O chefe **KERNEL PANIC** desce do céu, se apresenta e **rouba o notebook** com a pinça.
4. Byte se levanta e **pula para recuperar**, mas o chefe sobe e dispara um **pacote de erro**. Byte é atingido e **cai no chão**.
5. O chefe foge rindo e deixa um rastro de glitch. O céu volta ao normal.
6. Byte fica tonto (estrelinhas), se levanta e jura recuperar o notebook.
7. Byte sai correndo para a direita → cartela **"NÍVEL 1 — A JORNADA COMEÇA"** → começa o Nível 1.

A animação de referência está em `intro_nivel1_preview.gif` (~27 s). **Siga o GIF como fonte da verdade visual.**

---

## 0. Antes de começar
1. Identifique a engine/framework do projeto e onde ficam cenas, sprites, UI e o fluxo "seleção de nível → nível".
2. Mostre um plano curto antes de alterar código. Não apague nem sobrescreva arquivos existentes.
3. Coloque os assets em uma pasta própria (ex.: `assets/cutscenes/intro_nivel1/`).
4. Trabalhe nas etapas abaixo, nesta ordem, testando ao fim de cada uma.

## 1. Regras visuais
- **Resolução da cutscene:** **480×270**. Renderize num viewport próprio, como as telas de menu, ampliado com **escala inteira** e com letterbox se precisar. Não use a câmera da gameplay.
- **Pixel art:** filtro Point/Nearest; sem compressão; fonte sem suavização.
- **Coordenadas:** canto superior esquerdo de cada sprite. O chão fica na linha **213**; o Byte (48×48) com os pés no chão usa **y = 167**.
- **Fonte:** `PressStart2P-Regular.ttf`, 8 px (inclusa, licença OFL).
- **Sprite sheets:** horizontais; `_Nf_LxA` = N frames de L×A.

## 2. Assets
| Arquivo | Uso |
|---|---|
| `cenario_intro_dia_480x270.png` / `cenario_intro_alerta_480x270.png` | fundo. "Tingir o cenário" = desenhar o **alerta por cima do dia** com opacidade 0–1 |
| `byte_sentado_notebook_4f_48x48.png` | Byte sentado digitando (loop, 200 ms/frame) |
| `byte_sentado_olhando_1f_48x48.png` | Byte sentado olhando para cima, assustado |
| `notebook_frente_2f_18x15.png` | o notebook nas mãos do chefe (loop, 240 ms) |
| `balao_{exclamacao,interrogacao,surpresa,reticencias}_16x16.png` | balões de emoção sobre a cabeça (offset +26, −14 do Byte) |
| `tontura_3f_24x10.png` | estrelinhas girando (offset +4, +28 do Byte deitado; 100 ms/frame) |
| `caixa_dialogo_{byte,kernel}_468x82.png` | caixa de diálogo vazia (borda ciano = Byte, vermelha = Kernel) |
| `retrato_byte_44x44.png`, `retrato_kernel_panic_44x44.png` | retratos na caixa de diálogo |
| `reutilizados/` | sprites que já existem no jogo (Byte parado/correndo/pulando/caindo/dano/morte/agachado, Kernel Panic parado/ataque, pacote de erro). Use as versões que já estão no projeto, se existirem |
| `cutscene_intro_nivel1.json` | **roteiro passo a passo** (posições, tempos, falas) |
| `intro_nivel1_preview.gif` | referência animada |

## 3. Arquitetura sugerida (sistema de cutscene reutilizável)
Crie um **CutscenePlayer** genérico que lê um roteiro JSON. Assim as próximas histórias (fim de nível, chefe, final) só precisam de um novo JSON.

- **Atores:** dicionário `nome → {sprite/animação atual, x, y, visível, balão, preso_a + offset}`.
- **Passos:** executados **em sequência**. Um passo termina quando seu tempo acaba ou quando o jogador avança o diálogo. O campo `"paralelo"` lista ações que rodam **ao mesmo tempo** que o passo principal.
- **Ações** (todas aparecem no JSON):

| Ação | O que faz |
|---|---|
| `fade_in` / `fade_out` | tela preta → cena / cena → preta |
| `legenda` | texto do narrador numa faixa escura no topo (y=26), amarelo, com máquina de escrever |
| `dialogo` | caixa de diálogo com retrato e nome (detalhes na seção 4) |
| `esperar` | pausa |
| `sprite` / `animar` | troca a imagem ou a animação de um ator |
| `mostrar` / `esconder` | visibilidade do ator |
| `mover` | `para` (posição absoluta) ou `delta`, em `ms`, com `suavizar: ease_out` (`1-(1-t)²`) quando indicado; ou `velocidade_px_por_s` contínua |
| `tingir_cenario` | anima a opacidade do cenário de alerta |
| `tremer_tela` / `tremer` | desloca a câmera ±px horizontalmente |
| `balao` | mostra ou remove um balão (`tipo: null` remove) |
| `pulo_scriptado` | arco do pulo com os valores indicados: frame `byte_pulando` F0 durante o impulso, F1 subindo, `byte_caindo` descendo |
| `projetil` | sai do ator com offset, é **teleguiado** (a cada frame percorre 35% da distância até o alvo) e dispara `ao_acertar` ao encostar |
| `ao_acertar` | sequência de reação: dano → morte F1 caindo para trás → morte F2 deitado → tremor |
| `efeito` | sprite temporário preso a um ator (as estrelinhas) |
| `rastro_glitch` | partículas de 1 px (vermelho `#FF2846`, magenta `#E63CC8`, vinho `#AA0A28`) saindo da base do chefe e indo para a esquerda |
| `cartela_titulo` | escurece a tela, mostra "NÍVEL 1" grande (ciano, contorno escuro, sombra azul) e "A JORNADA COMEÇA" (amarelo) |
| `fim` | troca para o próximo estado (`nivel_1`) |
| `comentario` | só documentação: ignorar |

- **Notebook preso ao chefe:** quando `preso_a` está definido, desenhe o ator na posição `(kernel.x + 21, kernel.y + 116)` a cada frame.

### Ordem de desenho (de trás para frente)
1. Cenário (dia + alerta com opacidade).
2. Kernel Panic.
3. Notebook.
4. Partículas.
5. Projétil.
6. Byte.
7. Efeitos e balões.
8. Legenda e diálogo.
9. Cartela.
10. Fade.
11. Dica "ESC: PULAR".

## 4. Caixa de diálogo
- **Caixa:** `caixa_dialogo_*_468x82.png` em **(8, 24)**, no topo da tela, para não cobrir os personagens.
- **Retrato:** em **(21, 46)**.
- **Nome** (`BYTE` amarelo `#FFD646` / `KERNEL PANIC` rosa `#FF6078`): Press Start 8 em **(84, 28)**.
- **Texto:** começa em **(82, 46)**, com 3 linhas de **13 px**, quebra em **46 caracteres** por linha (por palavra). Cor: branco para o Byte, `#FF96A5` para o Kernel. Acentos: veja a observação sobre a Press Start 2P no fim.
- **Máquina de escrever:** ~50 caracteres por segundo.
  - **Enter, Espaço ou clique** com o texto ainda escrevendo → mostra o texto inteiro.
  - Com o texto completo → avança para o próximo passo.
  - Com o texto completo, mostre uma setinha amarela piscando (triângulo 9×5) no canto inferior direito da caixa, em (455, 87).
  - Opcional: modo automático, que avança 1,5 s depois do texto completo.

## 5. Pular a cutscene
- Mostre **"ESC: PULAR"** no canto superior direito, em (388, 6), cinza piscando a cada 600 ms.
- **ESC** (ou segurar Enter por 1 s) → fade de 300 ms → vai direto ao **Nível 1**.

## 6. Quando tocar
- Toca **automaticamente na primeira vez** que o jogador entra no Nível 1: depois da tela de início de nível, ao apertar **JOGAR**.
- Ao terminar ou pular, salve a flag `intro_nivel1_vista = true` no save. Nas próximas vezes, vá direto à gameplay.
- Deixe uma forma de rever a cutscene para os testes: uma tecla de debug ou uma opção futura no menu "Sobre".
- Durante a cutscene, **todo input de gameplay fica bloqueado**: só funcionam avançar diálogo e pular.

## 7. Etapas de implementação
1. Copiar os assets e criar a cena/estado `CutsceneIntro` com o viewport de 480×270.
2. Fundo com tingimento, atores e animações (sem diálogo): conferir as posições com o GIF.
3. Sistema de passos lendo `cutscene_intro_nivel1.json`, incluindo `paralelo`.
4. Diálogo com máquina de escrever, retratos e avanço por Enter/clique.
5. Pulo, projétil teleguiado, reação ao golpe, tremor e rastro de glitch.
6. Cartela de título, fade, pular com ESC, flag no save e transição para o Nível 1.

## 8. Checklist de validação
- [ ] A cena abre com fade e o Byte digitando no notebook.
- [ ] O céu escurece e a tela treme antes do chefe aparecer.
- [ ] O chefe desce suavemente e para em (153, 76).
- [ ] As falas aparecem letra por letra; Enter completa e avança.
- [ ] O notebook passa do colo do Byte para a pinça do chefe e acompanha o chefe.
- [ ] O Byte pula, é atingido pelo pacote de erro, cai para trás e fica deitado em (138, 167).
- [ ] O chefe sai pela direita deixando glitch; o céu volta ao normal.
- [ ] Estrelinhas → Byte se levanta → falas finais → corre para a direita.
- [ ] Cartela "NÍVEL 1 — A JORNADA COMEÇA" → começa o nível.
- [ ] ESC pula a qualquer momento; na segunda vez a cutscene não toca.

## Observação sobre acentos
As maiúsculas acentuadas da Press Start 2P (`É Á Í Ó Ã Õ Ç Ê`) podem aparecer como minúsculas.
Se isso acontecer, desenhe a letra sem acento e acrescente o acento com pixels. Deslocamentos a partir do canto superior esquerdo da letra:
- agudo: `(4,−3) (3,−2)`;
- til: `(1,−2) (2,−3) (3,−2) (4,−2) (5,−3)`;
- circunflexo: `(2,−2) (3,−3) (4,−2)`;
- cedilha: `(3,7) (4,8) (3,9)`.
