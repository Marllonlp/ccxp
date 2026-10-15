# As aventuras de Byte (CCXP)

Jogo de plataforma 2D em pixel art com desafios de programação em Python. Desenvolvido com HTML, CSS e JavaScript para computador e celular.

## Recursos

- Cinco fases, tutorial da ADA e chefe final Kernel Panic.
- Perguntas de programação e missões com montagem de código no terminal.
- Checkpoints, moedas, vidas e avaliação por estrelas.
- Níveis, estrelas e moedas salvos no navegador; moedas coletadas não reaparecem.
- Controles de toque, menu de pausa e ajustes de música e efeitos.

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

## Build e publicação

Requer Node.js 22 ou superior.

```bash
node scripts/build-pwa.mjs
```

A Vercel executa o build e publica `dist/`, conforme `vercel.json`. A pasta é gerada automaticamente e não deve ser editada.

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
| `src/` | Lógica do jogo, fases, desafios e animações em PNG. |
| `styles/` | Estilos e adaptação às telas. |
| `assets/` | Imagens, sons, fontes e dados das missões. |
| `pwa/` | Service worker para cache offline e atualizações. |
| `scripts/build-pwa.mjs` | Build de produção. |
