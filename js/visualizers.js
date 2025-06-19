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
                const normalizedX = (x - this.width / 2) / this.width;
                const normalizedY = (y - this.height / 2) / this.height;

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
        ctx.drawImage(tempCanvas, -this.width / 2, -this.height / 2);

        ctx.restore();
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
        if (this.frequencyData && this.reactToAudio) {
            audioScale = 1 + Utils.average(this.frequencyData) / 255 * this.sensitivity * 0.5;
        }

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        for (let r = this.patternSize; r < maxRadius; r += this.patternSize * 2) {
            for (let angle = 0; angle < 360; angle += 45) {
                const x = Math.cos(Utils.toRadians(angle)) * r * audioScale;
                const y = Math.sin(Utils.toRadians(angle)) * r * audioScale;

                if (this.innerPattern === 'circle') {
                    ctx.beginPath();
                    ctx.arc(x, y, this.patternSize * 0.3, 0, 2 * Math.PI);
                    ctx.fill();
                } else if (this.innerPattern === 'square') {
                    const size = this.patternSize * 0.6;
                    ctx.fillRect(x - size / 2, y - size / 2, size, size);
                }
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
