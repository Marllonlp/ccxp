# Loja de skins do Byte

Adiciona uma **Loja**, aberta pelo botão **LOJA da tela inicial**, com 8 skins para o Byte. Elas se liberam de três formas:

| Skin | Como libera |
|---|---|
| Byte Pythonista | Compra: 40 moedas |
| Byte Hacker | Compra: 30 moedas |
| Byte Astronauta | Compra: 60 moedas |
| Byte Glitch | Compra: 45 moedas |
| Byte Dourado | Conquista: 3 estrelas em todos os níveis |
| Matador de Vírus | Conquista: derrotar o Kernel Panic |
| Byte Programadores do Amanhã | Social: abrir o perfil no Instagram |
| Byte Framework Digital | Social: abrir o perfil no Instagram |

Referências visuais: `loja_skins_byte.png` (vitrine) e `skins_preview.gif` (todas correndo).
Dados: `skins.json`. **Leia este guia inteiro, analise o projeto e mostre o plano antes de alterar código.**

## 1. Arquivos
Copie a pasta `skins/` deste pacote para `assets/characters/Imagens_Personagens/skins/`. Cada skin tem os mesmos 7 GIFs do Byte original, com os **mesmos nomes, tamanho (96×96), número de quadros e tempos**:

```
skins/<id>/01_byte_correndo.gif   02_byte_parado.gif   03_byte_pulando.gif   04_byte_agachado.gif
           05_byte_caindo.gif     06_byte_dano.gif     07_byte_morte.gif
```

A skin `classico` usa a pasta original `01_byte/`.

## 2. Trocar a skin no personagem (`src/player.js`)
Hoje as animações apontam fixo para `01_byte/` (linhas ~88–94). Transforme isso numa função:
- `pastaDaSkin(id)`: devolve `01_byte/` para `classico` e `skins/<id>/` para as outras.
- `carregarAnimacoesByte(id)`: cria os 7 `AnimacaoGIF` a partir dessa pasta.
- Ao equipar uma skin, recarregue as animações. O tamanho e a hitbox do Byte **não mudam**.

## 3. Carteira e progresso (`src/main.js`, objeto `progresso` no `localStorage`)
Acrescente ao progresso salvo, mantendo a compatibilidade com saves antigos (campos ausentes recebem o padrão):

```js
{ ..., carteira: 0, skinsCompradas: ['classico'], skinsSociais: [], skinEquipada: 'classico' }
```

- **Moedas viram saldo:** ao concluir uma fase, some as moedas coletadas na partida à `carteira`. Repetir fases também rende moedas. Isso é necessário porque o jogo inteiro tem só 72 moedas e as compras somam 175.
- Mostre o saldo na Loja e, se quiser, na tela de níveis.
- **Apagar dados** também zera carteira e skins.

## 4. Regras de liberação
- **Compra:** botão **Comprar** ativo só se `carteira >= preco`. Ao comprar: desconta, adiciona a `skinsCompradas` e salva.
- **Conquista:** a skin está liberada quando a condição é verdadeira no progresso. Verifique sempre que a Loja abrir:
  - `tres_estrelas_em_todos`: os 5 níveis com `estrelas === 3`;
  - `chefe_derrotado`: o campo `chefe_derrotado` já existente.
- **Social:** botão **Abrir Instagram**. Ao clicar:
  1. Abra o link com `window.open(url, '_blank', 'noopener')`.
  2. Adicione o id a `skinsSociais` e salve.
  3. Mostre "Skin liberada! Obrigado por seguir".

  Não exija login nem verifique se a pessoa seguiu: é só abrir o perfil. Os links estão em `skins.json`; troque `[CONFIRMAR_PERFIL_...]` pelos perfis oficiais.
- **Equipar:** qualquer skin liberada pode ser equipada; salve em `skinEquipada`.

## 5. Botão LOJA na tela inicial e tela da Loja
**A Loja é acessada pela tela inicial (título)**, por um novo botão laranja **LOJA**, o segundo do menu: JOGAR, **LOJA**, COMO JOGAR, SOBRE. Referência visual: `tela_titulo_com_loja_1920x1080.png`.

**Arquivos do botão:** copie `titulo_botao_loja_{normal,selecionado,pressionado}_156x32_4x.png` (e as versões 1x) para `assets/characters/Imagens_Personagens/02_cenario/tela_titulo_pacote/`. Eles têm o mesmo tamanho e estilo dos outros botões do título.

**`index.html`**: dentro de `.titulo-menu`, logo depois de `botao-titulo-jogar`:
```html
<button type="button" id="botao-titulo-loja" class="botao-titulo"><span class="sr-only">Loja</span></button>
```

**`styles/main.css`**: repita o padrão dos outros botões:
- `#botao-titulo-loja` com a imagem `..._loja_normal_...`;
- `#botao-titulo-loja.selecionado` com a imagem `..._loja_selecionado_...`;
- `#botao-titulo-loja:active` com a imagem `..._loja_pressionado_...`.

Com 4 botões, o menu precisa subir um pouco para não encostar na dica do rodapé. Mude `.titulo-menu` para `top: 37%`, mantendo `left`, `width` e `gap`. Confira em 16:9 e no celular na horizontal se o último botão não cobre a dica "SETAS: ESCOLHER".

**`src/main.js`**: inclua o botão em `botoesTitulo`, na ordem `[jogar, loja, como, sobre]`, e trate o clique e o Enter abrindo a Loja (novo estado `'loja'`). A navegação por setas e o cursor animado já usam a lista e a posição de cada botão, então passam a funcionar sozinhos; confira se `indiceTitulo` continua certo.

**Tela da Loja**
- Grade de cartões como em `loja_skins_byte.png`, um por skin, incluindo o Clássico. Cada cartão tem o Byte parado animado, o nome e o estado:

  | Estado | O que mostra |
  |---|---|
  | Bloqueada (conquista) | Cadeado + texto do requisito |
  | À venda | Moeda + preço + **Comprar** (cinza se faltar saldo) |
  | Social | **Abrir Instagram** |
  | Liberada | **Equipar** |
  | Equipada | Selo ✓ **Equipada** |

- Saldo no topo: ícone da moeda + número.
- Navegação por setas + Enter e por clique/toque, igual à tela de níveis. ESC ou **Voltar** retorna à tela inicial, com o cursor no botão LOJA.

## 6. Efeitos especiais (campo `efeito` em `skins.json`)
- **`rastro_terminal` (Hacker):** enquanto o Byte corre ou está no ar, a cada ~80 ms solte atrás dele um caractere verde aleatório (`0`, `1`, `{`, `}`, `<`, `>`, `;`). Ele cai devagar e some em 0,5 s. Use fonte monoespaçada pequena e no máximo 12 caracteres na tela.
- **`tremor_glitch` (Glitch):** a cada 2 a 4 segundos (aleatório), desloque o desenho do Byte 2 px para o lado por 120 ms. Os GIFs já têm a borda ciano e magenta. Não pisque a tela inteira.

## 7. Checklist
- [ ] O botão LOJA aparece na tela inicial, entre JOGAR e COMO JOGAR, e funciona com setas, Enter, clique e toque.
- [ ] Moedas coletadas entram na carteira ao concluir a fase, e repetir a fase rende mais moedas.
- [ ] Comprar desconta o saldo; sem saldo, o botão fica desativado.
- [ ] Dourado libera com 3 estrelas em todos os níveis; Matador libera depois do chefe.
- [ ] Abrir o Instagram libera a skin social, sem pedir login.
- [ ] Equipar troca todas as animações (parado, correndo, pulando, caindo, agachado, dano e morte).
- [ ] A skin equipada continua depois de recarregar a página e na versão offline (PWA).
- [ ] Inclua os novos GIFs no build da PWA, para funcionarem offline.
- [ ] Apagar dados volta ao Clássico com carteira zerada.
