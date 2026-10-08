// Easter egg : le code Konami (↑ ↑ ↓ ↓ ← → ← → B A) ouvre DOOM, épisode 1 niveau 1.
// Détection : Konami-JS (assets/vendor/konami). Émulation : js-dos 8 (assets/vendor/js-dos).
// Les fichiers du jeu (DOOM.EXE, DOOM1.WAD) se placent dans assets/doom/.

(() => {
  if (typeof Konami === 'undefined') return;

  const base = (path) => new URL(path, document.baseURI).href;

  const JSDOS = base('assets/vendor/js-dos/');
  const GAME_FILES = ['DOOM.EXE', 'DOOM1.WAD'];

  // Configuration DOSBox : lance directement E1M1 en difficulté « Hurt me plenty »
  const DOSBOX_CONF = `
[sdl]
autolock=false

[dosbox]
machine=svga_s3
memsize=16

[cpu]
core=auto
cputype=auto
cycles=max

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1

[autoexec]
echo off
mount c .
c:
DOOM.EXE -warp 1 1 -skill 3
`;

  // Réglages DOOM : Sound Blaster pour les bruitages et la musique, souris désactivée
  const DOOM_CFG = [
    'mouse_sensitivity 5',
    'sfx_volume 8',
    'music_volume 8',
    'show_messages 1',
    'use_mouse 0',
    'snd_channels 8',
    'snd_musicdevice 3',
    'snd_sfxdevice 3',
    'snd_sbport 544',
    'snd_sbirq 7',
    'snd_sbdma 1',
    'screenblocks 10',
    'detaillevel 0',
    'usegamma 0',
  ].join('\n');

  let dialog = null;
  let stage = null;
  let dos = null;
  let assets = null;

  const loadScript = (src) => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.append(el);
  });

  const loadStyle = (href) => {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    document.head.append(el);
  };

  // js-dos ne se charge qu'au premier déclenchement, le site reste léger
  const loadJsDos = () => {
    if (!assets) {
      loadStyle(`${JSDOS}js-dos.css`);
      assets = loadScript(`${JSDOS}js-dos.js`);
    }
    return assets;
  };

  const fetchFile = async (name) => {
    const res = await fetch(base(`assets/doom/${name}`));
    if (!res.ok) throw new Error(`missing:${name}`);
    return { path: name, contents: new Uint8Array(await res.arrayBuffer()) };
  };

  const setStatus = (text) => {
    stage.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'doom__status';
    p.textContent = text;
    stage.append(p);
  };

  const buildDialog = () => {
    dialog = document.createElement('dialog');
    dialog.className = 'doom';
    dialog.setAttribute('aria-label', 'DOOM, épisode 1, niveau 1');
    dialog.innerHTML = `
      <div class="doom__bar">
        <p class="doom__title"><span class="mono">E1M1</span> Hangar</p>
        <button type="button" class="doom__close" aria-label="Fermer DOOM">Fermer <span aria-hidden="true">✕</span></button>
      </div>
      <div class="doom__stage"></div>
      <p class="doom__keys mono">Flèches : se déplacer · Ctrl : tirer · Espace : ouvrir · Maj : courir · Échap : menu</p>
    `;
    stage = dialog.querySelector('.doom__stage');
    dialog.querySelector('.doom__close').addEventListener('click', closeDoom);
    // Échap sert de menu dans DOOM : on ne ferme la popin qu'avec le bouton
    dialog.addEventListener('cancel', (e) => e.preventDefault());
    document.body.append(dialog);
  };

  async function openDoom() {
    if (dialog?.open) return;
    if (!dialog) buildDialog();

    dialog.showModal();
    document.documentElement.classList.add('doom-open');
    setStatus('Chargement de DOOM…');

    try {
      const [files] = await Promise.all([Promise.all(GAME_FILES.map(fetchFile)), loadJsDos()]);
      if (!dialog.open) return;

      stage.innerHTML = '';
      dos = window.Dos(stage, {
        dosboxConf: DOSBOX_CONF,
        initFs: [...files, { path: 'DEFAULT.CFG', contents: new TextEncoder().encode(DOOM_CFG) }],
        pathPrefix: `${JSDOS}emulators/`,
        backend: 'dosbox',
        autoStart: true,
        countDownStart: 0,
        kiosk: true,
        noCloud: true,
        theme: 'dark',
      });
    } catch (err) {
      setStatus(err.message.startsWith('missing:')
        ? 'Les fichiers du jeu ne sont pas encore installés sur ce site.'
        : 'DOOM n\'a pas pu démarrer dans ce navigateur.');
      console.error(err);
    }
  }

  async function closeDoom() {
    try {
      await dos?.stop();
    } catch (err) {
      console.error(err);
    }
    dos = null;
    stage.innerHTML = '';
    dialog.close();
    document.documentElement.classList.remove('doom-open');
  }

  new Konami(openDoom);
})();
