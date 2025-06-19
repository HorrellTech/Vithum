// Audio processing and Web Audio API management

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioElement = document.getElementById('audioElement');
        this.audioSource = null;
        this.analyser = null;
        this.audioData = null;
        this.frequencyData = null;
        this.isPlaying = false;
        this.audioFile = null;
        
        this.bufferLength = 2048;
        this.fftSize = 2048;
        this.smoothingTimeConstant = 0.8;
        
        this.setupAudio();
        this.bindEvents();
    }

    async setupAudio() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
            
            this.bufferLength = this.analyser.frequencyBinCount;
            this.audioData = new Uint8Array(this.bufferLength);
            this.frequencyData = new Uint8Array(this.bufferLength);
            
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
        }
    }

    bindEvents() {
        // Audio element events
        this.audioElement.addEventListener('loadeddata', () => {
            console.log('Audio loaded');
            this.connectAudioSource();
        });
        
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });
        
        // File input
        document.getElementById('audioFile').addEventListener('change', (e) => {
            this.loadAudioFile(e.target.files[0]);
        });
    }    async connectAudioSource() {
        if (!this.audioContext || !this.analyser) {
            await this.setupAudio();
        }
        
        try {
            // Disconnect existing source
            if (this.audioSource) {
                this.audioSource.disconnect();
            }
            
            // Create new source from audio element
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            
            // Connect: source -> analyser -> destination
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            console.log('Audio source connected successfully');
        } catch (error) {
            console.error('Failed to connect audio source:', error);
            
            // If the audio element is already connected to a source, try a different approach
            if (error.name === 'InvalidStateError') {
                console.log('Audio element already has a source, skipping connection');
                return;
            }
            throw error;
        }
    }loadAudioFile(file) {
        if (!file) return;
        
        this.audioFile = file;
        
        // Clean up any existing URL
        if (this.audioElement.src && this.audioElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.audioElement.src);
        }
        
        const url = URL.createObjectURL(file);
        this.audioElement.src = url;
        
        // Store URL for later cleanup
        this.currentBlobUrl = url;
        
        // Clean up URL after audio is loaded and can be played
        this.audioElement.addEventListener('canplaythrough', () => {
            console.log('Audio ready to play:', file.name);
        }, { once: true });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio loading error:', e);
            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
                this.currentBlobUrl = null;
            }
        }, { once: true });
        
        console.log('Loading audio file:', file.name);
    }    async play() {
        if (!this.audioElement.src) {
            console.warn('No audio file loaded');
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log('Resuming audio context...');
                await this.audioContext.resume();
            }
            
            // Ensure audio source is connected
            if (!this.audioSource && this.audioElement.src) {
                await this.connectAudioSource();
            }
            
            await this.audioElement.play();
            console.log('Audio playback started');
        } catch (error) {
            console.error('Failed to play audio:', error);
            
            // Try to reinitialize audio if there's a context issue
            if (error.name === 'NotSupportedError' || error.name === 'InvalidStateError') {
                console.log('Reinitializing audio system...');
                await this.setupAudio();
                await this.connectAudioSource();
                await this.audioElement.play();
            }
        }
    }

    pause() {
        this.audioElement.pause();
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    updatePlayButton() {
        const playButton = document.getElementById('playPause');
        const icon = playButton.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            playButton.classList.add('active');
        } else {
            icon.className = 'fas fa-play';
            playButton.classList.remove('active');
        }
    }

    getAudioData() {
        if (!this.analyser || !this.audioData || !this.frequencyData) {
            return { audioData: null, frequencyData: null };
        }
        
        // Get time domain data (waveform)
        this.analyser.getByteTimeDomainData(this.audioData);
        
        // Get frequency domain data (spectrum)
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        return {
            audioData: this.audioData,
            frequencyData: this.frequencyData
        };
    }

    // Audio analysis utilities
    getVolume() {
        if (!this.audioData) return 0;
        
        let sum = 0;
        for (let i = 0; i < this.audioData.length; i++) {
            const amplitude = this.audioData[i] - 128;
            sum += amplitude * amplitude;
        }
        return Math.sqrt(sum / this.audioData.length) / 128;
    }

    getBass() {
        if (!this.frequencyData) return 0;
        
        // Bass is roughly 20Hz to 250Hz
        // With 44.1kHz sample rate and 2048 FFT size, each bin is ~21.5Hz
        const bassEnd = Math.floor(250 / (this.audioContext.sampleRate / this.fftSize));
        let sum = 0;
        
        for (let i = 1; i < Math.min(bassEnd, this.frequencyData.length); i++) {
            sum += this.frequencyData[i];
        }
        
        return sum / (bassEnd - 1) / 255;
    }

    getMids() {
        if (!this.frequencyData) return 0;
        
        // Mids are roughly 250Hz to 4kHz
        const bassEnd = Math.floor(250 / (this.audioContext.sampleRate / this.fftSize));
        const trebleStart = Math.floor(4000 / (this.audioContext.sampleRate / this.fftSize));
        let sum = 0;
        
        for (let i = bassEnd; i < Math.min(trebleStart, this.frequencyData.length); i++) {
            sum += this.frequencyData[i];
        }
        
        return sum / (trebleStart - bassEnd) / 255;
    }

    getTreble() {
        if (!this.frequencyData) return 0;
        
        // Treble is roughly 4kHz to 20kHz
        const trebleStart = Math.floor(4000 / (this.audioContext.sampleRate / this.fftSize));
        let sum = 0;
        let count = 0;
        
        for (let i = trebleStart; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
            count++;
        }
        
        return count > 0 ? sum / count / 255 : 0;
    }

    // Beat detection
    detectBeat() {
        if (!this.frequencyData) return false;
        
        // Simple energy-based beat detection
        const currentEnergy = this.getBass();
        
        if (!this.energyHistory) {
            this.energyHistory = [];
            this.lastBeatTime = 0;
        }
        
        this.energyHistory.push(currentEnergy);
        if (this.energyHistory.length > 43) { // ~1 second at 60fps
            this.energyHistory.shift();
        }
        
        const averageEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
        const variance = this.energyHistory.reduce((sum, energy) => sum + Math.pow(energy - averageEnergy, 2), 0) / this.energyHistory.length;
        
        const now = Date.now();
        const threshold = (-0.0025714 * variance) + 1.5142857;
        const isBeat = currentEnergy > threshold * averageEnergy && (now - this.lastBeatTime) > 300;
        
        if (isBeat) {
            this.lastBeatTime = now;
        }
        
        return isBeat;
    }

    // Microphone input
    async enableMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if (!this.audioContext) {
                await this.setupAudio();
            }
            
            // Disconnect existing source
            if (this.audioSource) {
                this.audioSource.disconnect();
            }
            
            // Create microphone source
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioSource.connect(this.analyser);
            
            console.log('Microphone enabled');
            return true;
        } catch (error) {
            console.error('Failed to enable microphone:', error);
            return false;
        }
    }

    // Settings
    setFFTSize(size) {
        if (this.analyser) {
            this.analyser.fftSize = size;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.audioData = new Uint8Array(this.bufferLength);
            this.frequencyData = new Uint8Array(this.bufferLength);
        }
    }

    setSmoothing(value) {
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = value;
        }
    }

    // Export audio data for recording
    startRecording() {
        // Implementation for recording audio data
        console.log('Recording started');
    }

    stopRecording() {
        // Implementation for stopping recording
        console.log('Recording stopped');
    }

    // Get audio info
    getAudioInfo() {
        if (!this.audioElement.src) return null;
        
        return {
            duration: this.audioElement.duration,
            currentTime: this.audioElement.currentTime,
            volume: this.audioElement.volume,
            muted: this.audioElement.muted,
            fileName: this.audioFile ? this.audioFile.name : 'Unknown',
            fileSize: this.audioFile ? this.audioFile.size : 0,
            sampleRate: this.audioContext ? this.audioContext.sampleRate : 0,
            fftSize: this.fftSize,
            bufferLength: this.bufferLength
        };
    }

    // Cleanup
    cleanup() {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
    }
}

// Export for use in other files
window.AudioManager = AudioManager;
