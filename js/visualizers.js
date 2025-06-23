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
        this.selectable = true;
        this.opacity = 1;

        // Common properties
        this.color = '#00d4ff';
        this.backgroundColor = 'transparent';
        this.strokeWidth = 2;
        this.smoothing = 0.8;
        this.sensitivity = 1;
        this.reactToAudio = true;

        // Frequency range properties
        this.minFrequency = 0;     // 0-100% of frequency spectrum
        this.maxFrequency = 100;   // 0-100% of frequency spectrum

        // Animation properties
        this.animationSpeed = 1;
        this.pulseStrength = 0.5;
        this.rotateSpeed = 0;

        // NEW: Alpha pulsing properties
        this.alphaPulseEnabled = false;
        this.alphaPulseIntensity = 0.5; // 0-1, how much the alpha changes
        this.alphaPulseReverse = false; // false = opaque->transparent, true = transparent->opaque
        this.currentAlphaPulse = 1; // Current alpha multiplier


        this.audioData = null;
        this.frequencyData = null;
    }

    // Update with audio data
    updateAudioData(audioData, frequencyData) {
        this.audioData = audioData;
        this.frequencyData = frequencyData;

        // NEW: Update alpha pulse based on audio
        if (this.alphaPulseEnabled && this.reactToAudio && this.frequencyData) {
            const filteredData = this.getFilteredFrequencyData();
            const audioLevel = Utils.average(filteredData) / 255;
            
            if (this.alphaPulseReverse) {
                // Reverse mode: transparent by default, becomes opaque with audio
                this.currentAlphaPulse = audioLevel * this.alphaPulseIntensity * this.sensitivity;
            } else {
                // Normal mode: opaque by default, becomes transparent with audio
                this.currentAlphaPulse = 1 - (audioLevel * this.alphaPulseIntensity * this.sensitivity);
            }
            
            // Clamp the values
            this.currentAlphaPulse = Math.max(0, Math.min(1, this.currentAlphaPulse));
        } else {
            // No alpha pulsing, use full opacity multiplier
            this.currentAlphaPulse = 1; // FIXED: was this.opacity, should be 1
        }
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

    getEffectiveOpacity() {
        return this.opacity * this.currentAlphaPulse;
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
                smoothing: this.smoothing,
                minFrequency: this.minFrequency,
                maxFrequency: this.maxFrequency
            },
            animation: {
                animationSpeed: this.animationSpeed,
                pulseStrength: this.pulseStrength,
                rotateSpeed: this.rotateSpeed
            },
            alphaPulse: {
                alphaPulseEnabled: this.alphaPulseEnabled,
                alphaPulseIntensity: this.alphaPulseIntensity,
                alphaPulseReverse: this.alphaPulseReverse
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
            if (property === 'reactToAudio') {
                this[property] = value;
            } else if (property === 'minFrequency') {
                this.minFrequency = Math.max(0, Math.min(parseFloat(value), this.maxFrequency));
            } else if (property === 'maxFrequency') {
                this.maxFrequency = Math.max(this.minFrequency, Math.min(parseFloat(value), 100));
            } else {
                this[property] = parseFloat(value);
            }
        } else if (category === 'animation') {
            this[property] = parseFloat(value);
        } else if (category === 'alphaPulse') {
            // Handle alpha pulse properties
            if (property === 'alphaPulseEnabled' || property === 'alphaPulseReverse') {
                this[property] = Boolean(value);
            } else if (property === 'alphaPulseIntensity') {
                this.alphaPulseIntensity = Math.max(0, Math.min(1, parseFloat(value)));
            }
            // Reset current alpha pulse when properties change
            if (!this.alphaPulseEnabled) {
                this.currentAlphaPulse = 1;
            }
        }
    }

    getFilteredFrequencyData() {
        if (!this.frequencyData || !this.reactToAudio) {
            return this.frequencyData;
        }

        const totalLength = this.frequencyData.length;
        const startIndex = Math.floor((this.minFrequency / 100) * totalLength);
        const endIndex = Math.ceil((this.maxFrequency / 100) * totalLength);
        
        return this.frequencyData.slice(startIndex, endIndex);
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
            selectable: this.selectable,
            reactToAudio: this.reactToAudio,
            sensitivity: this.sensitivity,
            smoothing: this.smoothing,
            minFrequency: this.minFrequency,
            maxFrequency: this.maxFrequency,
            animationSpeed: this.animationSpeed,
            pulseStrength: this.pulseStrength,
            rotateSpeed: this.rotateSpeed,
            alphaPulseEnabled: this.alphaPulseEnabled,
            alphaPulseIntensity: this.alphaPulseIntensity,
            alphaPulseReverse: this.alphaPulseReverse
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

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
                const y = bounds.y + bounds.height / 2 + (amplitude - 128) * bounds.height / 256;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }
            if (this.fillWave) {
                ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height / 2);
                ctx.lineTo(bounds.x, bounds.y + bounds.height / 2);
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

        if (this.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        // Use filtered frequency data
        const filteredFrequencyData = this.getFilteredFrequencyData();
        
        if (filteredFrequencyData && filteredFrequencyData.length > 0) {
            const barWidth = (bounds.width - (this.barCount - 1) * this.barSpacing) / this.barCount;
            const dataPoints = Math.min(this.barCount, filteredFrequencyData.length);

            // Initialize peaks array if needed
            if (this.peaks.length !== dataPoints) {
                this.peaks = new Array(dataPoints).fill(0);
            }

            for (let i = 0; i < dataPoints; i++) {
                let dataIndex = this.logarithmic ?
                    Math.floor(Math.pow(i / dataPoints, 2) * filteredFrequencyData.length) :
                    Math.floor(i * filteredFrequencyData.length / dataPoints);

                dataIndex = Math.min(dataIndex, filteredFrequencyData.length - 1);

                let barHeight = (filteredFrequencyData[dataIndex] / 255) * bounds.height * this.sensitivity;
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        let radius = this.baseRadius;

        if (this.audioData && this.reactToAudio) {
            const average = Utils.average(this.audioData);
            const pulseMultiplier = 1 + (average / 255) * this.pulseAmount * this.sensitivity;
            radius *= pulseMultiplier;
        } ctx.beginPath();
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

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
            if (particle.x < -this.width / 2 || particle.x > this.width / 2) {
                particle.vx *= -1;
            }
            if (particle.y < -this.height / 2 || particle.y > this.height / 2) {
                particle.vy *= -1;
            }

            // Keep in bounds
            particle.x = Utils.clamp(particle.x, -this.width / 2, this.width / 2);
            particle.y = Utils.clamp(particle.y, -this.height / 2, this.height / 2);
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

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

class WaveVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.waveHeight = 50;
        this.waveLength = 100;
        this.waveSpeed = 2;
        this.waveOffset = 0;
        this.layers = 3;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.waveOffset += this.waveSpeed * this.animationSpeed;

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

        for (let layer = 0; layer < this.layers; layer++) {
            ctx.beginPath();
            ctx.strokeStyle = this.color + Math.floor(255 * (1 - layer * 0.3)).toString(16);
            ctx.lineWidth = this.strokeWidth * (1 - layer * 0.2);

            let amplitude = this.waveHeight;
            if (this.frequencyData && this.reactToAudio) {
                const freqValue = this.frequencyData[Math.floor(layer * this.frequencyData.length / this.layers)] || 0;
                amplitude *= (1 + (freqValue / 255) * this.sensitivity);
            }

            for (let x = bounds.x; x <= bounds.x + bounds.width; x += 5) {
                const normalizedX = (x - bounds.x) / bounds.width;
                const waveY = Math.sin((normalizedX * this.waveLength + this.waveOffset + layer * 60) * Math.PI / 180) * amplitude;
                const y = bounds.y + bounds.height / 2 + waveY + layer * 10;

                if (x === bounds.x) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

class LissajousVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.freqX = 3;
        this.freqY = 2;
        this.phaseShift = 0;
        this.trailLength = 100;
        this.points = [];
        this.animationTime = 0;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.animationTime += this.animationSpeed;

        let amplitude = 0.8;
        if (this.frequencyData && this.reactToAudio) {
            amplitude *= (1 + Utils.average(this.frequencyData) / 255 * this.sensitivity);
        }

        const radiusX = this.width / 2 * amplitude;
        const radiusY = this.height / 2 * amplitude;

        // Calculate new point
        const t = this.animationTime * 0.02;
        const x = radiusX * Math.sin(this.freqX * t + this.phaseShift);
        const y = radiusY * Math.sin(this.freqY * t);

        this.points.push({ x, y });
        if (this.points.length > this.trailLength) {
            this.points.shift();
        }

        // Draw trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        ctx.beginPath();

        this.points.forEach((point, i) => {
            ctx.globalAlpha = this.opacity * (i / this.points.length);
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });

        ctx.stroke();
        ctx.restore();
    }
}

class VortexVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.armCount = 5;
        this.rotationSpeed = 2;
        this.currentRotation = 0;
        this.spiralTightness = 0.1;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentRotation += this.rotationSpeed * this.animationSpeed;

        const maxRadius = Math.min(this.width, this.height) / 2;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;

        for (let arm = 0; arm < this.armCount; arm++) {
            const armAngle = (arm / this.armCount) * 2 * Math.PI + Utils.toRadians(this.currentRotation);

            ctx.beginPath();

            for (let r = 0; r <= maxRadius; r += 3) {
                const spiralAngle = armAngle + r * this.spiralTightness;

                let radiusModifier = 1;
                if (this.frequencyData && this.reactToAudio) {
                    const freqIndex = Math.floor((r / maxRadius) * this.frequencyData.length);
                    const freqValue = this.frequencyData[freqIndex] || 0;
                    radiusModifier = 1 + (freqValue / 255) * this.sensitivity * 0.5;
                }

                const x = Math.cos(spiralAngle) * r * radiusModifier;
                const y = Math.sin(spiralAngle) * r * radiusModifier;

                if (r === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        ctx.restore();
    }
}

class PlasmaVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.timeOffset = 0;
        this.frequency1 = 0.01;
        this.frequency2 = 0.02;
        this.gridSize = 4; // Smaller grid for smoother appearance
        
        // Cache for performance
        this.tempCanvas = null;
        this.tempCtx = null;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.imageData = null;
        this.data = null;
        
        // Performance optimizations
        this.maxDimension = 1080; // Reduced for better performance
        this.targetFrameRate = 60; // Higher framerate for smooth plasma
        this.lastRenderTime = 0;
        
        // Plasma-specific properties
        this.plasmaComplexity = 12; // Number of plasma layers
        this.colorCycleSpeed = 2;
        this.waveAmplitude = 1;
        this.gradientSmoothing = false;
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            plasma: {
                frequency1: this.frequency1,
                frequency2: this.frequency2,
                gridSize: this.gridSize,
                plasmaComplexity: this.plasmaComplexity,
                colorCycleSpeed: this.colorCycleSpeed,
                waveAmplitude: this.waveAmplitude,
                gradientSmoothing: this.gradientSmoothing
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'plasma') {
            if (property === 'gridSize') {
                this.gridSize = Math.max(2, Math.min(16, parseInt(value)));
                this.tempCanvas = null; // Force recreation
            } else if (property === 'plasmaComplexity') {
                this.plasmaComplexity = Math.max(1, Math.min(6, parseInt(value)));
            } else if (property === 'gradientSmoothing') {
                this.gradientSmoothing = value;
                this.tempCanvas = null; // Force recreation
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 212, b: 255 };
    }

    createTempCanvas(width, height) {
        // Limit the actual rendering size for performance
        const scale = Math.min(1, this.maxDimension / Math.max(width, height));
        const renderWidth = Math.floor(width * scale);
        const renderHeight = Math.floor(height * scale);
        
        if (!this.tempCanvas || 
            this.lastWidth !== renderWidth || 
            this.lastHeight !== renderHeight) {
            
            this.tempCanvas = document.createElement('canvas');
            this.tempCanvas.width = renderWidth;
            this.tempCanvas.height = renderHeight;
            this.tempCtx = this.tempCanvas.getContext('2d');
            this.tempCtx.imageSmoothingEnabled = this.gradientSmoothing;
            this.tempCtx.imageSmoothingQuality = 'high';
            this.imageData = this.tempCtx.createImageData(renderWidth, renderHeight);
            this.data = this.imageData.data;
            this.lastWidth = renderWidth;
            this.lastHeight = renderHeight;
        }
        
        return { renderWidth, renderHeight, scale: 1/scale };
    }

    render(ctx) {
        if (!this.visible) return;

        // Frame rate limiting for smooth animation
        const now = performance.now();
        const frameInterval = 1000 / this.targetFrameRate;
        
        if (now - this.lastRenderTime < frameInterval) {
            // Still render the cached frame to prevent flashing
            this.renderCachedFrame(ctx);
            return;
        }
        
        this.lastRenderTime = now;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.timeOffset += this.animationSpeed * 0.02; // Slower, smoother time progression

        let audioInfluence = 1;
        if (this.frequencyData && this.reactToAudio) {
            const filteredData = this.getFilteredFrequencyData();
            audioInfluence = 1 + Utils.average(filteredData) / 255 * this.sensitivity * 0.5;
        }

        // Create optimized canvas
        const { renderWidth, renderHeight, scale } = this.createTempCanvas(this.width, this.height);

        // Convert color to RGB once
        const baseColor = this.hexToRgb(this.color);

        // Generate plasma in one go (no chunking to prevent flashing)
        this.generatePlasma(renderWidth, renderHeight, baseColor, audioInfluence);

        // Update the temp canvas
        this.tempCtx.putImageData(this.imageData, 0, 0);

        // Draw to main canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this.tempCanvas, -this.width/2, -this.height/2, this.width, this.height);

        ctx.restore();
    }

    generatePlasma(renderWidth, renderHeight, baseColor, audioInfluence) {
        const centerX = renderWidth / 2;
        const centerY = renderHeight / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let x = 0; x < renderWidth; x += this.gridSize) {
            for (let y = 0; y < renderHeight; y += this.gridSize) {
                // Normalize coordinates
                const normalizedX = (x - centerX) / renderWidth;
                const normalizedY = (y - centerY) / renderHeight;
                
                // Distance from center for radial effects
                const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
                
                // Complex plasma calculation with multiple layers
                let plasma = 0;
                
                // Layer 1: Basic sinusoidal waves
                plasma += Math.sin(normalizedX * 8 + this.timeOffset * this.frequency1);
                plasma += Math.sin(normalizedY * 6 + this.timeOffset * this.frequency2);
                
                // Layer 2: Circular waves (lava lamp effect)
                plasma += Math.sin(distance * 12 + this.timeOffset * 0.5);
                
                // Layer 3: Interference patterns
                plasma += Math.sin((normalizedX + normalizedY) * 10 + this.timeOffset * 0.3);
                
                if (this.plasmaComplexity > 3) {
                    // Layer 4: Rotational component
                    const angle = Math.atan2(normalizedY, normalizedX);
                    plasma += Math.sin(angle * 4 + this.timeOffset * 0.4) * 0.5;
                }
                
                if (this.plasmaComplexity > 4) {
                    // Layer 5: Noise-like component
                    plasma += Math.sin(normalizedX * 15 + Math.sin(normalizedY * 12 + this.timeOffset)) * 0.3;
                }
                
                if (this.plasmaComplexity > 5) {
                    // Layer 6: High frequency detail
                    plasma += Math.sin(normalizedX * 20 + this.timeOffset * 0.8) * 0.2;
                    plasma += Math.sin(normalizedY * 18 + this.timeOffset * 0.6) * 0.2;
                }
                
                // Apply wave amplitude and audio influence
                plasma *= this.waveAmplitude * audioInfluence;
                
                // Normalize plasma value to 0-1 range
                const intensity = (Math.sin(plasma) + 1) / 2;
                
                // Create color cycling effect
                const hueShift = (this.timeOffset * this.colorCycleSpeed * 10) % 360;
                const colorPhase = (intensity + hueShift / 360) % 1;
                
                // Generate smooth color gradient
                const r = Math.floor(baseColor.r * (0.3 + 0.7 * Math.sin(colorPhase * Math.PI * 2)));
                const g = Math.floor(baseColor.g * (0.3 + 0.7 * Math.sin(colorPhase * Math.PI * 2 + Math.PI * 2/3)));
                const b = Math.floor(baseColor.b * (0.3 + 0.7 * Math.sin(colorPhase * Math.PI * 2 + Math.PI * 4/3)));
                
                // Fill grid area efficiently
                this.fillGridArea(x, y, this.gridSize, renderWidth, renderHeight, r, g, b);
            }
        }
    }

    fillGridArea(x, y, gridSize, renderWidth, renderHeight, r, g, b) {
        for (let dx = 0; dx < gridSize && x + dx < renderWidth; dx++) {
            for (let dy = 0; dy < gridSize && y + dy < renderHeight; dy++) {
                const index = ((y + dy) * renderWidth + (x + dx)) * 4;
                this.data[index] = r;
                this.data[index + 1] = g;
                this.data[index + 2] = b;
                this.data[index + 3] = 255;
            }
        }
    }

    renderCachedFrame(ctx) {
        if (!this.tempCanvas) return;

        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        // Use image smoothing for upscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(this.tempCanvas, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }

    // Override resize to trigger cache invalidation
    resize(width, height) {
        super.resize(width, height);
        // Clear cache to force recreation
        this.tempCanvas = null;
    }

    // Clean up resources
    destroy() {
        this.tempCanvas = null;
        this.tempCtx = null;
        this.imageData = null;
        this.data = null;
    }

    // Override serialize to include new properties
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            frequency1: this.frequency1,
            frequency2: this.frequency2,
            gridSize: this.gridSize,
            plasmaComplexity: this.plasmaComplexity,
            colorCycleSpeed: this.colorCycleSpeed,
            waveAmplitude: this.waveAmplitude,
            gradientSmoothing: this.gradientSmoothing
        };
    }
}

class NetworkVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.nodeCount = 20;
        this.connectionDistance = 80;
        this.nodes = [];
        this.initNodes();
    }

    initNodes() {
        this.nodes = [];
        for (let i = 0; i < this.nodeCount; i++) {
            this.nodes.push({
                x: (Math.random() - 0.5) * this.width,
                y: (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                energy: Math.random()
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        // Update nodes
        let audioEnergy = 0.1;
        if (this.frequencyData && this.reactToAudio) {
            audioEnergy = Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        this.nodes.forEach(node => {
            node.x += node.vx * this.animationSpeed;
            node.y += node.vy * this.animationSpeed;
            node.energy = Math.min(1, node.energy + audioEnergy * 0.1);

            // Bounce off edges
            if (Math.abs(node.x) > this.width / 2) node.vx *= -1;
            if (Math.abs(node.y) > this.height / 2) node.vy *= -1;
        });

        // Draw connections
        ctx.strokeStyle = this.color + '40';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    const alpha = 1 - distance / this.connectionDistance;
                    ctx.globalAlpha = this.getEffectiveOpacity() * alpha * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        ctx.fillStyle = this.color;
        this.nodes.forEach(node => {
            const size = 3 + node.energy * 5;
            ctx.globalAlpha = this.opacity * (0.5 + node.energy * 0.5);
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.restore();
    }
}

class KaleidoscopeVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.segments = 8;
        this.innerPattern = 'circle';
        this.patternSize = 20;
        this.rotationSpeed = 1;
        this.currentRotation = 0;
        this.mirrorAlternate = true;
        
        // Enhanced properties
        this.patternLayers = 3;
        this.colorCycleSpeed = 2;
        this.pulseIntensity = 1;
        this.complexPattern = true;
        this.trailEffect = true;
        this.geometricComplexity = 'medium'; // low, medium, high
        
        // Animation states
        this.colorOffset = 0;
        this.pulsePhase = 0;
        this.layerRotations = [];
        this.patternHistory = [];
        
        // Initialize layer rotations
        for (let i = 0; i < this.patternLayers; i++) {
            this.layerRotations.push(Math.random() * 360);
        }
        
        // Audio-reactive properties
        this.bassResponse = 0;
        this.midResponse = 0;
        this.trebleResponse = 0;
        this.smoothedBass = 0;
        this.smoothedMid = 0;
        this.smoothedTreble = 0;
    }

    updateAudioData(audioData, frequencyData) {
        super.updateAudioData(audioData, frequencyData);
        
        if (this.frequencyData && this.reactToAudio) {
            const filteredData = this.getFilteredFrequencyData();
            const third = Math.floor(filteredData.length / 3);
            
            // Split frequency data into bass, mid, treble
            const bassData = filteredData.slice(0, third);
            const midData = filteredData.slice(third, third * 2);
            const trebleData = filteredData.slice(third * 2);
            
            this.bassResponse = Utils.average(bassData) / 255;
            this.midResponse = Utils.average(midData) / 255;
            this.trebleResponse = Utils.average(trebleData) / 255;
            
            // Smooth the responses for less jittery animation
            this.smoothedBass = this.smoothedBass * 0.8 + this.bassResponse * 0.2;
            this.smoothedMid = this.smoothedMid * 0.8 + this.midResponse * 0.2;
            this.smoothedTreble = this.smoothedTreble * 0.8 + this.trebleResponse * 0.2;
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        // Update animation states
        this.currentRotation += this.rotationSpeed * this.animationSpeed;
        this.colorOffset += this.colorCycleSpeed * this.animationSpeed;
        this.pulsePhase += this.animationSpeed * 0.1;

        const maxRadius = Math.min(this.width, this.height) / 2;
        const segmentAngle = (2 * Math.PI) / this.segments;

        // Update layer rotations with different speeds
        for (let i = 0; i < this.layerRotations.length; i++) {
            const speed = (i + 1) * 0.5 * this.animationSpeed;
            this.layerRotations[i] += speed * (1 + this.smoothedMid * 2);
        }

        // Create gradient background if trail effect is enabled
        if (this.trailEffect) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
            gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);
        }

        // Render each kaleidoscope segment
        for (let segment = 0; segment < this.segments; segment++) {
            ctx.save();
            ctx.rotate(segment * segmentAngle);
            
            // Alternate mirroring for true kaleidoscope effect
            if (this.mirrorAlternate && segment % 2 === 1) {
                ctx.scale(1, -1);
            }
            
            // Create clipping path for segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, maxRadius, 0, segmentAngle);
            ctx.closePath();
            ctx.clip();

            // Draw multiple pattern layers
            this.drawEnhancedPattern(ctx, maxRadius, segment);
            
            ctx.restore();
        }

        // Store pattern history for trail effect
        if (this.trailEffect && this.patternHistory.length > 5) {
            this.patternHistory.shift();
        }
        
        ctx.restore();
    }

    drawEnhancedPattern(ctx, maxRadius, segment) {
        // Audio-reactive scaling and coloring
        const audioScale = 1 + this.smoothedBass * this.sensitivity * 0.8;
        const audioHue = (this.smoothedTreble * 360 + this.colorOffset) % 360;
        const pulseFactor = 1 + Math.sin(this.pulsePhase) * this.pulseIntensity * this.smoothedMid * 0.3;

        // Draw multiple layers with different properties
        for (let layer = 0; layer < this.patternLayers; layer++) {
            ctx.save();
            
            const layerRotation = this.currentRotation + this.layerRotations[layer];
            ctx.rotate(Utils.toRadians(layerRotation));
            
            const layerAlpha = 0.8 - (layer * 0.2);
            const layerScale = 1 - (layer * 0.1);
            const layerHueShift = layer * 60;
            
            ctx.globalAlpha = layerAlpha * this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity;
            
            this.drawPatternLayer(ctx, maxRadius, layer, audioScale, audioHue, pulseFactor, layerScale, layerHueShift);
            
            ctx.restore();
        }
    }

    drawPatternLayer(ctx, maxRadius, layer, audioScale, audioHue, pulseFactor, layerScale, layerHueShift) {
        const patternSteps = this.getPatternSteps();
        const angleStep = this.getAngleStep();
        
        for (let r = this.patternSize * (layer + 1); r < maxRadius * layerScale; r += this.patternSize * 2) {
            const radiusScale = audioScale * pulseFactor * layerScale;
            const actualRadius = r * radiusScale;
            
            if (actualRadius > maxRadius) break;
            
            for (let angle = 0; angle < 180; angle += angleStep) {
                const x = Math.cos(Utils.toRadians(angle)) * actualRadius;
                const y = Math.sin(Utils.toRadians(angle)) * actualRadius;

                // Dynamic color based on position and audio
                const positionHue = (audioHue + layerHueShift + angle + (r / maxRadius) * 120) % 360;
                const saturation = 60 + this.smoothedMid * 40;
                const lightness = 50 + this.smoothedTreble * 30;
                const color = `hsl(${positionHue}, ${saturation}%, ${lightness}%)`;
                
                ctx.fillStyle = color;
                ctx.strokeStyle = color;

                // Dynamic pattern size based on audio and position
                const sizeMultiplier = (0.5 + this.smoothedBass * 0.8) * pulseFactor * (1 + Math.sin(angle * 0.1) * 0.2);
                
                this.drawComplexPattern(ctx, x, y, sizeMultiplier, angle, r, layer);
            }
        }
    }

    drawComplexPattern(ctx, x, y, sizeMultiplier, angle, radius, layer) {
        const size = this.patternSize * sizeMultiplier;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Utils.toRadians(angle + this.currentRotation * 0.5));
        
        switch (this.innerPattern) {
            case 'circle':
                this.drawEnhancedCircle(ctx, size, layer);
                break;
            case 'square':
                this.drawEnhancedSquare(ctx, size, layer);
                break;
            case 'triangle':
                this.drawEnhancedTriangle(ctx, size, layer);
                break;
            case 'star':
                this.drawStar(ctx, size, layer);
                break;
            case 'hexagon':
                this.drawHexagon(ctx, size, layer);
                break;
            case 'flower':
                this.drawFlower(ctx, size, layer);
                break;
            case 'mandala':
                this.drawMandala(ctx, size, layer);
                break;
        }
        
        ctx.restore();
    }

    drawEnhancedCircle(ctx, size, layer) {
        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, ctx.fillStyle);
        gradient.addColorStop(0.7, ctx.fillStyle + '80');
        gradient.addColorStop(1, ctx.fillStyle + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.6, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawEnhancedSquare(ctx, size, layer) {
        // Rotated squares for complexity
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(Utils.toRadians(i * 15 + this.currentRotation));
            const s = size * (1 - i * 0.2);
            ctx.fillRect(-s/2, -s/2, s, s);
            ctx.restore();
        }
    }

    drawEnhancedTriangle(ctx, size, layer) {
        // Multiple triangles
        for (let i = 0; i < 2; i++) {
            ctx.save();
            ctx.rotate(Utils.toRadians(i * 60));
            ctx.beginPath();
            const s = size * (1 - i * 0.3);
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.866, s * 0.5);
            ctx.lineTo(s * 0.866, s * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    drawStar(ctx, size, layer) {
        const points = 5 + layer;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawHexagon(ctx, size, layer) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * size * 0.5;
            const y = Math.sin(angle) * size * 0.5;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    drawFlower(ctx, size, layer) {
        const petals = 6;
        for (let i = 0; i < petals; i++) {
            ctx.save();
            ctx.rotate((i * 2 * Math.PI) / petals);
            
            ctx.beginPath();
            ctx.ellipse(0, size * 0.3, size * 0.3, size * 0.6, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Center
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawMandala(ctx, size, layer) {
        const rings = 3;
        const elements = 8;
        
        for (let ring = 0; ring < rings; ring++) {
            const ringRadius = size * (0.3 + ring * 0.3);
            
            for (let i = 0; i < elements; i++) {
                const angle = (i * 2 * Math.PI) / elements + ring * 0.2;
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius;
                
                ctx.beginPath();
                ctx.arc(x, y, size * 0.1, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    getPatternSteps() {
        switch (this.geometricComplexity) {
            case 'low': return 1;
            case 'medium': return 2;
            case 'high': return 3;
            default: return 2;
        }
    }

    getAngleStep() {
        switch (this.geometricComplexity) {
            case 'low': return 45;
            case 'medium': return 30;
            case 'high': return 20;
            default: return 30;
        }
    }

    // Override getProperties to include new properties
    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            kaleidoscope: {
                segments: this.segments,
                innerPattern: this.innerPattern,
                patternSize: this.patternSize,
                rotationSpeed: this.rotationSpeed,
                mirrorAlternate: this.mirrorAlternate,
                patternLayers: this.patternLayers,
                colorCycleSpeed: this.colorCycleSpeed,
                pulseIntensity: this.pulseIntensity,
                complexPattern: this.complexPattern,
                trailEffect: this.trailEffect,
                geometricComplexity: this.geometricComplexity
            }
        };
    }

    // Override updateProperty to handle new properties
    updateProperty(category, property, value) {
        if (category === 'kaleidoscope') {
            if (property === 'segments') {
                this.segments = Math.max(3, Math.min(20, parseInt(value)));
            } else if (property === 'patternLayers') {
                this.patternLayers = Math.max(1, Math.min(5, parseInt(value)));
                // Reinitialize layer rotations
                this.layerRotations = [];
                for (let i = 0; i < this.patternLayers; i++) {
                    this.layerRotations.push(Math.random() * 360);
                }
            } else if (property === 'innerPattern' || property === 'geometricComplexity') {
                this[property] = value;
            } else if (property === 'mirrorAlternate' || property === 'complexPattern' || property === 'trailEffect') {
                this[property] = value;
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    // Override serialize to include new properties
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            segments: this.segments,
            innerPattern: this.innerPattern,
            patternSize: this.patternSize,
            rotationSpeed: this.rotationSpeed,
            mirrorAlternate: this.mirrorAlternate,
            patternLayers: this.patternLayers,
            colorCycleSpeed: this.colorCycleSpeed,
            pulseIntensity: this.pulseIntensity,
            complexPattern: this.complexPattern,
            trailEffect: this.trailEffect,
            geometricComplexity: this.geometricComplexity
        };
    }
}

class GalaxyVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.starCount = 100;
        this.armCount = 3;
        this.rotationSpeed = 0.5;
        this.currentRotation = 0;
        this.stars = [];
        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                angle: Math.random() * 2 * Math.PI,
                distance: Math.random() * 0.8,
                speed: 0.5 + Math.random() * 0.5,
                size: 1 + Math.random() * 3,
                brightness: Math.random()
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
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentRotation += this.rotationSpeed * this.animationSpeed;
        const maxRadius = Math.min(this.width, this.height) / 2;

        let audioBoost = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioBoost = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        // Draw galaxy arms
        ctx.strokeStyle = this.color + '40';
        ctx.lineWidth = 3;
        
        /*for (let arm = 0; arm < this.armCount; arm++) {
            ctx.beginPath();
            const armOffset = (arm / this.armCount) * 2 * Math.PI;
            
            for (let r = 0; r <= maxRadius; r += 5) {
                const spiralAngle = armOffset + (r / maxRadius) * 6 * Math.PI + Utils.toRadians(this.currentRotation);
                const x = Math.cos(spiralAngle) * r * audioBoost;
                const y = Math.sin(spiralAngle) * r * audioBoost;
                
                if (r === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }*/

        // Draw and update stars
        this.stars.forEach(star => {
            star.angle += star.speed * this.animationSpeed * 0.01;
            star.brightness = Math.sin(Date.now() * 0.001 + star.angle) * 0.5 + 0.5;
            
            const spiralAngle = star.angle + (star.distance * 4) + Utils.toRadians(this.currentRotation);
            const x = Math.cos(spiralAngle) * star.distance * maxRadius * audioBoost;
            const y = Math.sin(spiralAngle) * star.distance * maxRadius * audioBoost;
            
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.getEffectiveOpacity() * star.brightness;
            ctx.beginPath();
            ctx.arc(x, y, star.size * audioBoost, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.restore();
    }
}

class DNAVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.helixTurns = 4;
        this.helixSpeed = 2;
        this.currentOffset = 0;
        this.baseCount = 20;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentOffset += this.helixSpeed * this.animationSpeed;

        let audioAmplitude = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioAmplitude = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        const helixRadius = Math.min(this.width, this.height) / 6;
        const helixHeight = this.height;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;

        // Draw the two DNA strands
        for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            const strandOffset = strand * Math.PI;
            
            for (let y = -helixHeight/2; y <= helixHeight/2; y += 2) {
                const normalizedY = y / (helixHeight/2);
                const angle = normalizedY * this.helixTurns * Math.PI + strandOffset + Utils.toRadians(this.currentOffset);
                const x = Math.cos(angle) * helixRadius * audioAmplitude;
                
                if (y === -helixHeight/2) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Draw connecting bases
        ctx.strokeStyle = this.color + '80';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.baseCount; i++) {
            const y = -helixHeight/2 + (i / this.baseCount) * helixHeight;
            const normalizedY = (y + helixHeight/2) / helixHeight;
            const angle = normalizedY * this.helixTurns * Math.PI + Utils.toRadians(this.currentOffset);
            
            const x1 = Math.cos(angle) * helixRadius * audioAmplitude;
            const x2 = Math.cos(angle + Math.PI) * helixRadius * audioAmplitude;
            
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
            
            // Draw base pairs
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(x1, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x2, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.restore();
    }
}

class FlowerVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.petalCount = 8;
        this.petalLayers = 3;
        this.bloomSpeed = 1;
        this.currentBloom = 0;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentBloom += this.bloomSpeed * this.animationSpeed;

        let audioScale = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioScale = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.5;
        }

        const maxRadius = Math.min(this.width, this.height) / 2;

        // Draw petal layers
        for (let layer = 0; layer < this.petalLayers; layer++) {
            const layerRadius = maxRadius * (0.3 + layer * 0.3) * audioScale;
            const layerAlpha = 0.8 - layer * 0.2;
            const angleOffset = (layer * 45) + this.currentBloom;

            ctx.globalAlpha = this.getEffectiveOpacity() * layerAlpha;

            for (let petal = 0; petal < this.petalCount; petal++) {
                const angle = (petal / this.petalCount) * 2 * Math.PI + Utils.toRadians(angleOffset);
                
                // Create petal shape using curves
                ctx.beginPath();
                ctx.fillStyle = this.color;
                
                const petalLength = layerRadius;
                const petalWidth = layerRadius * 0.3;
                
                // Petal curve
                const controlX1 = Math.cos(angle - 0.3) * petalLength * 0.6;
                const controlY1 = Math.sin(angle - 0.3) * petalLength * 0.6;
                const controlX2 = Math.cos(angle + 0.3) * petalLength * 0.6;
                const controlY2 = Math.sin(angle + 0.3) * petalLength * 0.6;
                const tipX = Math.cos(angle) * petalLength;
                const tipY = Math.sin(angle) * petalLength;
                
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(controlX1, controlY1, tipX, tipY);
                ctx.quadraticCurveTo(controlX2, controlY2, 0, 0);
                ctx.fill();
            }
        }

        // Draw center
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius * 0.15 * audioScale, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }
}

class TunnelVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.rings = 30;
        this.tunnelSpeed = 2;
        this.currentDepth = 0;
        this.perspective = 0.9;
        this.segments = 128;
        this.twist = 180; // Degrees of twist from front to back
        this.wallThickness = 0.7; // How much audio affects the walls
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            tunnel: {
                rings: this.rings,
                tunnelSpeed: this.tunnelSpeed,
                perspective: this.perspective,
                segments: this.segments,
                twist: this.twist,
                wallThickness: this.wallThickness
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'tunnel') {
            this[property] = parseFloat(value);
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentDepth += this.tunnelSpeed * this.animationSpeed;

        const frequencyData = this.getFilteredFrequencyData();
        const maxRadius = Math.min(this.width, this.height) / 2.5;

        // Draw tunnel rings
        for (let ring = 0; ring < this.rings; ring++) {
            const depth = (ring + (this.currentDepth % 1)) / this.rings;
            const scale = (1 - depth) * this.perspective;
            const alpha = Math.pow(1 - depth, 2);

            if (scale <= 0.01) continue;

            const ringRotation = this.currentDepth * 1.5 + depth * this.twist;

            ctx.save();
            ctx.rotate(Utils.toRadians(ringRotation));
            ctx.globalAlpha = this.getEffectiveOpacity() * alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(1, 2.5 * scale);
            
            ctx.beginPath();
            
            for (let i = 0; i <= this.segments; i++) {
                const angle = (i / this.segments) * 2 * Math.PI;
                
                let radius = maxRadius * scale;

                if (frequencyData && this.reactToAudio) {
                    const freqIndex = Math.floor((i % this.segments) / this.segments * (frequencyData.length - 1));
                    const freqValue = frequencyData[freqIndex] || 0;
                    const audioOffset = (freqValue / 255) * maxRadius * this.wallThickness * this.sensitivity * scale;
                    radius += audioOffset;
                }
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

class FractalTreeVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.maxDepth = 6;
        this.branchAngle = 25;
        this.branchRatio = 0.7;
        this.windEffect = 0;
        this.growthPhase = 0;
        
        // Additional properties for the properties panel
        this.trunkLength = 0.3; // Percentage of height
        this.windStrength = 1;
        this.growthSpeed = 0.5;
        this.colorVariation = true;
        this.leafMode = false;
    }

    // Override getProperties to include fractal tree properties
    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            fractalTree: {
                maxDepth: this.maxDepth,
                branchAngle: this.branchAngle,
                branchRatio: this.branchRatio,
                trunkLength: this.trunkLength,
                windStrength: this.windStrength,
                growthSpeed: this.growthSpeed,
                colorVariation: this.colorVariation,
                leafMode: this.leafMode
            }
        };
    }

    // Override updateProperty to handle fractal tree properties
    updateProperty(category, property, value) {
        if (category === 'fractalTree') {
            if (property === 'maxDepth') {
                this.maxDepth = Math.max(3, Math.min(10, parseInt(value)));
            } else if (property === 'branchAngle') {
                this.branchAngle = Math.max(10, Math.min(60, parseFloat(value)));
            } else if (property === 'branchRatio') {
                this.branchRatio = Math.max(0.5, Math.min(0.9, parseFloat(value)));
            } else if (property === 'trunkLength') {
                this.trunkLength = Math.max(0.1, Math.min(0.5, parseFloat(value)));
            } else if (property === 'windStrength') {
                this.windStrength = Math.max(0, Math.min(3, parseFloat(value)));
            } else if (property === 'growthSpeed') {
                this.growthSpeed = Math.max(0.1, Math.min(2, parseFloat(value)));
            } else if (property === 'colorVariation' || property === 'leafMode') {
                this[property] = value;
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.windEffect += this.animationSpeed * this.windStrength;
        this.growthPhase += this.animationSpeed * this.growthSpeed;

        let audioGrowth = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioGrowth = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.5;
        }

        const trunkLength = this.height * this.trunkLength * audioGrowth;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        
        // Start drawing from bottom center
        ctx.translate(0, this.height/2);
        this.drawBranch(ctx, 0, 0, -90, trunkLength, this.maxDepth, audioGrowth);

        ctx.restore();
    }

    drawBranch(ctx, x, y, angle, length, depth, audioGrowth) {
        if (depth === 0 || length < 2) return;

        const windSway = Math.sin(this.windEffect * 0.02 + depth) * (8 - depth) * 2 * this.windStrength;
        const actualAngle = angle + windSway;
        
        const endX = x + Math.cos(Utils.toRadians(actualAngle)) * length;
        const endY = y + Math.sin(Utils.toRadians(actualAngle)) * length;

        // Growth animation
        const growthFactor = Math.min(1, (this.growthPhase - (this.maxDepth - depth) * 0.5) / 2);
        if (growthFactor <= 0) return;

        const actualEndX = x + (endX - x) * growthFactor;
        const actualEndY = y + (endY - y) * growthFactor;

        // Draw branch
        ctx.save();
        ctx.lineWidth = Math.max(1, depth * 1.5);
        ctx.globalAlpha = this.getEffectiveOpacity() * (0.5 + depth * 0.1);
        
        // Color variation by depth
        if (this.colorVariation) {
            const hue = (depth * 30 + this.windEffect) % 360;
            ctx.strokeStyle = `hsl(${hue}, 60%, 50%)`;
        } else {
            ctx.strokeStyle = this.color;
        }
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(actualEndX, actualEndY);
        ctx.stroke();
        ctx.restore();

        // Draw leaves at the end branches - FIXED: More lenient conditions and proper positioning
        if (this.leafMode && depth <= 4 && growthFactor > 0.3 && length > 10) {
            ctx.save();
            ctx.fillStyle = '#90EE90'; // Light green for leaves
            ctx.globalAlpha = this.getEffectiveOpacity() * 0.7 * growthFactor;
            
            // Draw multiple small leaves around the branch end
            const leafCount = Math.floor(3 + Math.random() * 4); // 3-6 leaves per branch end
            for (let i = 0; i < leafCount; i++) {
                const leafAngle = actualAngle + (Math.random() - 0.5) * 90; // Wider spread
                const leafDistance = 8 + Math.random() * 15; // Distance from branch end
                const leafX = actualEndX + Math.cos(Utils.toRadians(leafAngle)) * leafDistance;
                const leafY = actualEndY + Math.sin(Utils.toRadians(leafAngle)) * leafDistance;
                
                // Draw leaf as small ellipse with more variation
                ctx.beginPath();
                ctx.save();
                ctx.translate(leafX, leafY);
                ctx.rotate(Utils.toRadians(leafAngle));
                ctx.scale(1, 0.5); // Make leaves more oval-shaped
                const leafSize = 3 + Math.random() * 3; // Variable leaf size
                ctx.arc(0, 0, leafSize, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        }

        if (growthFactor >= 1) {
            // Draw child branches
            const newLength = length * this.branchRatio;
            const leftAngle = actualAngle - this.branchAngle;
            const rightAngle = actualAngle + this.branchAngle;
            
            this.drawBranch(ctx, endX, endY, leftAngle, newLength, depth - 1, audioGrowth);
            this.drawBranch(ctx, endX, endY, rightAngle, newLength, depth - 1, audioGrowth);
        }
    }

    // Override serialize to include new properties
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            maxDepth: this.maxDepth,
            branchAngle: this.branchAngle,
            branchRatio: this.branchRatio,
            trunkLength: this.trunkLength,
            windStrength: this.windStrength,
            growthSpeed: this.growthSpeed,
            colorVariation: this.colorVariation,
            leafMode: this.leafMode
        };
    }
}

class ReactiveImageVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        
        // Image properties
        this.imageData = null;
        this.imageSrc = null;
        this.imageElement = null;
        this.imageLoaded = false;
        
        // Shape properties
        this.shape = 'rectangle'; // rectangle, circle, square
        this.maskMode = true;
        
        // Reactive properties
        this.baseScale = 1;
        this.reactiveScaleStrength = 0.5;
        this.scaleSmoothing = 0.8;
        this.currentAudioScale = 1;
        
        // Flash properties
        this.flashEnabled = false;
        this.flashColor = '#ffffff';
        this.flashIntensity = 0.5;
        this.flashSpeed = 1;
        this.flashThreshold = 0.7; // Audio threshold to trigger flash
        this.currentFlash = 0;
        this.flashSmoothing = 0.9;
        
        // Audio analysis
        this.audioAverage = 0;
        this.audioPeak = 0;
        this.smoothedAverage = 0;
        this.smoothedPeak = 0;
    }

    // Load image from file
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid image file'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.imageSrc = e.target.result;
                this.imageData = e.target.result; // Store for serialization
                
                this.imageElement = new Image();
                this.imageElement.onload = () => {
                    this.imageLoaded = true;
                    resolve();
                };
                this.imageElement.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                this.imageElement.src = this.imageSrc;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // Load image from base64 data (for deserialization)
    loadImageFromData(imageData) {
        return new Promise((resolve, reject) => {
            if (!imageData) {
                reject(new Error('No image data provided'));
                return;
            }

            this.imageSrc = imageData;
            this.imageData = imageData;
            
            this.imageElement = new Image();
            this.imageElement.onload = () => {
                this.imageLoaded = true;
                resolve();
            };
            this.imageElement.onerror = () => {
                reject(new Error('Failed to load image from data'));
            };
            this.imageElement.src = this.imageSrc;
        });
    }

    updateAudioData(audioData, frequencyData) {
        super.updateAudioData(audioData, frequencyData);
        
        if (this.audioData && this.reactToAudio) {
            // Calculate audio metrics
            this.audioAverage = Utils.average(this.audioData) / 255;
            this.audioPeak = Math.max(...this.audioData) / 255;
            
            // Smooth the values
            this.smoothedAverage = this.smoothedAverage * this.scaleSmoothing + this.audioAverage * (1 - this.scaleSmoothing);
            this.smoothedPeak = this.smoothedPeak * this.scaleSmoothing + this.audioPeak * (1 - this.scaleSmoothing);
            
            // Update reactive scale
            this.currentAudioScale = 1 + this.smoothedAverage * this.reactiveScaleStrength * this.sensitivity;
            
            // Update flash effect
            if (this.flashEnabled) {
                const flashTrigger = this.smoothedPeak > this.flashThreshold ? 1 : 0;
                this.currentFlash = this.currentFlash * this.flashSmoothing + flashTrigger * (1 - this.flashSmoothing);
            } else {
                this.currentFlash = 0;
            }
        }
    }

    render(ctx) {
        if (!this.visible || !this.imageLoaded || !this.imageElement) return;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        
        // Apply base scale and reactive scale
        const totalScaleX = this.scaleX * this.currentAudioScale;
        const totalScaleY = this.scaleY * this.currentAudioScale;
        ctx.scale(totalScaleX, totalScaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

        // Create clipping mask based on shape
        if (this.maskMode && this.shape !== 'rectangle') {
            this.createShapeMask(ctx, bounds);
        }

        // Draw the image
        ctx.drawImage(this.imageElement, bounds.x, bounds.y, bounds.width, bounds.height);

        // Apply flash effect
        if (this.flashEnabled && this.currentFlash > 0.01) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.getEffectiveOpacity() * this.currentFlash * this.flashIntensity;
            
            if (this.shape === 'circle' && this.maskMode) {
                ctx.beginPath();
                ctx.arc(0, 0, Math.min(bounds.width, bounds.height) / 2, 0, 2 * Math.PI);
                ctx.fill();
            } else if (this.shape === 'square' && this.maskMode) {
                const size = Math.min(bounds.width, bounds.height);
                ctx.fillRect(-size / 2, -size / 2, size, size);
            } else {
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            }
        }

        ctx.restore();
    }

    createShapeMask(ctx, bounds) {
        ctx.beginPath();
        
        switch (this.shape) {
            case 'circle':
                const radius = Math.min(bounds.width, bounds.height) / 2;
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                break;
                
            case 'square':
                const size = Math.min(bounds.width, bounds.height);
                ctx.rect(-size / 2, -size / 2, size, size);
                break;
                
            default: // rectangle
                ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                break;
        }
        
        ctx.clip();
    }

    // Override getProperties to include image-specific properties
    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            image: {
                shape: this.shape,
                maskMode: this.maskMode,
                reactiveScaleStrength: this.reactiveScaleStrength,
                scaleSmoothing: this.scaleSmoothing,
                flashEnabled: this.flashEnabled,
                flashColor: this.flashColor,
                flashIntensity: this.flashIntensity,
                flashSpeed: this.flashSpeed,
                flashThreshold: this.flashThreshold
            }
        };
    }

    // Override updateProperty to handle image properties
    updateProperty(category, property, value) {
        if (category === 'image') {
            if (property === 'shape' || property === 'flashColor') {
                this[property] = value;
            } else if (property === 'maskMode' || property === 'flashEnabled') {
                this[property] = value;
            } else if (property === 'reactiveScaleStrength') {
                this.reactiveScaleStrength = Math.max(0, Math.min(2, parseFloat(value)));
            } else if (property === 'scaleSmoothing' || property === 'flashIntensity' || property === 'flashThreshold') {
                this[property] = Math.max(0, Math.min(1, parseFloat(value)));
            } else if (property === 'flashSpeed') {
                this.flashSpeed = Math.max(0.1, Math.min(5, parseFloat(value)));
                this.flashSmoothing = 1 - (this.flashSpeed / 5);
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    // Override serialize to include image data
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            imageData: this.imageData, // Include base64 image data
            shape: this.shape,
            maskMode: this.maskMode,
            reactiveScaleStrength: this.reactiveScaleStrength,
            scaleSmoothing: this.scaleSmoothing,
            flashEnabled: this.flashEnabled,
            flashColor: this.flashColor,
            flashIntensity: this.flashIntensity,
            flashSpeed: this.flashSpeed,
            flashThreshold: this.flashThreshold
        };
    }

    // Override deserialize to restore image
    async deserialize(data) {
        Object.assign(this, data);
        
        // Restore image if data exists
        if (data.imageData) {
            try {
                await this.loadImageFromData(data.imageData);
            } catch (error) {
                console.error('Failed to restore image:', error);
            }
        }
    }
}

class MatrixVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.fallSpeed = 1;
        this.fontSize = 16;
        this.rainDensity = 0.8; // 0 to 1
        this.characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';
        this.trailLength = 18;
        this.drops = [];
        this.columns = 0;
        this.fadeDistance = 60; // Distance over which drops fade out at bottom
        this.initializeDrops();
    }

    initializeDrops() {
        this.columns = Math.floor(this.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            // Each drop is an object: { y, trail, speed, alpha }
            this.drops[i] = {
                y: Math.random() * this.height,
                trail: Array.from({ length: this.trailLength }, () => Math.floor(Math.random() * this.characters.length)),
                speed: this.fallSpeed * (0.8 + Math.random() * 0.4),
                alpha: 1, // Overall alpha for the entire drop trail
                fadePhase: 'active' // 'active', 'fading', 'respawning'
            };
        }
    }

    resize(width, height) {
        super.resize(width, height);
        this.initializeDrops();
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            matrix: {
                fallSpeed: this.fallSpeed,
                fontSize: this.fontSize,
                rainDensity: this.rainDensity,
                trailLength: this.trailLength,
                fadeDistance: this.fadeDistance
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'matrix') {
            if (property === 'trailLength') {
                this.trailLength = Math.max(5, Math.min(40, parseInt(value)));
                this.initializeDrops();
            } else if (property === 'fadeDistance') {
                this.fadeDistance = Math.max(20, Math.min(200, parseInt(value)));
            } else {
                this[property] = parseFloat(value);
                if (property === 'fontSize' || property === 'rainDensity' || property === 'fallSpeed') {
                    this.initializeDrops();
                }
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);

        // More subtle background fade for better trail effect
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; // Reduced from 0.18 for longer trails
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.font = `${this.fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Audio influence
        const audioAverage = this.frequencyData && this.reactToAudio
            ? Utils.average(this.getFilteredFrequencyData()) / 255
            : 0.5;
        const effectiveSpeed = this.fallSpeed * this.animationSpeed * (0.7 + audioAverage * this.sensitivity);

        // Draw each column/drop
        for (let i = 0; i < this.columns; i++) {
            const drop = this.drops[i];
            let y = drop.y - this.height / 2;

            // Calculate fade-out region
            const fadeStartY = this.height / 2 - this.fadeDistance;
            const fadeEndY = this.height / 2 + this.trailLength * this.fontSize;

            // Determine drop phase and calculate fade alpha
            let dropFadeAlpha = 1;
            
            if (drop.fadePhase === 'active') {
                // Check if drop is entering fade zone
                if (y > fadeStartY) {
                    drop.fadePhase = 'fading';
                }
            } else if (drop.fadePhase === 'fading') {
                // Calculate fade based on position
                if (y >= fadeStartY && y <= fadeEndY) {
                    const fadeProgress = (y - fadeStartY) / (fadeEndY - fadeStartY);
                    dropFadeAlpha = Math.max(0, 1 - fadeProgress);
                    drop.alpha = dropFadeAlpha;
                }
                
                // Check if completely faded
                if (y > fadeEndY || dropFadeAlpha <= 0.01) {
                    drop.fadePhase = 'respawning';
                    // Set new position off-screen at top
                    drop.y = -Math.random() * this.height * 0.5 - this.height / 2;
                    // Generate new trail
                    drop.trail = Array.from({ length: this.trailLength }, () => Math.floor(Math.random() * this.characters.length));
                    drop.speed = this.fallSpeed * (0.8 + Math.random() * 0.4);
                    drop.alpha = 1;
                    drop.fadePhase = 'active';
                    continue; // Skip rendering this frame for the respawned drop
                }
            }

            // Draw the trail with fade effect
            for (let t = 0; t < this.trailLength; t++) {
                const charIndex = drop.trail[t];
                const char = this.characters[charIndex];
                const trailY = y - t * this.fontSize;

                // Calculate trail fade (head brightest, tail fades)
                let trailAlpha = this.getEffectiveOpacity() * (1 - t / this.trailLength);
                
                // Apply drop fade
                trailAlpha *= drop.alpha;

                if (trailAlpha <= 0.01) continue; // Skip very transparent characters

                // Head character is brightest white, trail follows main color
                if (t === 0) {
                    ctx.fillStyle = '#fff';
                    ctx.globalAlpha = Math.min(1, trailAlpha * 1.2);
                } else {
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = trailAlpha * 0.8;
                }

                // Only draw if within visible area (with some margin)
                if (trailY > -this.height / 2 - this.fontSize && trailY < this.height / 2 + this.fontSize) {
                    ctx.fillText(char, -this.width / 2 + i * this.fontSize + this.fontSize / 2, trailY);
                }
            }

            // Update drop position (only if not respawning)
            if (drop.fadePhase !== 'respawning') {
                drop.y += drop.speed * effectiveSpeed * (0.7 + Math.random() * 0.6);

                // Occasionally randomize trail characters for flicker effect
                if (Math.random() < 0.15) { // Reduced frequency slightly
                    const randomIndex = Math.floor(Math.random() * this.trailLength);
                    drop.trail[randomIndex] = Math.floor(Math.random() * this.characters.length);
                }
            }

            // Random respawn based on rain density (only for active drops)
            if (drop.fadePhase === 'active' && Math.random() > (1 - this.rainDensity * 0.015)) {
                drop.fadePhase = 'fading';
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            fallSpeed: this.fallSpeed,
            fontSize: this.fontSize,
            rainDensity: this.rainDensity,
            trailLength: this.trailLength,
            fadeDistance: this.fadeDistance
        };
    }
}

class SunburstVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.rayCount = 64;
        this.innerRadius = 20;
        this.rotationSpeed = 1;
        this.colorMode = 'gradient'; // solid, gradient, rainbow
        this.currentRotation = 0;
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            sunburst: {
                rayCount: this.rayCount,
                innerRadius: this.innerRadius,
                rotationSpeed: this.rotationSpeed,
                colorMode: this.colorMode
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'sunburst') {
            if (property === 'colorMode') {
                this[property] = value;
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentRotation += this.rotationSpeed * this.animationSpeed;
        ctx.rotate(Utils.toRadians(this.currentRotation));

        const frequencyData = this.getFilteredFrequencyData();
        const maxRayLength = Math.min(this.width, this.height) / 2 - this.innerRadius;

        for (let i = 0; i < this.rayCount; i++) {
            const angle = (i / this.rayCount) * 2 * Math.PI;
            const freqIndex = Math.floor((i / this.rayCount) * ((frequencyData?.length || 1) - 1));
            const freqValue = (frequencyData && this.reactToAudio) ? (frequencyData[freqIndex] || 0) : 128;

            const rayLength = (freqValue / 255) * maxRayLength * this.sensitivity;

            const x1 = Math.cos(angle) * this.innerRadius;
            const y1 = Math.sin(angle) * this.innerRadius;
            const x2 = Math.cos(angle) * (this.innerRadius + rayLength);
            const y2 = Math.sin(angle) * (this.innerRadius + rayLength);

            let strokeStyle = this.color;
            if (this.colorMode === 'gradient') {
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, this.color + '00');
                gradient.addColorStop(1, this.color);
                strokeStyle = gradient;
            } else if (this.colorMode === 'rainbow') {
                strokeStyle = `hsl(${(i / this.rayCount) * 360}, 100%, 50%)`;
            }

            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = (this.width / this.rayCount) * 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.restore();
    }

    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            rayCount: this.rayCount,
            innerRadius: this.innerRadius,
            rotationSpeed: this.rotationSpeed,
            colorMode: this.colorMode
        };
    }
}

class Equalizer3DVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.barCount = 32;
        this.barSpacing = 5;
        this.perspective = 0.7; // 0 to 1
        this.depth = 50;
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            equalizer3d: {
                barCount: this.barCount,
                barSpacing: this.barSpacing,
                perspective: this.perspective,
                depth: this.depth
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'equalizer3d') {
            this[property] = parseFloat(value);
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        const frequencyData = this.getFilteredFrequencyData();
        const totalBarWidth = this.width / this.barCount;
        const barWidth = totalBarWidth - this.barSpacing;

        const perspectiveOriginY = -this.height / 2 * (1 - this.perspective);

        for (let i = 0; i < this.barCount; i++) {
            const freqIndex = Math.floor((i / this.barCount) * ((frequencyData?.length || 1) - 1));
            const freqValue = (frequencyData && this.reactToAudio) ? (frequencyData[freqIndex] || 0) : 128;
            const barHeight = Math.max(1, (freqValue / 255) * this.height * this.sensitivity);

            const x = -this.width / 2 + i * totalBarWidth;
            const y = this.height / 2 - barHeight;

            // Calculate perspective points
            const topY = y;
            const bottomY = this.height / 2;
            const perspectiveTopY = perspectiveOriginY + (topY - perspectiveOriginY) * this.perspective;
            const perspectiveBottomY = perspectiveOriginY + (bottomY - perspectiveOriginY) * this.perspective;
            const perspectiveDepth = this.depth * (1 - this.perspective);

            // Bar front face
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Bar top face
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + perspectiveDepth, perspectiveTopY);
            ctx.lineTo(x + barWidth + perspectiveDepth, perspectiveTopY);
            ctx.lineTo(x + barWidth, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();

            // Bar side face
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x + barWidth, y);
            ctx.lineTo(x + barWidth + perspectiveDepth, perspectiveTopY);
            ctx.lineTo(x + barWidth + perspectiveDepth, perspectiveBottomY);
            ctx.lineTo(x + barWidth, bottomY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fill();
        }

        ctx.restore();
    }

    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            barCount: this.barCount,
            barSpacing: this.barSpacing,
            perspective: this.perspective,
            depth: this.depth
        };
    }
}

class FogVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.density = 0.5;
        this.speed = 0.5;
        this.layers = 3;
        this.time = 0;
        this.color1 = '#00d4ff';
        this.color2 = '#ffffff';
        this.cloudsPerLayer = 12;
        this.cloudBlobs = [];
        this.initClouds();
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            fog: {
                density: this.density,
                speed: this.speed,
                layers: this.layers,
                color1: this.color1,
                color2: this.color2
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'fog') {
            if (property === 'color1' || property === 'color2') {
                this[property] = value;
            } else if (property === 'layers') {
                this.layers = Math.max(1, Math.min(6, parseInt(value)));
                this.initClouds();
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    initClouds() {
        this.cloudBlobs = [];
        for (let l = 0; l < this.layers; l++) {
            let layer = [];
            for (let i = 0; i < this.cloudsPerLayer; i++) {
                layer.push({
                    x: Math.random(),
                    y: Math.random(),
                    r: 0.18 + Math.random() * 0.18,
                    dx: (Math.random() - 0.5) * 0.02,
                    dy: (Math.random() - 0.5) * 0.01,
                    phase: Math.random() * Math.PI * 2
                });
            }
            this.cloudBlobs.push(layer);
        }
    }

    render(ctx) {
        if (!this.visible) return;
        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.time += this.speed * this.animationSpeed * 0.5;

        // Audio influence
        let audioBoost = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioBoost = 1 + Utils.average(this.getFilteredFrequencyData()) / 255 * this.sensitivity * 0.5;
        }

        const maxR = Math.min(this.width, this.height) / 2;

        for (let l = 0; l < this.layers; l++) {
            const blobs = this.cloudBlobs[l];
            const layerAlpha = (this.density / this.layers) * (0.7 + 0.3 * l / this.layers);
            const color = Utils.lerpColor(this.color1, this.color2, l / (this.layers - 1 || 1));

            for (let blob of blobs) {
                // Animate position
                blob.x += blob.dx * this.animationSpeed * 0.5;
                blob.y += blob.dy * this.animationSpeed * 0.5;
                blob.x += Math.sin(this.time * 0.1 + blob.phase) * 0.0005;
                blob.y += Math.cos(this.time * 0.13 + blob.phase) * 0.0005;

                // Wrap around
                if (blob.x < 0) blob.x += 1;
                if (blob.x > 1) blob.x -= 1;
                if (blob.y < 0) blob.y += 1;
                if (blob.y > 1) blob.y -= 1;

                // Calculate ellipse position and size
                const cx = (blob.x - 0.5) * this.width;
                const cy = (blob.y - 0.5) * this.height;
                const rx = blob.r * maxR * (1 + audioBoost * 0.2);
                const ry = rx * (0.7 + Math.sin(this.time * 0.2 + blob.phase) * 0.2);

                // Create radial gradient for soft cloud
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
                grad.addColorStop(0, color.replace('rgb', 'rgba').replace(')', `,${layerAlpha * 0.7 * audioBoost}`));
                grad.addColorStop(0.7, color.replace('rgb', 'rgba').replace(')', `,${layerAlpha * 0.3 * audioBoost}`));
                grad.addColorStop(1, color.replace('rgb', 'rgba').replace(')', `,0`));

                ctx.save();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.restore();
    }
}

// Helper for color interpolation (returns CSS rgb string)
if (!Utils.lerpColor) {
    Utils.lerpColor = function (a, b, t) {
        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
            return [
                parseInt(hex.substr(0, 2), 16),
                parseInt(hex.substr(2, 2), 16),
                parseInt(hex.substr(4, 2), 16)
            ];
        }
        const ca = hexToRgb(a), cb = hexToRgb(b);
        const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
        const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
        const b_ = Math.round(ca[2] + (cb[2] - ca[2]) * t);
        return `rgb(${r},${g},${b_})`;
    };
}

// Helper for color interpolation
if (!Utils.lerpHex) {
    Utils.lerpHex = function (a, b, t, ch) {
        const hexToRgb = hex => {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        };
        const ca = hexToRgb(a), cb = hexToRgb(b);
        return Math.round(ca[ch] + (cb[ch] - ca[ch]) * t);
    };
}

class StarfieldVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.starCount = 400;
        this.speed = 1.5;
        this.zoomSpeed = 0.01;
        this.starScale = .5;
        this.stars = [];
        this.zoom = 1;
        this.initStars();
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            starfield: {
                starCount: this.starCount,
                speed: this.speed,
                zoomSpeed: this.zoomSpeed,
                starScale: this.starScale
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'starfield') {
            if (property === 'starCount') {
                this.starCount = Math.max(50, Math.min(2000, parseInt(value)));
                this.initStars();
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push(this.randomStar());
        }
        this.zoom = 1;
    }

    randomStar() {
        // Place stars in a cube, not just a plane, for infinite feel
        return {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: Math.random() * 0.9 + 0.1, // avoid z=0
            size: Math.random() * 1.5 + 0.5
        };
    }

    render(ctx) {
        if (!this.visible) return;
        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        // Audio zoom
        let audioZoom = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioZoom = 1 + Utils.average(this.getFilteredFrequencyData()) / 255 * this.sensitivity * 0.5;
        }

        // Clear background to prevent color filling
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

        const maxZ = 1; // When a star is "too close", recycle it

        for (let star of this.stars) {
            // Move star forward (simulate camera moving forward)
            star.z -= this.speed * this.animationSpeed * 0.008 * audioZoom;
            
            // If star is too close, recycle it to the back
            if (star.z <= 0.001) {
                // Reset star to back with new random position
                star.x = (Math.random() - 0.5) * 2;
                star.y = (Math.random() - 0.5) * 2;
                star.z = maxZ;
                star.size = Math.random() * 1.5 + 0.5;
            }
            
            // Project 3D to 2D
            const sx = (star.x / star.z) * this.width * 0.5;
            const sy = (star.y / star.z) * this.height * 0.5;
            
            // Size based on distance (closer = bigger)
            const size = (star.size / star.z) * 1;
            
            // Alpha based on distance and speed
            const alpha = Math.min(1, (1 - star.z) * 2);
            
            // Only draw stars within bounds
            if (Math.abs(sx) < this.width && Math.abs(sy) < this.height && size > 0) {
                ctx.globalAlpha = this.getEffectiveOpacity() * alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(0.1, size), 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// Super cool: "Polygon Pulse" - a polygon that pulses and morphs with audio
class PolygonPulseVisualizer extends BaseVisualizer {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.sides = 6;
        this.radius = 80;
        this.morph = 0.3;
        this.pulse = 0.5;
        this.rotationSpeed = 0.5;
        this.currentRotation = 0;
    }

    getProperties() {
        const baseProps = super.getProperties();
        return {
            ...baseProps,
            polygonpulse: {
                sides: this.sides,
                morph: this.morph,
                pulse: this.pulse,
                rotationSpeed: this.rotationSpeed
            }
        };
    }

    updateProperty(category, property, value) {
        if (category === 'polygonpulse') {
            if (property === 'sides') {
                this.sides = Math.max(3, Math.min(16, parseInt(value)));
            } else {
                this[property] = parseFloat(value);
            }
        } else {
            super.updateProperty(category, property, value);
        }
    }

    render(ctx) {
        if (!this.visible) return;
        ctx.save();
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation + this.currentRotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.getEffectiveOpacity(); // Use effective opacity instead of this.opacity

        this.currentRotation += this.rotationSpeed * this.animationSpeed;

        let audioPulse = 1, morph = this.morph;
        if (this.frequencyData && this.reactToAudio) {
            audioPulse += Utils.average(this.getFilteredFrequencyData()) / 255 * this.pulse * this.sensitivity;
            morph += (Math.max(...this.getFilteredFrequencyData()) / 255) * 0.5 * this.morph;
        }

        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const angle = (i / this.sides) * 2 * Math.PI;
            const morphAngle = angle + Math.sin(this.currentRotation * 0.03 + angle * this.sides) * morph;
            const r = this.radius * audioPulse * (0.8 + 0.2 * Math.sin(this.currentRotation * 0.1 + angle * 2));
            const x = Math.cos(morphAngle) * r;
            const y = Math.sin(morphAngle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
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
            case 'wave':
                return new WaveVisualizer(x, y, width, height);
            case 'lissajous':
                return new LissajousVisualizer(x, y, width, height);
            case 'vortex':
                return new VortexVisualizer(x, y, width, height);
            case 'plasma':
                return new PlasmaVisualizer(x, y, width, height);
            case 'network':
                return new NetworkVisualizer(x, y, width, height);
            case 'kaleidoscope':
                return new KaleidoscopeVisualizer(x, y, width, height);
            case 'galaxy':
                return new GalaxyVisualizer(x, y, width, height);
            case 'dna':
                return new DNAVisualizer(x, y, width, height);
            case 'flower':
                return new FlowerVisualizer(x, y, width, height);
            case 'tunnel':
                return new TunnelVisualizer(x, y, width, height);
            case 'fractaltree':
                return new FractalTreeVisualizer(x, y, width, height);
            case 'matrix':
                return new MatrixVisualizer(x, y, width, height);
            case 'sunburst':
                return new SunburstVisualizer(x, y, width, height);
            case 'equalizer3d':
                return new Equalizer3DVisualizer(x, y, width, height);
            case 'fog':
                return new FogVisualizer(x, y, width, height);
            case 'starfield':
                return new StarfieldVisualizer(x, y, width, height);
            case 'polygonpulse':
                return new PolygonPulseVisualizer(x, y, width, height);
            case 'reactiveimage':
                return new ReactiveImageVisualizer(x, y, width, height);
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
window.WaveVisualizer = WaveVisualizer;
window.LissajousVisualizer = LissajousVisualizer;
window.VortexVisualizer = VortexVisualizer;
window.PlasmaVisualizer = PlasmaVisualizer;
window.NetworkVisualizer = NetworkVisualizer;
window.KaleidoscopeVisualizer = KaleidoscopeVisualizer;

window.GalaxyVisualizer = GalaxyVisualizer;
window.DNAVisualizer = DNAVisualizer;
window.FlowerVisualizer = FlowerVisualizer;
window.TunnelVisualizer = TunnelVisualizer;
window.FractalTreeVisualizer = FractalTreeVisualizer;
window.MatrixVisualizer = MatrixVisualizer;
window.SunburstVisualizer = SunburstVisualizer;
window.Equalizer3DVisualizer = Equalizer3DVisualizer;
window.ReactiveImageVisualizer = ReactiveImageVisualizer;

window.FogVisualizer = FogVisualizer;
window.StarfieldVisualizer = StarfieldVisualizer;
window.PolygonPulseVisualizer = PolygonPulseVisualizer;
