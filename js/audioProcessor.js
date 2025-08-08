class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.analyserL = null;
        this.analyserR = null;
        this.splitter = null;
        this.gainNode = null; // Add gain node for volume control
        this.isPlaying = false;
        this.audioBuffer = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.volume = 1.0; // Default volume
        this.duration = 0; // Add duration property
        this.beatDetectionEnabled = true;
        this.beatThreshold = 0.15;
        this.beatDecay = 0.98;
        this.beatHoldTime = 60;
        this.beatHold = 0;
        this.beatEnergy = 0;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyzers for left and right channels
            this.analyserL = this.audioContext.createAnalyser();
            this.analyserR = this.audioContext.createAnalyser();
            
            // Configure analyzers
            this.analyserL.fftSize = 2048;
            this.analyserR.fftSize = 2048;
            
            // Create channel splitter
            this.splitter = this.audioContext.createChannelSplitter(2);
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;
            
            // Create analyzers for frequency data
            this.frequencyAnalyserL = this.audioContext.createAnalyser();
            this.frequencyAnalyserL.fftSize = 2048;
            this.frequencyAnalyserR = this.audioContext.createAnalyser();
            this.frequencyAnalyserR.fftSize = 2048;
            
            // Connect splitter to analyzers
            this.splitter.connect(this.analyserL, 0);
            this.splitter.connect(this.analyserR, 1);
            
            return true;
        } catch (error) {
            console.error("Error initializing audio processor:", error);
            return false;
        }
    }

    async loadAudio(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.duration = this.audioBuffer.duration; // Store the duration
                    resolve(true);
                } catch (error) {
                    console.error("Error decoding audio data:", error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    play() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        // Resume audio context if it's suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create a new source
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        
        // Connect source to gain node, then to splitter and destination
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.splitter);
        this.gainNode.connect(this.audioContext.destination);
        
        // Calculate start position if resuming from pause
        const offset = this.pauseTime > 0 ? this.pauseTime : 0;
        
        // Start playback
        this.source.start(0, offset);
        this.startTime = this.audioContext.currentTime - offset;
        this.isPlaying = true;
    }

    pause() {
        if (!this.isPlaying || !this.source) return;
        
        // Calculate current position
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        
        // Stop the source
        this.source.stop();
        this.isPlaying = false;
    }

    getChannelData() {
        // Create arrays for time domain data
        const leftData = new Float32Array(this.analyserL.fftSize);
        const rightData = new Float32Array(this.analyserR.fftSize);
        
        // Get time domain data
        this.analyserL.getFloatTimeDomainData(leftData);
        this.analyserR.getFloatTimeDomainData(rightData);
        
        return { leftData, rightData };
    }

    // Add volume control method
    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            // Ensure we're setting the value at the current time
            this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
        }
    }

    // Add method to seek to a specific time
    seek(time) {
        if (!this.audioBuffer) return;
        
        const wasPlaying = this.isPlaying;
        
        // If currently playing, stop it
        if (this.isPlaying) {
            this.source.stop();
            this.isPlaying = false;
        }
        
        // Update pause time to the seek position
        this.pauseTime = Math.max(0, Math.min(time, this.duration));
        
        // If it was playing before, restart playback from new position
        if (wasPlaying) {
            this.play();
        }
    }
    
    // Add method to get current playback time
    getCurrentTime() {
        if (!this.audioBuffer) return 0;
        
        if (this.isPlaying) {
            return Math.min(this.audioContext.currentTime - this.startTime, this.duration);
        } else {
            return this.pauseTime;
        }
    }
    
    // Get total duration
    getDuration() {
        return this.duration || 0;
    }
    
    getFrequencyData() {
        if (!this.frequencyAnalyserL || !this.frequencyAnalyserR) {
            return { leftFreq: new Uint8Array(0), rightFreq: new Uint8Array(0) };
        }
        
        const leftFreq = new Uint8Array(this.frequencyAnalyserL.frequencyBinCount);
        const rightFreq = new Uint8Array(this.frequencyAnalyserR.frequencyBinCount);
        
        this.frequencyAnalyserL.getByteFrequencyData(leftFreq);
        this.frequencyAnalyserR.getByteFrequencyData(rightFreq);
        
        return { leftFreq, rightFreq };
    }
    
    detectBeat(leftData, rightData) {
        if (!this.beatDetectionEnabled) return false;
        
        // Calculate current energy (volume level)
        let sum = 0;
        const len = Math.min(leftData.length, rightData.length);
        
        for (let i = 0; i < len; i++) {
            sum += (leftData[i] * leftData[i]) + (rightData[i] * rightData[i]);
        }
        
        const currentEnergy = sum / len;
        
        // If we're holding a beat, decrement the hold counter
        if (this.beatHold > 0) {
            this.beatHold--;
            return false;
        }
        
        // If current energy is greater than the threshold * beatEnergy, we have a beat
        if (currentEnergy > this.beatThreshold * this.beatEnergy) {
            this.beatHold = this.beatHoldTime;
            this.beatEnergy = currentEnergy;
            return true;
        }
        
        // Decay the beat energy
        this.beatEnergy = this.beatEnergy * this.beatDecay + currentEnergy * (1 - this.beatDecay);
        return false;
    }
}
