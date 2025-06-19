// Canvas management and interaction handling

class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('canvasOverlay');
        this.wrapper = document.getElementById('canvasWrapper');
        this.dropZone = document.getElementById('dropZone');
        
        this.visualizers = [];
        this.selectedVisualizer = null;
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.lastMousePos = { x: 0, y: 0 };
        
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        this.setupCanvas();
        this.bindEvents();
        this.animate();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Enable high DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    resizeCanvas() {
        const container = this.wrapper;
        const rect = container.getBoundingClientRect();
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Update canvas dimensions
        const canvasWidth = parseInt(document.getElementById('canvasWidth').value);
        const canvasHeight = parseInt(document.getElementById('canvasHeight').value);
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
    }

    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Drag and drop
        this.canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Canvas size controls
        document.getElementById('canvasWidth').addEventListener('change', () => this.resizeCanvas());
        document.getElementById('canvasHeight').addEventListener('change', () => this.resizeCanvas());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom - this.panX,
            y: (e.clientY - rect.top) / this.zoom - this.panY
        };
    }

    handleMouseDown(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        this.lastMousePos = mousePos;
        
        // Check for resize handles first
        if (this.selectedVisualizer) {
            const handle = this.getResizeHandle(mousePos);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                return;
            }
            
            // Check for rotation handle
            if (this.isRotationHandle(mousePos)) {
                this.isRotating = true;
                return;
            }
        }
        
        // Check for visualizer selection
        const clickedVisualizer = this.getVisualizerAt(mousePos.x, mousePos.y);
        
        if (clickedVisualizer) {
            this.selectVisualizer(clickedVisualizer);
            this.isDragging = true;
            const bounds = clickedVisualizer.getBounds();
            this.dragOffset = {
                x: mousePos.x - bounds.x,
                y: mousePos.y - bounds.y
            };
        } else {
            this.selectVisualizer(null);
            // Start canvas panning if no visualizer clicked
            this.isPanning = true;
        }
    }

    handleMouseMove(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        
        if (this.isDragging && this.selectedVisualizer) {
            // Move visualizer
            this.selectedVisualizer.x = mousePos.x - this.dragOffset.x;
            this.selectedVisualizer.y = mousePos.y - this.dragOffset.y;
            this.updatePropertiesPanel();
        } else if (this.isResizing && this.selectedVisualizer) {
            // Resize visualizer
            this.handleResize(mousePos);
        } else if (this.isRotating && this.selectedVisualizer) {
            // Rotate visualizer
            this.handleRotation(mousePos);
        } else if (this.isPanning) {
            // Pan canvas
            const dx = mousePos.x - this.lastMousePos.x;
            const dy = mousePos.y - this.lastMousePos.y;
            this.panX += dx;
            this.panY += dy;
        }
        
        this.lastMousePos = mousePos;
        this.updateCursor(mousePos);
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isPanning = false;
        this.resizeHandle = null;
        this.canvas.style.cursor = 'default';
    }

    handleWheel(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        this.zoom = Utils.clamp(this.zoom * zoomFactor, 0.1, 5);
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('active');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('active');
        
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
            const visualizerType = data;
            const mousePos = this.getMousePos(e);
            this.addVisualizer(visualizerType, mousePos.x - 100, mousePos.y - 100);
        }
    }

    handleKeyDown(e) {
        if (this.selectedVisualizer) {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    this.removeVisualizer(this.selectedVisualizer);
                    break;
                case 'ArrowUp':
                    this.selectedVisualizer.move(0, e.shiftKey ? -10 : -1);
                    this.updatePropertiesPanel();
                    break;
                case 'ArrowDown':
                    this.selectedVisualizer.move(0, e.shiftKey ? 10 : 1);
                    this.updatePropertiesPanel();
                    break;
                case 'ArrowLeft':
                    this.selectedVisualizer.move(e.shiftKey ? -10 : -1, 0);
                    this.updatePropertiesPanel();
                    break;
                case 'ArrowRight':
                    this.selectedVisualizer.move(e.shiftKey ? 10 : 1, 0);
                    this.updatePropertiesPanel();
                    break;
                case 'Escape':
                    this.selectVisualizer(null);
                    break;
            }
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp({});
    }

    getVisualizerAt(x, y) {
        // Check in reverse order (top to bottom)
        for (let i = this.visualizers.length - 1; i >= 0; i--) {
            if (this.visualizers[i].containsPoint(x, y)) {
                return this.visualizers[i];
            }
        }
        return null;
    }

    selectVisualizer(visualizer) {
        if (this.selectedVisualizer) {
            this.selectedVisualizer.setSelected(false);
        }
        
        this.selectedVisualizer = visualizer;
        
        if (visualizer) {
            visualizer.setSelected(true);
            this.updatePropertiesPanel();
            this.hideDropZone();
        } else {
            this.showNoSelection();
            if (this.visualizers.length === 0) {
                this.showDropZone();
            }
        }
    }

    addVisualizer(type, x, y, width = 200, height = 200) {
        try {
            const visualizer = VisualizerFactory.create(type, x, y, width, height);
            this.visualizers.push(visualizer);
            this.selectVisualizer(visualizer);
            this.hideDropZone();
            return visualizer;
        } catch (error) {
            console.error('Failed to create visualizer:', error);
        }
    }

    removeVisualizer(visualizer) {
        const index = this.visualizers.indexOf(visualizer);
        if (index > -1) {
            this.visualizers.splice(index, 1);
            if (this.selectedVisualizer === visualizer) {
                this.selectVisualizer(null);
            }
            if (this.visualizers.length === 0) {
                this.showDropZone();
            }
        }
    }

    updateAudioData(audioData, frequencyData) {
        this.visualizers.forEach(visualizer => {
            visualizer.updateAudioData(audioData, frequencyData);
        });
    }

    // Resize handling
    getResizeHandle(mousePos) {
        if (!this.selectedVisualizer) return null;
        
        const bounds = this.selectedVisualizer.getBounds();
        const handleSize = 8;
        const handles = [
            { name: 'nw', x: bounds.x - handleSize/2, y: bounds.y - handleSize/2 },
            { name: 'ne', x: bounds.x + bounds.width - handleSize/2, y: bounds.y - handleSize/2 },
            { name: 'sw', x: bounds.x - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { name: 'se', x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { name: 'n', x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y - handleSize/2 },
            { name: 's', x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { name: 'w', x: bounds.x - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2 },
            { name: 'e', x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2 }
        ];
        
        for (const handle of handles) {
            if (Utils.pointInRect(mousePos.x, mousePos.y, handle.x, handle.y, handleSize, handleSize)) {
                return handle.name;
            }
        }
        
        return null;
    }

    isRotationHandle(mousePos) {
        if (!this.selectedVisualizer) return false;
        
        const bounds = this.selectedVisualizer.getBounds();
        const handleX = bounds.x + bounds.width/2;
        const handleY = bounds.y - 24;
        
        return Utils.pointInCircle(mousePos.x, mousePos.y, handleX, handleY, 8);
    }

    handleResize(mousePos) {
        if (!this.selectedVisualizer || !this.resizeHandle) return;
        
        const bounds = this.selectedVisualizer.getBounds();
        const dx = mousePos.x - this.lastMousePos.x;
        const dy = mousePos.y - this.lastMousePos.y;
        
        let newWidth = bounds.width;
        let newHeight = bounds.height;
        let newX = this.selectedVisualizer.x;
        let newY = this.selectedVisualizer.y;
        
        switch (this.resizeHandle) {
            case 'se':
                newWidth = Math.max(50, bounds.width + dx);
                newHeight = Math.max(50, bounds.height + dy);
                break;
            case 'sw':
                newWidth = Math.max(50, bounds.width - dx);
                newHeight = Math.max(50, bounds.height + dy);
                newX = this.selectedVisualizer.x + dx;
                break;
            case 'ne':
                newWidth = Math.max(50, bounds.width + dx);
                newHeight = Math.max(50, bounds.height - dy);
                newY = this.selectedVisualizer.y + dy;
                break;
            case 'nw':
                newWidth = Math.max(50, bounds.width - dx);
                newHeight = Math.max(50, bounds.height - dy);
                newX = this.selectedVisualizer.x + dx;
                newY = this.selectedVisualizer.y + dy;
                break;
            case 'n':
                newHeight = Math.max(50, bounds.height - dy);
                newY = this.selectedVisualizer.y + dy;
                break;
            case 's':
                newHeight = Math.max(50, bounds.height + dy);
                break;
            case 'w':
                newWidth = Math.max(50, bounds.width - dx);
                newX = this.selectedVisualizer.x + dx;
                break;
            case 'e':
                newWidth = Math.max(50, bounds.width + dx);
                break;
        }
        
        this.selectedVisualizer.x = newX;
        this.selectedVisualizer.y = newY;
        this.selectedVisualizer.resize(newWidth, newHeight);
        this.updatePropertiesPanel();
    }

    handleRotation(mousePos) {
        if (!this.selectedVisualizer) return;
        
        const center = this.selectedVisualizer.getCenter();
        const angle = Utils.toDegrees(Utils.angle(center.x, center.y, mousePos.x, mousePos.y));
        this.selectedVisualizer.rotate(angle);
        this.updatePropertiesPanel();
    }

    updateCursor(mousePos) {
        if (this.selectedVisualizer) {
            const handle = this.getResizeHandle(mousePos);
            if (handle) {
                this.canvas.style.cursor = handle + '-resize';
                return;
            }
            
            if (this.isRotationHandle(mousePos)) {
                this.canvas.style.cursor = 'grab';
                return;
            }
            
            if (this.selectedVisualizer.containsPoint(mousePos.x, mousePos.y)) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        this.canvas.style.cursor = 'default';
    }

    showDropZone() {
        this.dropZone.classList.remove('hidden');
    }

    hideDropZone() {
        this.dropZone.classList.add('hidden');
    }

    updatePropertiesPanel() {
        if (window.app && window.app.ui) {
            window.app.ui.updatePropertiesPanel(this.selectedVisualizer);
        }
    }

    showNoSelection() {
        if (window.app && window.app.ui) {
            window.app.ui.showNoSelection();
        }
    }

    setZoom(zoom) {
        this.zoom = Utils.clamp(zoom, 0.1, 5);
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }

    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }

    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }

    resetZoom() {
        this.setZoom(1);
        this.panX = 0;
        this.panY = 0;
    }

    render() {
        // Clear canvas
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX, this.panY);
        
        // Render visualizers
        this.visualizers.forEach(visualizer => {
            if (visualizer.visible) {
                visualizer.render(this.ctx);
            }
        });
        
        // Render selection outline and handles
        if (this.selectedVisualizer) {
            this.renderSelection();
        }
        
        this.ctx.restore();
    }

    renderSelection() {
        const visualizer = this.selectedVisualizer;
        const bounds = visualizer.getBounds();
        
        // Selection outline
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.ctx.setLineDash([]);
        
        // Resize handles
        const handleSize = 8;
        const handles = [
            { x: bounds.x - handleSize/2, y: bounds.y - handleSize/2 },
            { x: bounds.x + bounds.width - handleSize/2, y: bounds.y - handleSize/2 },
            { x: bounds.x - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y - handleSize/2 },
            { x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y + bounds.height - handleSize/2 },
            { x: bounds.x - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2 },
            { x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2 }
        ];
        
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
        
        // Rotation handle
        const rotHandleX = bounds.x + bounds.width/2;
        const rotHandleY = bounds.y - 24;
        
        this.ctx.beginPath();
        this.ctx.arc(rotHandleX, rotHandleY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Connection line to rotation handle
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width/2, bounds.y);
        this.ctx.lineTo(rotHandleX, rotHandleY);
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // Project management
    serialize() {
        return {
            visualizers: this.visualizers.map(v => v.serialize()),
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        };
    }

    deserialize(data) {
        this.visualizers = [];
        this.selectedVisualizer = null;
        
        if (data.visualizers) {
            data.visualizers.forEach(vData => {
                try {
                    const visualizer = VisualizerFactory.create(
                        vData.type.replace('Visualizer', '').toLowerCase(),
                        vData.x, vData.y, vData.width, vData.height
                    );
                    visualizer.deserialize(vData);
                    this.visualizers.push(visualizer);
                } catch (error) {
                    console.error('Failed to restore visualizer:', error);
                }
            });
        }
        
        if (data.zoom !== undefined) this.setZoom(data.zoom);
        if (data.panX !== undefined) this.panX = data.panX;
        if (data.panY !== undefined) this.panY = data.panY;
        if (data.canvasWidth) document.getElementById('canvasWidth').value = data.canvasWidth;
        if (data.canvasHeight) document.getElementById('canvasHeight').value = data.canvasHeight;
        
        this.resizeCanvas();
        
        if (this.visualizers.length === 0) {
            this.showDropZone();
        } else {
            this.hideDropZone();
        }
    }

    clear() {
        this.visualizers = [];
        this.selectedVisualizer = null;
        this.resetZoom();
        this.showDropZone();
        this.showNoSelection();
    }
}

// Export for use in other files
window.CanvasManager = CanvasManager;
