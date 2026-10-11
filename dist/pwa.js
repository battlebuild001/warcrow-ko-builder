(() => {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  const buttons = [...document.querySelectorAll('.install-app-button')];
  let pendingPrompt;
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const hide = () => buttons.forEach(button => { button.hidden = true; });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    if (installed()) return;
    pendingPrompt = event;
    buttons.forEach(button => { button.hidden = false; });
  });
  window.addEventListener('appinstalled', () => { pendingPrompt = null; hide(); });
  buttons.forEach(button => button.addEventListener('click', async () => {
    if (!pendingPrompt) return;
    const prompt = pendingPrompt;
    pendingPrompt = null;
    hide();
    await prompt.prompt();
    await prompt.userChoice;
  }));
  if (installed()) hide();
})();
