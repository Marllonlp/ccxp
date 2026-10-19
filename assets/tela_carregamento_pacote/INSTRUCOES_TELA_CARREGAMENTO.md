# Tela de carregamento

**Problema:** no primeiro acesso, as imagens e os GIFs aparecem um por um na tela inicial.
**Solução:** uma tela de carregamento cobre o jogo desde o primeiro instante e só sai, com fade, quando os GIFs, as imagens do CSS e as fontes estiverem prontos.

Referências visuais: `tela_carregamento_1920x1080.png` e `tela_carregamento_preview.gif`.

O que a tela mostra:
- o título "AS AVENTURAS DE BYTE";
- o **Byte correndo em cima da barra de progresso**, acompanhando a porcentagem;
- o texto "CARREGANDO... 47%";
- um quadro da **ADA com dicas de Python**, que trocam a cada 3,5 s.

**Analise o projeto e mostre o plano antes de alterar código.** Não mude a lógica do jogo, só a ordem de exibição.

## 1. Arquivos novos
- `src/carregamento.js`: copie como está.
- `styles/carregamento.css`: cole o conteúdo **no final de `styles/main.css`**, ou importe com `@import` no topo.

## 2. `index.html`
Use `trecho_index.html`:
1. No `<head>`, **antes** do `<link rel="stylesheet">`, as duas linhas `<link rel="preload" ...>` (o GIF do Byte correndo e a ADA, para a própria tela de carregamento aparecer pronta).
2. Logo depois de `<body>`, como **primeiro elemento**, antes de `<main class="game-shell">`, o bloco `<div id="tela-carregamento">`.

A tela usa só arquivos que já existem no projeto: `01_byte/01_byte_correndo.gif`, `assets/ada/ada_parado_4f_32x32.png` e a fonte Press Start 2P.

## 3. `src/player.js`: registrar cada GIF
No topo:
```js
import { registrarCarregamento } from './carregamento.js';
```
No `constructor` da classe `AnimacaoGIF`, troque o `if (typeof ImageDecoder ...)` por:
```js
if (typeof ImageDecoder !== 'undefined' && caminho.endsWith('.gif')) {
  this.pronto = this._decodificar();
} else {
  this.pronto = new Promise((resolve) => {
    if (this.img.complete) return resolve();
    this.img.addEventListener('load', resolve, { once: true });
    this.img.addEventListener('error', resolve, { once: true });
  });
}
registrarCarregamento(this.pronto);
```
`_decodificar()` já trata os erros, então um arquivo com problema não trava o carregamento.

## 4. `src/main.js`: iniciar a tela
No topo:
```js
import { iniciarTelaCarregamento } from './carregamento.js';
```
Na **última linha** do arquivo, depois de toda a inicialização:
```js
iniciarTelaCarregamento();
```
Ela espera os recursos registrados, as imagens do HTML, as imagens usadas no CSS (fundos e botões da tela de título, HUD...) e a fonte. Depois:
- fica no mínimo 0,8 s na tela, para não piscar quando tudo já está em cache;
- tem um limite de 20 s, para nunca travar o jogo;
- some com fade, foca o botão JOGAR e dispara o evento `jogo-carregado` na `window`.

**Não espere a música** (3,4 MB): ela continua carregando em segundo plano e só toca depois do primeiro clique, como hoje.

## 5. Comportamento esperado
- Enquanto carrega, o teclado fica bloqueado (Enter não começa o jogo por trás da tela) e o clique não passa.
- A barra só anda para frente, mesmo que novos recursos sejam registrados no meio.
- Com `prefers-reduced-motion`, a ADA e os pontinhos ficam parados.
- Nas próximas visitas, com a PWA em cache, a tela aparece só por um instante.
- O build (`scripts/build-pwa.mjs`) já inclui `src/` e `styles/` inteiros, então o novo arquivo entra no cache offline sem mudar nada.

## 6. Checklist
- [ ] Ao abrir o jogo pela primeira vez, aparece só a tela de carregamento; nada pisca por trás.
- [ ] A barra e a porcentagem avançam, e o Byte corre junto até o fim.
- [ ] As dicas da ADA trocam enquanto carrega.
- [ ] Ao terminar, a tela some com fade e a tela inicial aparece **completa**, com fundo, logo e botões.
- [ ] Enter e cliques durante o carregamento não fazem nada.
- [ ] Testar no DevTools com **Network → Slow 4G** e **Disable cache**, no computador e no celular na horizontal.
- [ ] Se um arquivo não existir (erro 404), o carregamento termina mesmo assim.
