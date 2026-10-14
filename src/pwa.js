// O servidor de desenvolvimento continua sem cache. O build habilita a PWA.
const buildPWA = document.querySelector('meta[name="pwa-build"]')?.content === 'production';

if (buildPWA && window.isSecureContext && 'serviceWorker' in navigator) {
  iniciarPWA();
}

function iniciarPWA() {
  const painel = document.querySelector('.pwa-controls');
  const botaoInstalar = document.getElementById('botao-instalar');
  const ajudaIOS = document.getElementById('instalar-ios');
  const status = document.getElementById('pwa-status');
  const modoAplicativo = window.matchMedia('(display-mode: standalone)');
  const dispositivoIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let conviteInstalacao = null;
  let prontoOffline = false;
  let atualizacaoPronta = false;
  let falhaPreparacao = false;

  painel.hidden = false;

  function atualizarStatus() {
    if (atualizacaoPronta) {
      status.textContent = 'Nova versão pronta. Para atualizar, feche todas as abas e janelas do jogo e abra novamente.';
    } else if (prontoOffline) {
      status.textContent = navigator.onLine ? 'Pronto para jogar offline' : 'Você está jogando offline';
    } else if (falhaPreparacao) {
      status.textContent = 'Modo offline indisponível. Tente abrir o jogo novamente com internet.';
    } else {
      status.textContent = 'Preparando jogo offline…';
    }
  }

  function atualizarInstalacao() {
    const instalado = modoAplicativo.matches || navigator.standalone === true;
    botaoInstalar.hidden = instalado || !conviteInstalacao;
    ajudaIOS.hidden = instalado || !dispositivoIOS || Boolean(conviteInstalacao);
  }

  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    conviteInstalacao = evento;
    atualizarInstalacao();
  });

  botaoInstalar.addEventListener('click', async () => {
    if (!conviteInstalacao) return;
    const convite = conviteInstalacao;
    conviteInstalacao = null;
    botaoInstalar.disabled = true;
    try {
      await convite.prompt();
      await convite.userChoice;
    } catch (erro) {
      console.warn('Não foi possível abrir a instalação do jogo:', erro);
    } finally {
      botaoInstalar.disabled = false;
      atualizarInstalacao();
    }
  });

  window.addEventListener('appinstalled', () => {
    conviteInstalacao = null;
    ajudaIOS.hidden = true;
    botaoInstalar.hidden = true;
  });
  modoAplicativo.addEventListener('change', atualizarInstalacao);
  window.addEventListener('online', atualizarStatus);
  window.addEventListener('offline', atualizarStatus);
  atualizarInstalacao();
  atualizarStatus();

  const enderecoWorker = new URL('../sw.js', import.meta.url);
  // Reutiliza o registro ao abrir offline: register() pode tentar buscar o script na rede.
  navigator.serviceWorker.getRegistration(enderecoWorker)
    .then((existente) => existente || navigator.serviceWorker.register(enderecoWorker, { updateViaCache: 'none' }))
    .then((registro) => {
      function observarWorker(worker) {
        if (!worker) return;
        function mudouEstado() {
          if (worker.state === 'installed' && registro.active) {
            atualizacaoPronta = true;
          } else if (worker.state === 'redundant' && !registro.active) {
            falhaPreparacao = true;
          }
          atualizarStatus();
        }
        worker.addEventListener('statechange', mudouEstado);
        mudouEstado();
      }

      atualizacaoPronta = Boolean(registro.waiting);
      observarWorker(registro.installing);
      registro.addEventListener('updatefound', () => observarWorker(registro.installing));
      navigator.serviceWorker.ready.then(() => {
        prontoOffline = true;
        atualizarStatus();
      });
      atualizarStatus();

      if (navigator.onLine && !registro.installing) {
        registro.update().catch(() => { /* A versão offline continua disponível. */ });
      }

      // Verifica novas versões ao voltar ao app, sem trocar a versão em uso.
      let ultimaVerificacao = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden || !navigator.onLine || Date.now() - ultimaVerificacao < 60_000) return;
        ultimaVerificacao = Date.now();
        registro.update().catch(() => { /* A versão offline continua disponível. */ });
      });
    })
    .catch((erro) => {
      falhaPreparacao = true;
      atualizarStatus();
      console.warn('Não foi possível preparar o jogo offline:', erro);
    });
}
