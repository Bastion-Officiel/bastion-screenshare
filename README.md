# 🖥️ bastion-screenshare

<p align="center">
  <img src="https://img.shields.io/badge/Flux-60_FPS-ED4245?style=for-the-badge" alt="Flux 60 FPS" />
  <a href="https://developer.mozilla.org/fr/docs/Web/API/MediaStream"><img src="https://img.shields.io/badge/MediaStream-W3C-23A55A?style=for-the-badge" alt="MediaStream" /></a>
  <img src="https://img.shields.io/badge/Canvas-Hardware_Accelerated-5865F2?style=for-the-badge" alt="Canvas" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Pipeline de streaming et capture d'écran multi-sources jusqu'à 60 FPS pour BASTION.</strong><br/>
  Capture d'écran, fenêtres logicielles ou onglets, audio système intégré, incrustation Picture-in-Picture (PiP) et adaptation dynamique de flux.
</p>

---

## 🌟 Caractéristiques

- 🚀 **Fluidité Ultra-Haute (60 FPS)** : Profil d'encodage optimisé pour le streaming de jeux et de présentations.
- 🔊 **Audio Système Intégré** : Capture le son de l'application ou du jeu sans écho micro.
- 🎨 **Compositeur Canvas Accéléré** : Permet l'incrustation directe de votre caméra en coin (Picture-in-Picture) sur le même flux vidéo.
- 🎛️ **Adaptation Dynamique** : Basculement fluide entre 720p, 1080p et 1440p selon les conditions réseau.

---

## 📦 Installation

```bash
npm install @bastion-hub/screenshare
```

---

## 🚀 Utilisation

### 1. Démarrer le partage d'écran en 60 FPS

```javascript
const { ScreensharePipeline } = require('@bastion-hub/screenshare');

const pipeline = new ScreensharePipeline({
    fps: 60,
    resolution: '1080p',
    includeSystemAudio: true
});

// Lance la demande de sélection d'écran du navigateur
const stream = await pipeline.startCapture();

// Connecter le flux au lecteur vidéo
const videoElement = document.getElementById('my-stream-player');
videoElement.srcObject = stream;

// Écouter l'arrêt du partage
pipeline.on('stopped', () => {
    console.log('🔴 Partage d\'écran terminé.');
});
```

### 2. Incrustation Webcam (PiP) sur le flux

```javascript
const { CanvasCompositor } = require('@bastion-hub/screenshare');

const compositor = new CanvasCompositor(1920, 1080);
const mixedStream = compositor.compose(screenVideoEl, cameraVideoEl);
// mixedStream transmet maintenant l'écran avec la webcam incrustée à 60 FPS !
```

---

## 📄 Licence

Distribué sous licence **MIT**. Développé pour la plateforme **BASTION**.
