// Visualizer classes and rendering logic

class BaseVisualizer {
    constructor(x = 0, y = 0, width = 200, height = 200) {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.selected = false;
        this.visible = true;
        this.selectable = true; // Add this property
        this.opacity = 1;
        
        // Common properties
        this.color = '#00d4ff';
        this.backgroundColor = 'transparent';
        this.strokeWidth = 2;
        this.smoothing = 0.8;
        this.sensitivity = 1;
        this.reactToAudio = true;
        
        // Animation properties
        this.animationSpeed = 1;
        this.pulseStrength = 0.5;
        this.rotateSpeed = 0;
        
        this.audioData = null;
        this.frequencyData = null;
    }

    // Update with audio data
    updateAudioData(audioData, frequencyData) {
        this.audioData = audioData;
        this.frequencyData = frequencyData;
    }

    // Get bounding box
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width * this.scaleX,
            height: this.height * this.scaleY
        };
    }

    // Check if point is inside visualizer
    containsPoint(px, py) {
        const bounds = this.getBounds();
        return Utils.pointInRect(px, py, bounds.x, bounds.y, bounds.width, bounds.height);
    }

    // Get center point
    getCenter() {
        const bounds = this.getBounds();
        return {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };
    }

    // Move visualizer
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    // Resize visualizer
    resize(width, height) {
        this.width = Math.max(50, width);
        this.height = Math.max(50, height);
    }

    // Scale visualizer
    scale(sx, sy = sx) {
        this.scaleX = Math.max(0.1, sx);
        this.scaleY = Math.max(0.1, sy);
    }

    // Rotate visualizer
    rotate(angle) {
        this.rotation = angle;
    }

    // Set selection state
    setSelected(selected) {
        this.selected = selected;
    }

    // Get properties for editing
    getProperties() {
        return {
            position: { x: this.x, y: this.y },
            size: { width: this.width, height: this.height },
            transform: { 
                rotation: this.rotation, 
                scaleX: this.scaleX, 
                scaleY: this.scaleY 
            },
            appearance: {
                color: this.color,
                backgroundColor: this.backgroundColor,
                strokeWidth: this.strokeWidth,
                opacity: this.opacity
            },
            audio: {
                reactToAudio: this.reactToAudio,
                sensitivity: this.sensitivity,
                smoothing: this.smoothing
            },
            animation: {
                animationSpeed: this.animationSpeed,
                pulseStrength: this.pulseStrength,
                rotateSpeed: this.rotateSpeed
            }
        };
    }

    // Update properties
    updateProperty(category, property, value) {
        if (category === 'position') {
            this[property] = parseFloat(value);
        } else if (category === 'size') {
            this[property] = Math.max(10, parseFloat(value));
        } else if (category === 'transform') {
            this[property] = parseFloat(value);
        } else if (category === 'appearance') {
            this[property] = value;
        } else if (category === 'audio') {
            this[property] = property === 'reactToAudio' ? value : parseFloat(value);
        } else if (category === 'animation') {
            this[property] = parseFloat(value);
        }
    }

    // Save state
    serialize() {
        return {
            type: this.constructor.name,
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            color: this.color,
            backgroundColor: this.backgroundColor,
            strokeWidth: this.strokeWidth,
            opacity: this.opacity,
            visible: this.visible,
            selectable: this.selectable, // Add this line
            reactToAudio: this.reactToAudio,
            sensitivity: this.sensitivity,
            smoothing: this.smoothing,
            animationSpeed: this.animationSpeed,
            pulseStrength: this.pulseStrength,
            rotateSpeed: this.rotateSpeed
        };
    }

    // Load state
    deserialize(data) {
        Object.assign(this, data);
    }

    // Abstract render method - to be overridden
    render(ctx) {
        throw new Error('render method must be implemented by subclass');
    }
}

class WaveformVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.lineWidth = 2;
        this.fillWave = false;
        this.mirror = false;
    }

    render(ctx) {
        if (!this.visible || !this.audioData) return;

        ctx.save();
        
        // Apply transformations
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        const bounds = { x: -this.width/2, y: -this.height/2, width: this.width, height: this.height };
        
        // Draw background
        if (this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        // Draw waveform
        if (this.audioData && this.audioData.length > 0) {
            const smoothedData = Utils.smoothArray(this.audioData, this.smoothing);
            const sliceWidth = bounds.width / smoothedData.length;
              ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            
            let x = bounds.x;
            for (let i = 0; i < smoothedData.length; i++) {
                const amplitude = smoothedData[i] * this.sensitivity;
                const y = bounds.y + bounds.height/2 + (amplitude - 128) * bounds.height / 256;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
              if (this.fillWave) {
                ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height/2);
                ctx.lineTo(bounds.x, bounds.y + bounds.height/2);
                ctx.closePath();
                ctx.fillStyle = this.color + '40';
                ctx.fill();
            }
            
            ctx.stroke();
        }

        ctx.restore();
    }
}

class FrequencyVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.barSpacing = 2;
        this.barCount = 64;
        this.logarithmic = true;
        this.peakHold = true;
        this.peaks = [];
    }

    render(ctx) {
        if (!this.visible || !this.frequencyData) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        const bounds = { x: -this.width/2, y: -this.height/2, width: this.width, height: this.height };
        
        if (this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        if (this.frequencyData && this.frequencyData.length > 0) {
            const barWidth = (bounds.width - (this.barCount - 1) * this.barSpacing) / this.barCount;
            const dataPoints = Math.min(this.barCount, this.frequencyData.length);
            
            // Initialize peaks array if needed
            if (this.peaks.length !== dataPoints) {
                this.peaks = new Array(dataPoints).fill(0);
            }
            
            for (let i = 0; i < dataPoints; i++) {
                let dataIndex = this.logarithmic ? 
                    Math.floor(Math.pow(i / dataPoints, 2) * this.frequencyData.length) :
                    Math.floor(i * this.frequencyData.length / dataPoints);
                
                dataIndex = Math.min(dataIndex, this.frequencyData.length - 1);
                
                let barHeight = (this.frequencyData[dataIndex] / 255) * bounds.height * this.sensitivity;
                barHeight = Math.max(1, barHeight);
                
                // Update peaks
                if (this.peakHold) {
                    this.peaks[i] = Math.max(this.peaks[i] * 0.95, barHeight);
                }
                
                const x = bounds.x + i * (barWidth + this.barSpacing);
                const y = bounds.y + bounds.height - barHeight;
                  // Draw bar
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Draw peak
                if (this.peakHold && this.peaks[i] > barHeight) {
                    const peakY = bounds.y + bounds.height - this.peaks[i];
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, peakY, barWidth, 2);
                }
            }
        }

        ctx.restore();
    }
}

class CircleVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.filled = false;
        this.pulseAmount = 20;
        this.baseRadius = 50;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        let radius = this.baseRadius;
        
        if (this.audioData && this.reactToAudio) {
            const average = Utils.average(this.audioData);
            const pulseMultiplier = 1 + (average / 255) * this.pulseAmount * this.sensitivity;
            radius *= pulseMultiplier;
        }        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        
        if (this.filled) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.strokeWidth;
            ctx.stroke();
        }

        ctx.restore();
    }
}

class SpiralVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.spiralTurns = 3;
        this.spiralSpacing = 10;
        this.animated = true;
        this.animationOffset = 0;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        if (this.animated) {
            this.animationOffset += this.animationSpeed;
        }

        const maxRadius = Math.min(this.width, this.height) / 2;
        const steps = 200;
          ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * this.spiralTurns * 2 * Math.PI + Utils.toRadians(this.animationOffset);
            const radius = (i / steps) * maxRadius;
            
            let radiusModifier = 1;
            if (this.frequencyData && this.reactToAudio) {
                const freqIndex = Math.floor((i / steps) * this.frequencyData.length);
                const freqValue = this.frequencyData[freqIndex] || 0;
                radiusModifier = 1 + (freqValue / 255) * this.sensitivity * 0.5;
            }
            
            const x = Math.cos(angle) * radius * radiusModifier;
            const y = Math.sin(angle) * radius * radiusModifier;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        ctx.restore();
    }
}

class RadialVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.lineCount = 32;
        this.innerRadius = 20;
        this.outerRadius = 100;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;

        if (this.frequencyData && this.reactToAudio) {
            const dataPoints = Math.min(this.lineCount, this.frequencyData.length);
            
            for (let i = 0; i < dataPoints; i++) {
                const angle = (i / dataPoints) * 2 * Math.PI;
                const freqValue = this.frequencyData[i] || 0;
                const amplitude = (freqValue / 255) * this.sensitivity;
                
                const innerRadius = this.innerRadius;
                const outerRadius = this.outerRadius + amplitude * 50;
                
                const innerX = Math.cos(angle) * innerRadius;
                const innerY = Math.sin(angle) * innerRadius;
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;
                
                ctx.beginPath();
                ctx.moveTo(innerX, innerY);
                ctx.lineTo(outerX, outerY);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

class ParticleVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.particleCount = 50;
        this.particleSize = 3;
        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: (Math.random() - 0.5) * this.width,
                y: (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random()
            });
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        // Update particles
        let energyLevel = 0.1;
        if (this.frequencyData && this.reactToAudio) {
            energyLevel = Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx * this.animationSpeed;
            particle.y += particle.vy * this.animationSpeed;
            
            // Update life
            particle.life += energyLevel * 0.1;
            if (particle.life > 1) particle.life = 1;
            
            // Bounce off edges
            if (particle.x < -this.width/2 || particle.x > this.width/2) {
                particle.vx *= -1;
            }
            if (particle.y < -this.height/2 || particle.y > this.height/2) {
                particle.vy *= -1;
            }
            
            // Keep in bounds
            particle.x = Utils.clamp(particle.x, -this.width/2, this.width/2);
            particle.y = Utils.clamp(particle.y, -this.height/2, this.height/2);
        });        // Draw particles
        ctx.fillStyle = this.color;
        this.particles.forEach(particle => {
            const size = this.particleSize * (0.5 + particle.life * 0.5);
            ctx.globalAlpha = this.opacity * particle.life;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.restore();
    }
}

class SpectrumVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.binCount = 128;
        this.logScale = true;
        this.gradient = true;
    }

    render(ctx) {
        if (!this.visible || !this.frequencyData) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        const bounds = { x: -this.width/2, y: -this.height/2, width: this.width, height: this.height };
        
        if (this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        if (this.frequencyData && this.frequencyData.length > 0) {
            const binWidth = bounds.width / this.binCount;
              // Create gradient if enabled
            let fillStyle = this.color;
            if (this.gradient) {
                const gradient = ctx.createLinearGradient(bounds.x, bounds.y + bounds.height, bounds.x, bounds.y);
                gradient.addColorStop(0, this.color + '80');
                gradient.addColorStop(1, this.color);
                fillStyle = gradient;
            }
            
            for (let i = 0; i < this.binCount; i++) {
                let dataIndex = this.logScale ? 
                    Math.floor(Math.pow(i / this.binCount, 2) * this.frequencyData.length) :
                    Math.floor(i * this.frequencyData.length / this.binCount);
                
                dataIndex = Math.min(dataIndex, this.frequencyData.length - 1);
                
                const amplitude = (this.frequencyData[dataIndex] / 255) * this.sensitivity;
                const barHeight = amplitude * bounds.height;
                
                const x = bounds.x + i * binWidth;
                const y = bounds.y + bounds.height - barHeight;
                
                ctx.fillStyle = fillStyle;
                ctx.fillRect(x, y, binWidth - 1, barHeight);
            }
        }

        ctx.restore();
    }
}

// Visualizer factory
class VisualizerFactory {
    static create(type, x, y, width, height) {
        switch (type) {
            case 'waveform':
                return new WaveformVisualizer(x, y, width, height);
            case 'frequency':
                return new FrequencyVisualizer(x, y, width, height);
            case 'circle':
                return new CircleVisualizer(x, y, width, height);
            case 'spiral':
                return new SpiralVisualizer(x, y, width, height);
            case 'radial':
                return new RadialVisualizer(x, y, width, height);
            case 'particles':
                return new ParticleVisualizer(x, y, width, height);
            case 'spectrum':
                return new SpectrumVisualizer(x, y, width, height);
            default:
                throw new Error(`Unknown visualizer type: ${type}`);
        }
    }
}

// Export for use in other files
window.BaseVisualizer = BaseVisualizer;
window.WaveformVisualizer = WaveformVisualizer;
window.FrequencyVisualizer = FrequencyVisualizer;
window.CircleVisualizer = CircleVisualizer;
window.SpiralVisualizer = SpiralVisualizer;
window.RadialVisualizer = RadialVisualizer;
window.ParticleVisualizer = ParticleVisualizer;
window.SpectrumVisualizer = SpectrumVisualizer;
window.VisualizerFactory = VisualizerFactory;
