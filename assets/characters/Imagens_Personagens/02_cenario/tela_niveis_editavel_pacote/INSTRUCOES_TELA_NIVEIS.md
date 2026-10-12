# Tela de Seleção de Níveis — instruções para o agente

Implemente a tela de seleção de níveis do jogo **As Aventuras de Byte** usando os assets desta pasta.
**Os nomes dos níveis NÃO estão nas imagens**: eles devem ser escritos pela engine como texto,
lidos de `niveis.json`, para que possam ser trocados sem editar imagens.

## Antes de começar
1. Identifique a engine/framework do projeto e onde ficam cenas, UI e fontes.
2. Mostre um plano curto antes de alterar código. Não apague nem sobrescreva arquivos existentes.
3. Ao final, explique o que foi feito e como testar.

## Regras de pixel art
- Resolução virtual desta tela: **480×270**, ampliada com **escala inteira** (×4 = 1920×1080).
- Filtro de textura **Point/Nearest**, sem compressão.
- Todas as coordenadas abaixo estão em **pixels da tela 480×270**, origem no **canto superior esquerdo**, e indicam o **canto superior esquerdo** de cada imagem.

## Arquivos
| Arquivo | Uso |
|---|---|
| `tela_niveis_painel_transparente_480x270.png` | painel + título + trilha de circuito; fundo transparente (vai por cima do cenário animado) |
| `tela_niveis_painel_com_cenario_480x270.png` | mesma coisa com o cenário estático, caso não use o cenário animado |
| `card_nivel{N}_{estado}[_selecionado]_sem_nome_86x124.png` | cartões; N = 1–5; estado = `completo`, `disponivel` ou `bloqueado` (bloqueado não tem versão selecionada) |
| `estrela_cheia_11x11.png`, `estrela_vazia_11x11.png` | estrelas conquistadas |
| `cursor_baixo_2f_11x10.png` | setinha de seleção (2 frames de 11×10) |
| `botao_voltar_{normal,selecionado,pressionado}_156x32.png` | botão Voltar |
| `PressStart2P-Regular.ttf` | fonte pixel (licença OFL) |
| `niveis.json` | dados dos níveis (nome, estado, estrelas) |
| `tela_niveis_guia_texto.png` | referência visual: os retângulos rosa mostram onde o nome entra |

O cenário animado de fundo (céu, nuvens, colinas, chão, Byte correndo) é o mesmo da tela inicial e reutiliza os assets já existentes no projeto.

## Ordem das camadas (de trás para frente)
1. Cenário animado (ou `tela_niveis_painel_com_cenario`, que já o inclui).
2. `tela_niveis_painel_transparente` (se o cenário for animado).
3. Os 5 cartões.
4. Nome de cada nível (texto da engine).
5. Estrelas.
6. Cursor, dica de rodapé e botão Voltar.

## Posições (n = 1 a 5)
| Elemento | x | y |
|---|---|---|
| Cartão do nível n | `27 + 86·(n−1)` | `51` |
| Nome do nível n (centro do texto) | centro em `70 + 86·(n−1)` | topo em `116` |
| Estrela k (k = 0, 1, 2) do nível n | `53 + 86·(n−1) + 12·k` | `129` |
| Cursor sobre o nível selecionado | `65 + 86·(n−1)` | `40` (alterna com `41`) |
| Dica do rodapé (centro do texto) | centro em `240` | topo em `184` |
| Botão Voltar | `162` | `205` |

**Cartão selecionado:** ele sobe um pouco. Alterne o deslocamento vertical entre **−1 e −2 px** a cada **400 ms**, e aplique o **mesmo deslocamento** ao nome e às estrelas daquele cartão.

## Texto dos nomes
- **Fonte:** Press Start 2P, tamanho **8 px** na tela 480×270 (32 px em 1920×1080).
- **Suavização:** **desligada** (antialiasing off / font filter nearest).
- **Cor:** `#FFFFFF` nos estados `completo` e `disponivel`; `#8C92A6` no `bloqueado`.
- **Sombra:** `#0C0E1C`, deslocada **+1 px em x e +1 px em y**.
- **Alinhamento:** centralizado horizontalmente no ponto indicado.
- **Limite:** **9 caracteres** (72 px). Se o nome for maior, abrevie ou peça um cartão com duas linhas.
- **Acentos:** as letras maiúsculas acentuadas da Press Start 2P podem aparecer como minúsculas. Teste `Á Í Ó Ã Õ Ç Ê`. Se saírem erradas, escreva a letra sem acento e desenhe o acento com pixels da mesma cor (e a mesma sombra). Use estes deslocamentos a partir do canto superior esquerdo da letra, em pixels de 8 px:
  - agudo (Á É Í Ó): `(4,−3) (3,−2)`;
  - til (Ã Õ): `(1,−2) (2,−3) (3,−2) (4,−2) (5,−3)`;
  - circunflexo (Ê): `(2,−2) (3,−3) (4,−2)`;
  - cedilha (Ç): `(3,7) (4,8) (3,9)`.

## Dica do rodapé
- **Texto:** `SETAS: ESCOLHER   ENTER: JOGAR`.
- **Estilo:** mesma fonte, cor branca e mesma sombra dos nomes.
- **Animação:** pisca a cada **800 ms** (visível/invisível).

## Dados (`niveis.json`)
```json
{ "numero": 1, "nome": "NÍVEL 1", "descricao": "(a definir)", "estado": "disponivel", "estrelas": 0 }
```
- `estado`: `completo` | `disponivel` | `bloqueado`.
- `estrelas`: de 0 a 3. Desenhe a estrela cheia para `k < estrelas` e a vazia para as demais. Nos cartões `bloqueado`, não desenhe estrelas.
- `nome`: o texto que aparece no cartão.
- `descricao`: o texto que vai para a caixa "Nesse nível, Byte vai aprender sobre:" na tela de início de nível.
- Os nomes ainda serão definidos: mantenha os valores provisórios e garanta que trocar o JSON atualize a tela sem mudar código.

## Comportamento
- **Seleção:**
  - setas ←/→ (ou A/D) mudam o nível selecionado;
  - níveis `bloqueado` não podem ser selecionados: pule-os ou faça o cartão tremer ±1 px por 200 ms;
  - o cursor alterna seus 2 frames a cada **200 ms**.
- **Confirmação:** Enter, ou clique num cartão liberado, abre a **tela de início de nível** passando o número do nível.
- **Voltar:** ESC, ou o botão Voltar, retorna à tela inicial.
  - O botão usa o estado `selecionado` quando estiver em foco ou com o mouse em cima.
  - Ao confirmar, mostre o estado `pressionado` por ~100 ms antes de trocar de tela.
- **Progresso:** ao concluir um nível, salve `estado = completo` e as estrelas ganhas. O nível seguinte passa de `bloqueado` para `disponivel`. Persista esse progresso (save local).

## Como validar
- Compare a tela montada com `tela_niveis_guia_texto.png`: os nomes devem ficar dentro dos retângulos rosa.
- Troque um nome em `niveis.json` e confirme que a tela muda sem recompilar imagens.
- Teste um nome com acento (ex.: `LÓGICA`) e outro com 9 letras (ex.: `VARIÁVEIS`).
