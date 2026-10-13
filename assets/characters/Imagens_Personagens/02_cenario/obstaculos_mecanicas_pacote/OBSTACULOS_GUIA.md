# Obstáculos — guia de implementação (As Aventuras de Byte)

Instruções para o agente que vai colocar estes obstáculos no jogo.

## Regras gerais
- **Resolução da gameplay:** 256×240. O chão (pedaços `chao_*`) fica em y=160, e a **superfície onde o Byte pisa é a linha 183** da tela.
- **Pixel art:** filtro **Point/Nearest**, sem compressão.
- **Sprite sheets:** horizontais, com o nome no formato `categoria_nome_LxA_Nf.png` (N frames de L×A). As versões `_2x` e `_4x` são só para visualizar.
- **Colocar no chão:** `y = 184 − altura` (a última linha do sprite encosta na linha 183).
- **Coordenadas "locais":** são medidas dentro do sprite, a partir do canto superior esquerdo.
- **Animação:** 120–180 ms por frame, em loop, salvo indicação abaixo.
- **Alturas do Byte:** em pé ele ocupa ~45 px de altura; agachado, ~33 px.
  - Os perigos de "abaixar" ficam com a parte de baixo a **38–40 px do chão**: acertam o Byte em pé e passam por cima dele agachado.

---

## PULAR POR CIMA (perigos de chão: tocar = dano)
| Arquivo | Tamanho | Hitbox de dano (local) | Notas |
|---|---|---|---|
| `pular_fios_desencapados_32x14_4f` | 32×14 | x 0–31, y 3–10 | faíscas animadas |
| `pular_poca_eletrica_48x10_4f` | 48×10 | x 2–45, y 4–9 | arco elétrico alternando de lado |
| `pular_bomba_logica_20x20_4f` | 20×20 | x 2–17, y 2–19 | timer piscando; opcional: explodir ao tocar |

## ABAIXAR PARA PASSAR (perigos na altura da cabeça)
| Arquivo | Tamanho | Posição y na tela | Hitbox de dano (local) | Notas |
|---|---|---|---|---|
| `abaixar_drone_patrulha_36x22_4f` | 36×22 | `122` | x 2–33, y 1–18 | patrulha na horizontal (ex.: ±48 px, 30 px/s); o feixe vermelho embaixo é só visual |
| `abaixar_laser_cabeca_64x56_4f` | 64×56 | `128` | só o feixe: x 8–55, y 12–17 | os **postes são decorativos (sem colisão)**; no frame 2 o feixe falha (sem dano nesse frame) |
| `abaixar_cabo_pendurado_24x44_4f` | 24×44 | `100` (pendurado de cima) | ponta: x 8–18, y 34–43 | balança; a ponta solta faíscas |

## ANDAR EM CIMA (sólidos / plataformas)
| Arquivo | Tamanho | Superfície (y local) | Comportamento |
|---|---|---|---|
| `andar_em_cima_esteira_64x16_4f` | 64×16 | 2 | sólida; empurra o jogador ~1 px/frame para a direita (espelhe o sprite para a esquerda) |
| `andar_em_cima_caixa_tech_32x32_4f` | 32×32 | 0 | bloco sólido, empilhável |
| `andar_em_cima_plataforma_quebradica_48x16_4f` | 48×16 | 3 | ao ser pisada: F1 (200 ms) → F2 (200 ms) → F3 (200 ms) → some e perde a colisão; volta após 3 s no F0 |
| `andar_em_cima_trampolim_24x24_4f` | 24×24 | 6 | ao cair em cima: F1 (100 ms, comprimida) → F2 (100 ms) e lança o jogador com ~1,5× a força do pulo → F3 → F0 |
| `andar_em_cima_bloco_holografico_32x32_4f` | 32×32 | 0 | ciclo: F0 sólido 1,5 s → F1 pisca 0,5 s → F2 desligado 1,5 s (**sem colisão**) → F3 pisca 0,5 s |
| `andar_em_cima_elevador_48x20_4f` | 48×20 | 4 | plataforma móvel; o movimento é por código (ex.: 60 px de curso, 30 px/s); os propulsores animam em loop |

## OUTROS (mecanismos)
| Arquivo | Tamanho | Comportamento |
|---|---|---|
| `outros_esmagador_32x80_4f` | 32×80 | pistão vindo de cima. Posição: `y = 104`, para que na batida ele encoste no chão. Fases: F0 recolhido 1 s → F1 descendo 150 ms → F2 batida 400 ms (**dano**) → F3 subindo 400 ms. Hitbox da cabeça (local): x 2–29, y `[14, 46, 68, 36][frame]` até +12 |
| `outros_ventilador_32x48_4f` | 32×48 | a base (y local 40–47) é sólida. Zona de vento: x 2–29, do topo da base até 120 px acima; aplica força para cima (o jogador flutua/sobe) |
| `outros_porta_trancada_24x48_4f` | 24×48 | F0 fechada (sólida) → F1, F2 abrindo (100 ms cada) → F3 aberta (**sem colisão**) |
| `outros_botao_pressao_20x10_2f` | 20×10 | F0 solto, F1 apertado. Quando o jogador pisa, abre a porta ligada a ele (ou dispara outro evento) |

---

## Dicas de design de fase
- **Ensine uma mecânica por vez:** primeiro um perigo de chão isolado, depois um de cabeça, depois a combinação.
- **Perigos de abaixar:** deixe espaço antes deles para o jogador perceber e agachar a tempo.
- **Plataformas especiais:** use a quebradiça e o bloco holográfico sobre buracos (`chao_agua`) para criar tensão.
- **Esteira:** combine com o esmagador para exigir timing.
- **Porta + botão:** é um bom gancho para o modo de ensino (por exemplo, o terminal de um totem abre a porta).

## Como validar
- Em pé, o Byte deve levar dano do `laser_cabeca`, do `drone_patrulha` e do `cabo_pendurado`; agachado, deve passar sem dano.
- A plataforma quebradiça precisa reaparecer e voltar a funcionar.
- O bloco holográfico só tem colisão nos frames 0, 1 e 3.
