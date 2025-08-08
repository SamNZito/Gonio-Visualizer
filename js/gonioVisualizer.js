class GonioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.setupResizeListener();
        
        // Visualization settings
        this.persistence = 0.8; // Increased persistence for longer trails
        this.pointSize = 2; // Size of dots
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        this.normalizationFactor = 1;
        this.dotColor = 'rgb(0, 255, 0)'; // Default green color
        this.colorMode = 'static'; // Options: 'static', 'gradient', 'spectrum'
        this.colorHue = 120; // Green hue
        this.lineMode = false; // Start with dots only
        this.visualMode = 'dots'; // Options: 'dots', 'line'
        
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
        
        // Draw visualization
        this.drawVisualization(leftData, rightData);
    }
    
    drawVisualization(leftData, rightData) {
        const len = Math.min(leftData.length, rightData.length);
        
        // Dynamic skip factor based on visualization mode
        // Lower skip factor for dots mode = more dots
        // Higher skip factor for line mode for better performance
        let skipFactor = 1;
        if (this.visualMode === 'line') {
            skipFactor = 5; // Smoother line with more points
        } else {
            skipFactor = 1; // More dots in dot mode
        }
        
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
        this.ctx.strokeStyle = this.dotColor;
        
        // Thinner lines for clearer visualization
        this.ctx.lineWidth = 2;
        
        // Store points for line drawing
        const points = [];
        
        // Calculate points for goniometer
        for (let i = 0; i < len; i += skipFactor) {
            const left = leftData[i] * this.normalizationFactor;
            const right = rightData[i] * this.normalizationFactor;
            
            // Calculate X-Y coordinates for goniometer
            const x = this.centerX + (left - right) * this.scale;
            const y = this.centerY - (left + right) * this.scale;
            
            points.push({ x, y });
            
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
                this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            }
            
            // Always draw dots in dot mode
            if (this.visualMode === 'dots') {
                const dotSize = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw visualization based on selected mode
        if (points.length > 1 && this.visualMode === 'line') {
            // Continuous line mode - single unbroken line
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            
            this.ctx.stroke();
        }
    }
}
