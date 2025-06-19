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
        ctx.globalAlpha = this.opacity;

        const bounds = { x: -this.width / 2, y: -this.height / 2, width: this.width, height: this.height };

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
        ctx.globalAlpha = this.opacity;

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
        ctx.globalAlpha = this.opacity;

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
        ctx.globalAlpha = this.opacity;

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
        ctx.globalAlpha = this.opacity;

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
        this.frequency1 = 0.02;
        this.frequency2 = 0.03;
        this.gridSize = 8;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 212, b: 255 }; // Default to cyan if parsing fails
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        this.timeOffset += this.animationSpeed;

        let audioInfluence = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioInfluence = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        // Create off-screen canvas for the plasma effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        const imageData = tempCtx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let x = 0; x < this.width; x += this.gridSize) {
            for (let y = 0; y < this.height; y += this.gridSize) {
                const normalizedX = (x - this.width/2) / this.width;
                const normalizedY = (y - this.height/2) / this.height;
                
                const plasma = Math.sin(normalizedX * 10 + this.timeOffset * this.frequency1) +
                              Math.sin(normalizedY * 10 + this.timeOffset * this.frequency2) +
                              Math.sin((normalizedX + normalizedY) * 10 + this.timeOffset * 0.025);
                
                const intensity = ((plasma + 3) / 6) * 255 * audioInfluence;
                
                // Convert color to RGB
                const color = this.hexToRgb(this.color);
                const r = Math.floor(color.r * intensity / 255);
                const g = Math.floor(color.g * intensity / 255);
                const b = Math.floor(color.b * intensity / 255);
                
                // Fill grid area
                for (let dx = 0; dx < this.gridSize && x + dx < this.width; dx++) {
                    for (let dy = 0; dy < this.gridSize && y + dy < this.height; dy++) {
                        const index = ((y + dy) * this.width + (x + dx)) * 4;
                        data[index] = r;
                        data[index + 1] = g;
                        data[index + 2] = b;
                        data[index + 3] = 255;
                    }
                }
            }
        }

        // Put the image data on the temporary canvas
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw the temporary canvas to the main canvas with proper positioning
        ctx.drawImage(tempCanvas, -this.width/2, -this.height/2);

        ctx.restore();
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
        ctx.globalAlpha = this.opacity;

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
                    ctx.globalAlpha = this.opacity * alpha * 0.5;
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
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        this.currentRotation += this.rotationSpeed * this.animationSpeed;

        const maxRadius = Math.min(this.width, this.height) / 2;
        const segmentAngle = (2 * Math.PI) / this.segments;

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

            // Draw pattern
            this.drawPattern(ctx, maxRadius);
            
            ctx.restore();
        }

        ctx.restore();
    }

    drawPattern(ctx, maxRadius) {
        ctx.save();
        ctx.rotate(Utils.toRadians(this.currentRotation));

        let audioScale = 1;
        let audioHue = 0;
        if (this.frequencyData && this.reactToAudio) {
            audioScale = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.5;
            audioHue = (Utils.average(this.frequencyData) / 255) * 360;
        }

        ctx.lineWidth = 2;

        for (let r = this.patternSize; r < maxRadius; r += this.patternSize * 1.5) {
            for (let angle = 0; angle < 180; angle += 30) { // Only half circle for mirroring
                const x = Math.cos(Utils.toRadians(angle)) * r * audioScale;
                const y = Math.sin(Utils.toRadians(angle)) * r * audioScale;

                // Color cycling with audio
                const hue = (angle + this.currentRotation + audioHue) % 360;
                const color = `hsl(${hue}, 70%, 60%)`;
                
                ctx.fillStyle = color;
                ctx.strokeStyle = color;

                if (this.innerPattern === 'circle') {
                    ctx.beginPath();
                    ctx.arc(x, y, this.patternSize * 0.4 * audioScale, 0, 2 * Math.PI);
                    ctx.fill();
                } else if (this.innerPattern === 'square') {
                    const size = this.patternSize * 0.8 * audioScale;
                    ctx.fillRect(x - size/2, y - size/2, size, size);
                } else if (this.innerPattern === 'triangle') {
                    const size = this.patternSize * 0.6 * audioScale;
                    ctx.beginPath();
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x - size, y + size/2);
                    ctx.lineTo(x + size, y + size/2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        ctx.restore();
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
        ctx.globalAlpha = this.opacity;

        this.currentRotation += this.rotationSpeed * this.animationSpeed;
        const maxRadius = Math.min(this.width, this.height) / 2;

        let audioBoost = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioBoost = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity;
        }

        // Draw galaxy arms
        ctx.strokeStyle = this.color + '40';
        ctx.lineWidth = 3;
        
        for (let arm = 0; arm < this.armCount; arm++) {
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
        }

        // Draw and update stars
        this.stars.forEach(star => {
            star.angle += star.speed * this.animationSpeed * 0.01;
            star.brightness = Math.sin(Date.now() * 0.001 + star.angle) * 0.5 + 0.5;
            
            const spiralAngle = star.angle + (star.distance * 4) + Utils.toRadians(this.currentRotation);
            const x = Math.cos(spiralAngle) * star.distance * maxRadius * audioBoost;
            const y = Math.sin(spiralAngle) * star.distance * maxRadius * audioBoost;
            
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity * star.brightness;
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
        ctx.globalAlpha = this.opacity;

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
        ctx.globalAlpha = this.opacity;

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

            ctx.globalAlpha = this.opacity * layerAlpha;

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
        ctx.globalAlpha = this.opacity;
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
        this.rings = 20;
        this.tunnelSpeed = 3;
        this.currentDepth = 0;
        this.perspective = 0.8;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        this.currentDepth += this.tunnelSpeed * this.animationSpeed;

        let audioWarp = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioWarp = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.3;
        }

        const maxRadius = Math.min(this.width, this.height) / 2;

        // Draw tunnel rings
        for (let ring = 0; ring < this.rings; ring++) {
            const depth = (ring + (this.currentDepth % 1)) / this.rings;
            const scale = this.perspective + (1 - this.perspective) * (1 - depth);
            const alpha = 1 - depth;
            
            const ringRadius = maxRadius * scale * audioWarp;
            const ringRotation = this.currentDepth * 10 + ring * 20;
            
            ctx.save();
            ctx.rotate(Utils.toRadians(ringRotation));
            ctx.globalAlpha = this.opacity * alpha;
            
            // Draw ring segments
            const segments = 12;
            for (let seg = 0; seg < segments; seg++) {
                const segAngle = (seg / segments) * 2 * Math.PI;
                const x1 = Math.cos(segAngle) * ringRadius * 0.8;
                const y1 = Math.sin(segAngle) * ringRadius * 0.8;
                const x2 = Math.cos(segAngle) * ringRadius;
                const y2 = Math.sin(segAngle) * ringRadius;
                
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
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
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        const center = this.getCenter();
        ctx.translate(center.x, center.y);
        ctx.rotate(Utils.toRadians(this.rotation));
        ctx.scale(this.scaleX, this.scaleY);
        ctx.globalAlpha = this.opacity;

        this.windEffect += this.animationSpeed;
        this.growthPhase += this.animationSpeed * 0.5;

        let audioGrowth = 1;
        if (this.frequencyData && this.reactToAudio) {
            audioGrowth = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.5;
        }

        const trunkLength = this.height * 0.3 * audioGrowth;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        
        // Start drawing from bottom center
        ctx.translate(0, this.height/2);
        this.drawBranch(ctx, 0, 0, -90, trunkLength, this.maxDepth, audioGrowth);

        ctx.restore();
    }

    drawBranch(ctx, x, y, angle, length, depth, audioGrowth) {
        if (depth === 0 || length < 2) return;

        const windSway = Math.sin(this.windEffect * 0.02 + depth) * (8 - depth) * 2;
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
        ctx.globalAlpha = this.opacity * (0.5 + depth * 0.1);
        
        // Color variation by depth
        const hue = (depth * 30 + this.windEffect) % 360;
        ctx.strokeStyle = `hsl(${hue}, 60%, 50%)`;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(actualEndX, actualEndY);
        ctx.stroke();
        ctx.restore();

        if (growthFactor >= 1) {
            // Draw child branches
            const newLength = length * this.branchRatio;
            const leftAngle = actualAngle - this.branchAngle;
            const rightAngle = actualAngle + this.branchAngle;
            
            this.drawBranch(ctx, endX, endY, leftAngle, newLength, depth - 1, audioGrowth);
            this.drawBranch(ctx, endX, endY, rightAngle, newLength, depth - 1, audioGrowth);
        }
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
