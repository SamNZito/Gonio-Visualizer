class GonioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.setupResizeListener();
        
        // Visualization settings
        this.persistence = 0.5; // Increased persistence for longer trails
        this.pointSize = 2; // Size of dots
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        this.normalizationFactor = 1.0;
        this.dotColor = 'rgb(0, 255, 0)'; // Default green color
        this.colorMode = 'static'; // Options: 'static', 'gradient', 'spectrum'
        this.colorHue = 120; // Green hue
        this.particles = [];
        this.maxParticles = 100;
        this.particleMode = false;
        
        // Initialize the canvas
        this.clear();
    }
    
    resizeCanvas() {
        // Get the actual display size
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // Check if the canvas size doesn't match display size
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            // Set canvas dimensions to match its display size
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            // Update center and scale when resized
            this.centerX = this.canvas.width / 2;
            this.centerY = this.canvas.height / 2;
            this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        }
    }
    
    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    clear() {
        // Pure black background
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    update(leftData, rightData) {
        // Apply persistence effect by drawing a semi-transparent rectangle
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.persistence})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const len = Math.min(leftData.length, rightData.length);
        
        // Calculate normalization factor based on signal amplitude
        let maxAmplitude = 0.01;
        for (let i = 0; i < len; i++) {
            const leftAbs = Math.abs(leftData[i]);
            const rightAbs = Math.abs(rightData[i]);
            maxAmplitude = Math.max(maxAmplitude, leftAbs, rightAbs);
        }
        
        // Smoothly adjust normalization factor
        const targetNormalization = maxAmplitude > 0.01 ? 0.7 / maxAmplitude : 1.0;
        this.normalizationFactor = this.normalizationFactor * 0.95 + targetNormalization * 0.05;
        
        // Draw dots instead of lines
        this.drawDots(leftData, rightData);
        
        // Update and draw particles if enabled
        if (this.particleMode) {
            this.updateParticles();
        }
    }
    
    drawDots(leftData, rightData) {
        const len = Math.min(leftData.length, rightData.length);
        
        // Skip factor for fewer dots
        const skipFactor = 1;
        
        // Color handling based on mode
        if (this.colorMode === 'gradient') {
            // Slowly shift the hue over time
            this.colorHue = (this.colorHue + 0.1) % 360;
            this.dotColor = `hsl(${this.colorHue}, 100%, 50%)`;
        } else if (this.colorMode === 'spectrum') {
            // Colors will be set per dot based on position
        }
        
        // Set base dot style
        this.ctx.fillStyle = this.dotColor;
        
        // Draw main diagonal dots
        for (let i = 0; i < len; i += skipFactor) {
            const left = leftData[i] * this.normalizationFactor;
            const right = rightData[i] * this.normalizationFactor;
            
            // Calculate X-Y coordinates for goniometer
            const x = this.centerX + (left - right) * this.scale;
            const y = this.centerY - (left + right) * this.scale;
            
            // For spectrum mode, color based on position
            if (this.colorMode === 'spectrum') {
                // Calculate distance from center (0-1 range)
                const distance = Math.sqrt(
                    Math.pow((x - this.centerX) / this.scale, 2) + 
                    Math.pow((y - this.centerY) / this.scale, 2)
                );
                
                // Map distance to hue (0-360)
                const hue = (distance * 360) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            }
            
            // Draw the dot
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.pointSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Occasionally spawn particles from dots
        if (this.particleMode && Math.random() > 0.9) {
            const left = leftData[0] * this.normalizationFactor;
            const right = rightData[0] * this.normalizationFactor;
            
            const x = this.centerX + (left - right) * this.scale;
            const y = this.centerY - (left + right) * this.scale;
            
            this.addParticle(x, y);
        }
    }
    
    addParticle(x, y) {
        if (this.particles.length >= this.maxParticles) return;
        
        this.particles.push({
            x: x,
            y: y,
            size: this.pointSize * 1.5,
            speed: 0.5 + Math.random(),
            angle: Math.random() * Math.PI * 2,
            life: 100,
            color: this.dotColor
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Move particle
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            
            // Reduce life
            p.life -= 1;
            
            // Draw particle
            this.ctx.globalAlpha = p.life / 100;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}