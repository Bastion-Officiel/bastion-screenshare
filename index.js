/**
 * @bastion-hub/screenshare
 * Pipeline de streaming et capture d'écran multi-sources jusqu'à 60 FPS pour BASTION
 */

class EventEmitter {
    constructor() {
        this._events = {};
    }
    on(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
        return this;
    }
    off(event, listener) {
        if (!this._events[event]) return this;
        this._events[event] = this._events[event].filter(l => l !== listener);
        return this;
    }
    emit(event, ...args) {
        if (!this._events[event]) return false;
        this._events[event].forEach(l => l(...args));
        return true;
    }
}

/**
 * Gestionnaire de capture d'écran et streaming BASTION
 */
class ScreensharePipeline extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            fps: options.fps || 60,
            resolution: options.resolution || '1080p', // '720p', '1080p', '1440p', 'source'
            includeSystemAudio: options.includeSystemAudio ?? true,
            cursor: options.cursor || 'always', // 'always', 'motion', 'never'
            displaySurface: options.displaySurface || 'monitor', // 'monitor', 'window', 'browser'
            ...options
        };

        this.stream = null;
        this.videoTrack = null;
        this.audioTrack = null;
        this.isActive = false;
        this.compositor = null;
    }

    getResolutionConstraints() {
        switch (this.options.resolution) {
            case '720p':
                return { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 } };
            case '1440p':
                return { width: { ideal: 2560, max: 2560 }, height: { ideal: 1440, max: 1440 } };
            case '1080p':
            default:
                return { width: { ideal: 1920, max: 1920 }, height: { ideal: 1080, max: 1080 } };
        }
    }

    async startCapture() {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
            throw new Error("getDisplayMedia n'est pas supporté par ce navigateur ou environnement.");
        }

        const resConstraints = this.getResolutionConstraints();

        const displayMediaOptions = {
            video: {
                ...resConstraints,
                frameRate: { ideal: this.options.fps, max: this.options.fps },
                cursor: this.options.cursor,
                displaySurface: this.options.displaySurface
            },
            audio: this.options.includeSystemAudio ? {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } : false
        };

        try {
            this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            this.videoTrack = this.stream.getVideoTracks()[0] || null;
            this.audioTrack = this.stream.getAudioTracks()[0] || null;
            this.isActive = true;

            // Écouter l'arrêt utilisateur (ex: barre système "Arrêter le partage")
            if (this.videoTrack) {
                this.videoTrack.onended = () => {
                    this.stopCapture();
                };
            }

            this.emit('started', {
                stream: this.stream,
                settings: this.videoTrack ? this.videoTrack.getSettings() : null
            });

            return this.stream;
        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    }

    async setFrameRate(targetFps) {
        this.options.fps = targetFps;
        if (this.videoTrack && this.videoTrack.applyConstraints) {
            await this.videoTrack.applyConstraints({
                frameRate: { ideal: targetFps, max: targetFps }
            });
            this.emit('fpsChange', targetFps);
        }
    }

    stopCapture() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stream = null;
        this.videoTrack = null;
        this.audioTrack = null;
        this.isActive = false;

        this.emit('stopped');
    }
}

/**
 * Compositeur Canvas haute performance pour incrustation Picture-in-Picture (PiP)
 */
class CanvasCompositor {
    constructor(width = 1920, height = 1080) {
        this.width = width;
        this.height = height;
        this.canvas = null;
        this.ctx = null;
        this._running = false;
        this._rafId = null;

        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d', { alpha: false });
        }
    }

    compose(screenElement, cameraElement = null) {
        if (!this.ctx) return null;
        this._running = true;

        const renderFrame = () => {
            if (!this._running) return;

            // Dessiner l'écran principal
            if (screenElement && screenElement.videoWidth) {
                this.ctx.drawImage(screenElement, 0, 0, this.width, this.height);
            }

            // Incruster la caméra en coin inférieur droit (PiP) si active
            if (cameraElement && cameraElement.videoWidth) {
                const pipW = this.width * 0.22;
                const pipH = (pipW * 9) / 16;
                const margin = 24;
                const pipX = this.width - pipW - margin;
                const pipY = this.height - pipH - margin;

                this.ctx.save();
                this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
                this.ctx.shadowBlur = 12;
                this.ctx.drawImage(cameraElement, pipX, pipY, pipW, pipH);
                this.ctx.restore();
            }

            this._rafId = requestAnimationFrame(renderFrame);
        };

        renderFrame();
        return this.canvas.captureStream(60);
    }

    stop() {
        this._running = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }
}

module.exports = {
    ScreensharePipeline,
    CanvasCompositor
};

