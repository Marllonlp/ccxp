# Terminal do Totem (Python) — instruções para o agente

O jogo ensina **Python**. Ao chegar num **totem** (checkpoint) aparece o botão **ABRIR TERMINAL**.
Ele abre um **mini editor de Python**. O jogador **arrasta trechos de código** (linhas reais de Python) para o arquivo `solucao.py`, ajusta a **indentação** e clica em **TESTAR**.
O **X** no canto fecha o terminal e volta ao jogo (obrigatório durante os testes).

> Formato pedagógico: é um *Parsons problem* (montar o programa a partir de linhas embaralhadas, incluindo a indentação). Não é programação por blocos estilo Scratch: o que aparece é código Python de verdade.

## Antes de começar
1. Identifique a engine e onde ficam as telas/UI. Mostre um plano curto antes de alterar código.
2. Não apague arquivos existentes. Ao final, explique como testar.

## Regras visuais
- **Tela:** 480×270, ampliada com escala inteira; filtro Point/Nearest; suavização de fonte **desligada**.
- **Coordenadas:** em pixels de 480×270, no canto superior esquerdo.
- **Fontes** (inclusas):
  - **Cozette** (`CozetteVector.ttf`, licença MIT), 13 px: **todo código** e o console. É monoespaçada: **cada caractere tem 6 px**.
  - **Pixelify Sans** 11 px (OFL): textos da missão. Some **+3 px entre palavras**, porque o espaço da fonte é estreito.
  - **Press Start 2P** 8 px (OFL): títulos (`MISSÃO 1`, `ENTRADA`, `SAÍDA`).

### Cores de sintaxe Python
| Token | Exemplos | Cor |
|---|---|---|
| palavra-chave | `if else elif for while def return in and or not True False None import from` | `#EC78FF` |
| função nativa | `print input int float str len range` | `#3CE6FF` |
| string | `"PAR"` | `#FFD66E` |
| número | `2`, `0` | `#FFA046` |
| comentário | `# ...` | `#6E82A0` |
| resto (variáveis, operadores) | `n`, `=`, `%` | `#E1E8F5` |

Todos os tokens levam sombra `#04060C` deslocada (+1,+1).

## Arquivos
| Arquivo | Uso |
|---|---|
| `tela_terminal_python_vazia_480x270.png` | fundo fixo: painel, aba `solucao.py`, numeração 1–10, área de trechos, botões, console e X; **sem textos variáveis** |
| `tela_terminal_python_exemplo_480x270.png` | referência com a Missão 1 resolvida |
| `tela_terminal_python_guia.png` | áreas MISSÃO, CÓDIGO (com as guias de indentação), TRECHOS e SAÍDA |
| `cartucho_{entrada,decisao,saida,outro}_{normal,hover}_114x18.png` | "cartucho" vazio de cada trecho (placa com pinos de chip + barra colorida do tipo) |
| `botao_testar_*`, `botao_dica_*` (118×28) | botões nos estados normal / selecionado / pressionado |
| `botao_fechar_x_*` (20×22) | botão X |
| `botao_abrir_terminal_*` (150×28) | botão que aparece sobre o totem |
| `missoes.json` | conteúdo de cada missão |
| `terminal_python_preview.gif` | o fluxo completo animado |

## Posições (480×270)
| Elemento | Posição |
|---|---|
| Botão X | `(439, 7)`; clique em x 440–458, y 8–28 |
| Título da missão | Press Start, amarelo `#FFD646`, centralizado em x=84, topo y=42 |
| Enunciado | começa em `(22, 58)`, quebra em 126 px, linha de 11 px |
| `ENTRADA` / `SAÍDA` | Press Start ciano `#3CE6FF`, com 8 px antes de cada um; itens com marcador amarelo 3×3 em x=23 e texto em x=30 |
| Exemplos | mini console no fim da coluna (caixa x 20–148, 30 px de altura): `> 4` cinza e `PAR` verde, dois exemplos lado a lado (x 25 e x 85) |
| Linhas do editor | 10 linhas; topo da linha *i* (0–9) = `53 + 14·i` |
| Código na linha | `x = 184 + 24·indent` (indent = 0 a 3; cada nível = 4 espaços × 6 px) |
| Guias de indentação | linha pontilhada `#28384F` em `x = 185 + 24·k` para cada nível *k* < indent da linha |
| Cursor | retângulo verde `#5AFF8C` 2×11 no início da próxima linha livre; pisca a cada 400 ms |
| Área de soltar | linha pontilhada `#283C5A` na base da próxima linha livre |
| Trecho *i* na lista | cartucho em `(344, 54 + 19·i)`; código em `(+8, +2)` dentro dele; máximo de **17 caracteres** por trecho |
| Botão TESTAR | `(344, 174)` |
| Botão DICA | `(344, 202)` |
| Console | cabeçalho fixo `$ python solucao.py`; linhas de saída em `(165, 216 + 11·i)`, no máximo 3 visíveis (role as antigas), até 28 caracteres |

Cores das mensagens do console:
- **Saída correta:** `#5AFF8C`.
- **Erro:** `#FF606E`.
- **Resumo e dica:** `#FFD646`.

## Comportamento
- **Abrir:** o botão ABRIR TERMINAL aparece quando o Byte encosta num totem ativo, centralizado sobre ele (`x = centro − 75`, `y = topo − 37`, balançando ±1 px). **E**, Enter ou clique abrem o terminal.
- **Enquanto aberto:** o jogo fica **pausado**.
- **Fechar (modo de teste):**
  - **X** ou **ESC** fecham o terminal e retomam o jogo de onde estava.
  - Use uma flag `PERMITIR_FECHAR_TERMINAL = true`.
  - O progresso do `solucao.py` daquele totem fica guardado ao fechar.
- **Arrastar trechos:**
  - Cada trecho é **usado uma vez**: ao ser arrastado para o editor, ele **sai da lista**. Ao ser arrastado de volta (ou para fora do editor), retorna à lista.
  - Ao soltar no editor, o trecho entra na linha sob o mouse, ou na próxima livre, empurrando as de baixo.
  - **Indentação:** a posição horizontal do soltar escolhe o nível (0–3, a cada 24 px), mostrando as guias pontilhadas. Com uma linha selecionada, **Tab** / **Shift+Tab** também mudam o nível.
  - Linhas do editor podem ser arrastadas para reordenar.
  - Ao passar o mouse, use o cartucho `hover`.
  - Os trechos com `"distrator": true` não fazem parte da solução, mas aparecem misturados para desafiar.
- **TESTAR:**
  1. Monte o código como texto Python: 4 espaços por nível + o código de cada linha.
  2. **Validação recomendada:** executar o código de verdade com um interpretador embutido (por exemplo Pyodide/Brython em versão web; nas outras engines, um interpretador Python simples). Para cada caso de `testes`, forneça `entrada` ao `input()` e compare a saída com `esperado`.
  3. **Alternativa mais simples:** comparar a sequência `{id, indent}` com `solucao`. Aceite também `solucoes_alternativas`, se existir.
  4. Mostre cada teste no console (`entrada 4 -> PAR    OK` em verde, ou `ERRO` em vermelho, mostrando o esperado) e por fim `2/2 testes passaram!` em amarelo.
  5. **Erros de Python** (indentação, sintaxe): mostre a mensagem curta em vermelho (ex.: `IndentationError na linha 3`).
  6. **Tudo certo:** marque a missão como resolvida e dispare `on_terminal_resolvido(totem_id)`, por exemplo para abrir uma porta ou dar estrelas.
- **DICA:** escreve o campo `dica` no console, em amarelo.

## Dados (`missoes.json`)
Cada missão tem:
- `id`, `titulo`, `enunciado`, `entrada`;
- `saida` (lista de itens);
- `exemplos` (`entrada` / `saida`, para o mini console);
- `trechos` (`id`, `codigo`, `tipo`, opcional `distrator`); a lista mostra até 6, **embaralhados**;
- `solucao` (lista de `{id, indent}`);
- `testes` (`entrada` / `esperado`);
- `dica`.

Cor da barra de cada `tipo`:
| `tipo` | Cor |
|---|---|
| `entrada` | laranja |
| `decisao` | rosa |
| `saida` | ciano |
| `outro` | cinza |

Ligue cada totem a um `id` de missão. Nenhum texto variável deve ficar dentro das imagens.

## Como validar
- [ ] Encostar no totem mostra o botão; E abre o terminal; X e ESC fecham e o jogo continua.
- [ ] Montar a Missão 1 com a indentação certa → 3 testes OK em verde.
- [ ] Esquecer o recuo do `print("PAR")` → erro de indentação em vermelho.
- [ ] Usar o distrator `print(n)` → teste falha mostrando o esperado.
- [ ] DICA escreve a dica no console.
- [ ] Comparar com `tela_terminal_python_exemplo_480x270.png`.
