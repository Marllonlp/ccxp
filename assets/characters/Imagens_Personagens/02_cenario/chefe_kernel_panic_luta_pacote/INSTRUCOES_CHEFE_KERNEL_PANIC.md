# Luta contra o chefe KERNEL PANIC — instruções para o Claude Code

## Contexto da história
Na cutscene de introdução, o Kernel Panic **roubou o notebook do Byte**. Por isso, na luta, ele aparece **segurando o notebook** na pinça esquerda.
O jogador vence aplicando **3 patches de Python** no terminal do totem da arena. Quando o chefe é derrotado, o notebook cai e o Byte o **recupera**.

Referência visual: `luta_chefe_preview.gif` (~41 s). **O GIF é a fonte da verdade visual.**
Todos os números (posições, tempos, velocidades) estão em `chefe_config.json`.

---

## 0. Antes de começar
1. Identifique a engine, como os níveis são carregados e se o **terminal Python do totem** (`INSTRUCOES_TERMINAL_PYTHON.md`) já foi implementado.
2. Mostre um plano curto antes de alterar código. Não apague nem sobrescreva arquivos existentes.
3. Coloque os assets em uma pasta própria (ex.: `assets/chefe/`).
4. Implemente na ordem das etapas abaixo e teste ao fim de cada uma.

## 1. Regras visuais e de coordenadas
- **Arena:** desenhada em **480×270**, com a **câmera travada** (a arena inteira na tela) e paredes invisíveis em x=0 e x=480.
  - Se a gameplay do projeto usar outra resolução, **pergunte ao usuário** antes de adaptar.
- **Pixel art:** filtro Point/Nearest; sem compressão; escala inteira.
- **Coordenadas:** canto superior esquerdo de cada sprite. O chão fica em **y=213** (o Byte em pé usa y=167).
- **Velocidades** em px/s.
- **Sprite sheets:** horizontais; `_Nf_LxA` = N frames de L×A.

## 2. Assets
| Arquivo | Uso |
|---|---|
| `arena_chefe_fundo_480x270.png` | fundo da arena (céu de alerta + cidade + chão) |
| `chefe_com_notebook_{parado,ataque,vulneravel,dano}_*_128x128.png` | chefe **segurando o notebook** |
| `chefe_kernel_panic_derrota_6f_128x128.png` | derrota (sem o notebook: ele cai solto) |
| `projetil_pacote_erro_2f_12x12.png` | pacote de erro |
| `laser_aviso_2f_16x4.png`, `laser_feixe_2f_16x10.png`, `laser_ponta_2f_12x14.png` | laser: linha tracejada de aviso, feixe (repetir na horizontal) e brilho na ponta |
| `bugzinho_andando_4f_18x14.png`, `bugzinho_morte_2f_18x14.png` | inimigos pequenos que o chefe solta |
| `notebook_frente_2f_18x15.png` | o notebook caindo / no chão |
| `hud_barra_chefe_{vazia,cheia}_208x26.png` | barra de vida com o nome |
| `faixa_chefe_final_480x57.png` | faixa de apresentação "! CHEFE FINAL ! KERNEL PANIC" |
| `chefe_config.json` | **todos os números** da luta |
| `missoes_chefe.json` | os 3 patches de Python (mesmo formato do `missoes.json` do terminal) |
| `reutilizados/` | sprites do Byte, plataforma metálica, totem, caixa de diálogo, retrato e balão; use as versões do projeto, se existirem |
| `PressStart2P-Regular.ttf` | fonte (OFL) |

## 3. Montagem da arena
- **Fundo:** `arena_chefe_fundo_480x270.png` em (0,0).
- **Plataformas metálicas:** em **(70,150)** e **(190,128)**. O topo onde se pisa fica em y=154 e y=132. Recomendo plataformas one-way.
- **Totem:** `totem_terminal_ativo` em **(14,149)**.
  - Área de interação: x 0–64, y 140–213.
  - Mostre o botão **ABRIR TERMINAL** (já existe no pacote do terminal) **só quando o chefe estiver vulnerável**.
- **Byte:** começa em **(110,167)**.
- **HUD:** barra vazia centralizada no topo, em **(136,0)**, com a barra cheia recortada por cima.
  - Área de preenchimento: x 4–203, y 14–21 da imagem.
  - Largura do preenchimento = `200 × vida / 3`.
  - Ao tomar dano, troque a moldura por um tom rosa por 1 frame.

## 4. Máquina de estados do chefe
```
APRESENTACAO → [FASE n] PARADO → ATAQUE(S) → VULNERAVEL ─┬─ patch resolvido → DANO → próxima fase (ou DERROTA)
                                                          └─ tempo esgotado  → PARADO (repete a fase)
DERROTA → NOTEBOOK_CAINDO → RECUPERAR → VITORIA → (cutscene final / créditos)
```
| Estado | O que acontece |
|---|---|
| **APRESENTACAO** | Mostre `faixa_chefe_final` em y=100 por ~1,5 s com o jogo pausado (o chefe flutua parado). Na prévia, a faixa entra animada: primeiro o fundo, depois "! CHEFE FINAL !", depois o nome |
| **PARADO** | animação `parado`, flutuando ±2 px. Duração definida na fase (1500 / 1200 / 900 ms) |
| **PACOTES** | animação `ataque` (100 ms/frame). A partir do frame 3, solta N pacotes, um a cada 480 ms, saindo da **boca** (`chefe + (52,40)`). Cada pacote anda a −87 px/s e desce em arco até o chão. Encostou no jogador = 1 de dano e some |
| **LASER_BAIXO** | o chefe desce até y=86. Linha de **aviso** tracejada em y=204 por 960 ms; depois o **feixe** por 1280 ms, de x=0 até `chefe.x+30`, com a ponta brilhante na pinça. Hitbox: 8 px de altura centrada em y=204. Para desviar: plataforma ou pulo |
| **LASER_ALTO** | igual, com o chefe em y=53 e o feixe centrado em **y=171**. Para desviar: **agachar** (agachado, a cabeça fica abaixo do feixe) |
| **BUGZINHOS** | nascem em x=480, y=199, um a cada 800 ms, andando a −37 px/s. Encostar = dano. Se o jogador **cair em cima**, o bug morre (2 frames de morte) e o jogador dá um quique |
| **VULNERAVEL** | animação `vulneravel` (olhos "X X", núcleo ciano). Dura **6 s**. Só nesse estado o totem mostra **ABRIR TERMINAL** |
| **DANO** | animação `dano` por 400 ms, tremor ±3 px, a barra pisca; vida −1 |
| **DERROTA** | animação `derrota` (130 ms/frame), tremor de tela 2 px; o chefe some (opacidade 1→0 em 1 s) |

Sequência de cada fase (do `chefe_config.json`):
- **Fase 1:** parado 1,5 s → 2 pacotes → vulnerável.
- **Fase 2:** parado 1,2 s → laser baixo → 2 bugzinhos → vulnerável.
- **Fase 3:** parado 0,9 s → 3 pacotes → laser alto → vulnerável.

Encostar no corpo do chefe também causa dano (hitbox `[26,6,101,100]` no frame do chefe).

## 5. Como o jogador causa dano (terminal Python)
- No estado VULNERAVEL, o jogador corre até o totem e aperta **E**. Abre o **terminal Python** (o mesmo sistema do `INSTRUCOES_TERMINAL_PYTHON.md`) com a missão da fase:
  - fase 1 → `patch_1` (laço `while`);
  - fase 2 → `patch_2` (`if`/`else` com `input`);
  - fase 3 → `patch_3` (função com `def`/`return`).
- **Enquanto o terminal estiver aberto, o jogo e o tempo de 6 s ficam pausados.**
- **TESTAR com sucesso:**
  1. Feche o terminal automaticamente e mostre "PATCH n/3 APLICADO!" por ~1 s.
  2. Chame `on_terminal_resolvido(totem_id)` → o chefe vai para DANO.
- **X/ESC sem resolver:** volta para a luta. Se o tempo acabar, o chefe se recupera e repete a fase.
- As 3 soluções em `missoes_chefe.json` **já foram testadas rodando Python de verdade** (todas passam nos testes).
- **Se o terminal ainda não existir no projeto:** implemente um modo provisório com a flag `TERMINAL_SIMPLIFICADO = true`. Nesse modo, apertar E no totem durante VULNERAVEL aplica o patch direto, para poder testar a luta. Deixe isso claro no código.

## 6. Vitória
1. Ao zerar a vida: DERROTA (tela azul `:(` no monitor).
2. O **notebook** se solta em `chefe + (21,109)` e cai com gravidade até y=198, deslizando um pouco para a esquerda.
3. O jogador encosta no notebook → balão "!" por 500 ms → o notebook some (foi recuperado).
4. Diálogo do Byte (mesma caixa da cutscene, no topo): **"Meu notebook! Recuperei!"**
5. Texto grande **"VITÓRIA!"** (amarelo, contorno escuro, sombra dourada) por 1,8 s.
6. Vá para o próximo estado: cutscene final ou créditos (deixe um gancho `on_chefe_derrotado()`).
7. Salve `chefe_derrotado = true`.

## 7. Dano no jogador e derrota
- O jogador usa o sistema de vida e de dano que já existe no jogo (animação de dano + piscar invencível ~1 s).
- Se o Byte perder todas as vidas na luta: animação de morte e opção de **tentar de novo** a partir da APRESENTACAO, com o chefe de vida cheia e os patches resolvidos zerados.

## 8. Etapas de implementação
1. Cena da arena com câmera travada, fundo, plataformas, totem e HUD.
2. Chefe flutuando (PARADO) com o notebook; máquina de estados vazia.
3. Ataque de pacotes; dano no jogador.
4. Lasers (aviso + feixe) baixo e alto; checar que plataforma e agachar desviam.
5. Bugzinhos (andar, dano, morrer quando pisados).
6. VULNERAVEL + totem + terminal (ou o modo `TERMINAL_SIMPLIFICADO`) + DANO + troca de fase.
7. DERROTA, notebook caindo, recuperação, diálogo, VITÓRIA e gancho para o final.
8. Apresentação com a faixa, tentar de novo e flag no save.

## 9. Checklist
- [ ] A faixa "CHEFE FINAL" aparece e o jogo começa depois dela.
- [ ] O chefe flutua segurando o notebook.
- [ ] Os pacotes de erro saem da boca, descem e causam dano; dá para desviar pulando.
- [ ] Laser baixo: o aviso aparece antes; em cima da plataforma não leva dano.
- [ ] Laser alto: agachado não leva dano; em pé leva.
- [ ] Os bugzinhos causam dano e morrem quando pisados.
- [ ] Só no estado vulnerável o totem abre o terminal; o tempo pausa com o terminal aberto.
- [ ] Cada patch certo tira 1/3 da barra; com 3 patches o chefe é derrotado.
- [ ] O notebook cai, o Byte recupera, aparecem o diálogo e VITÓRIA.
- [ ] Morrer na luta permite tentar de novo.
