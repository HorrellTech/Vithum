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

        // Video area properties
        this.videoArea = {
            x: 320,
            y: 180,
            width: 1280,
            height: 720,
            visible: false
        };

        // Snap settings
        this.snapDistance = 20; // Distance in pixels to trigger snap
        this.showSnapGuides = true; // Show visual guides when snapping

        this.isDraggingVideoArea = false;
        this.isResizingVideoArea = false;
        this.videoAreaHandle = null;

        this.lastClickedVisualizers = []; // Track visualizers at last click position
        this.currentSelectionIndex = 0; // Current index in selection cycle
        this.lastClickTime = 0; // For detecting rapid clicks
        this.clickCycleTimeout = null; // Timeout for resetting cycle

        this.setupCanvas();
        this.bindEvents();
        this.animate();
    }

    setupCanvas() {
        this.resizeCanvas();

        // Initialize video area button state since it's now hidden by default
        const button = document.getElementById('toggleVideoArea');
        if (button) {
            button.classList.remove('active');  // Changed from add to remove
            button.innerHTML = '<i class="fas fa-video"></i> Show Area';  // Changed text
        }
    }

    resizeCanvas() {
        // Get the desired canvas dimensions from the UI
        const canvasWidth = parseInt(document.getElementById('canvasWidth').value);
        const canvasHeight = parseInt(document.getElementById('canvasHeight').value);

        // Set the actual canvas size
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Set the display size to fit within the container while maintaining aspect ratio
        const container = this.wrapper;
        const containerRect = container.getBoundingClientRect();

        const containerWidth = containerRect.width - 40; // Leave some padding
        const containerHeight = containerRect.height - 40;

        const scale = Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight);

        this.canvas.style.width = (canvasWidth * scale) + 'px';
        this.canvas.style.height = (canvasHeight * scale) + 'px';

        // Store the display scale for coordinate calculations
        this.displayScale = scale;
    }

    bindEvents() {
        // Mouse events - bind to document for better drag handling
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Drag and drop
        this.canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        // Canvas size controls
        document.getElementById('canvasWidth').addEventListener('change', () => this.resizeCanvas());
        document.getElementById('canvasHeight').addEventListener('change', () => this.resizeCanvas());

        // Video area controls
        document.getElementById('videoAreaWidth').addEventListener('change', () => this.updateVideoAreaSize());
        document.getElementById('videoAreaHeight').addEventListener('change', () => this.updateVideoAreaSize());
        document.getElementById('toggleVideoArea').addEventListener('click', () => this.toggleVideoArea());
        document.getElementById('centerVideoArea').addEventListener('click', () => this.centerVideoArea());
    } getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Get raw canvas coordinates
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Account for zoom and pan transformations
        return {
            x: (canvasX / this.zoom) - this.panX,
            y: (canvasY / this.zoom) - this.panY
        };
    }

    handleMouseDown(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        this.lastMousePos = mousePos;

        console.log('Mouse down at:', mousePos);

        // Check for resize handles first (highest priority)
        if (this.selectedVisualizer) {
            const handle = this.getResizeHandle(mousePos);
            if (handle) {
                console.log('Resize handle clicked:', handle);
                this.isResizing = true;
                this.resizeHandle = handle;
                this.canvas.style.cursor = handle + '-resize';
                return;
            }

            // Check for rotation handle
            if (this.isRotationHandle(mousePos)) {
                console.log('Rotation handle clicked');
                this.isRotating = true;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }

        // Handle visualizer selection with cycling (SECOND PRIORITY - before video area)
        const clickedVisualizer = this.handleVisualizerSelection(mousePos);

        if (clickedVisualizer) {
            console.log('Visualizer selected:', clickedVisualizer.constructor.name);
            this.isDragging = true;
            const bounds = clickedVisualizer.getBounds();
            this.dragOffset = {
                x: mousePos.x - bounds.x,
                y: mousePos.y - bounds.y
            };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Check for video area interaction (THIRD PRIORITY - only if no visualizers)
        if (this.videoArea.visible) {
            const videoHandle = this.getVideoAreaResizeHandle(mousePos);
            if (videoHandle) {
                this.isResizingVideoArea = true;
                this.videoAreaHandle = videoHandle;
                this.canvas.style.cursor = videoHandle + '-resize';
                return;
            }

            if (this.isPointInVideoArea(mousePos.x, mousePos.y)) {
                this.isDraggingVideoArea = true;
                this.dragOffset = {
                    x: mousePos.x - this.videoArea.x,
                    y: mousePos.y - this.videoArea.y
                };
                this.canvas.style.cursor = 'move';
                return;
            }
        }

        console.log('Canvas clicked, no visualizer');
        // Start canvas panning if nothing else was clicked (LOWEST PRIORITY)
        this.isPanning = true;
        this.canvas.style.cursor = 'grab';
    }

    handleMouseMove(e) {
        // Only process if we're actively interacting or mouse is over canvas
        const isOverCanvas = e.target === this.canvas;
        const isInteracting = this.isDragging || this.isResizing || this.isRotating || this.isPanning || this.isDraggingVideoArea || this.isResizingVideoArea;

        if (!isOverCanvas && !isInteracting) {
            return;
        }

        e.preventDefault();
        const mousePos = this.getMousePos(e);

        if (this.isDraggingVideoArea) {
            // Move video area
            this.videoArea.x = mousePos.x - this.dragOffset.x;
            this.videoArea.y = mousePos.y - this.dragOffset.y;
        } else if (this.isResizingVideoArea) {
            // Resize video area
            this.handleVideoAreaResize(mousePos);
        } else if (this.isDragging && this.selectedVisualizer) {
            // Move visualizer with snapping
            let newX = mousePos.x - this.dragOffset.x;
            let newY = mousePos.y - this.dragOffset.y;

            // Apply snap-to-center logic
            const snapResult = this.getSnapPosition(newX, newY);
            if (snapResult.snapped) {
                newX = snapResult.x;
                newY = snapResult.y;
                this.isSnapping = true;
            } else {
                this.isSnapping = false;
            }

            this.selectedVisualizer.x = newX;
            this.selectedVisualizer.y = newY;
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

        // Only update cursor when over canvas
        if (isOverCanvas) {
            this.updateCursor(mousePos);
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isPanning = false;
        this.isDraggingVideoArea = false;
        this.isResizingVideoArea = false;
        this.resizeHandle = null;
        this.videoAreaHandle = null;
        this.isSnapping = false; // Reset snapping state
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
                    this.updatePropertiesPanel(this.selectedVisualizer);
                    break;
                case 'ArrowDown':
                    this.selectedVisualizer.move(0, e.shiftKey ? 10 : 1);
                    this.updatePropertiesPanel(this.selectedVisualizer);
                    break;
                case 'ArrowLeft':
                    this.selectedVisualizer.move(e.shiftKey ? -10 : -1, 0);
                    this.updatePropertiesPanel(this.selectedVisualizer);
                    break;
                case 'ArrowRight':
                    this.selectedVisualizer.move(e.shiftKey ? 10 : 1, 0);
                    this.updatePropertiesPanel(this.selectedVisualizer);
                    break;
                case 'Tab':
                    e.preventDefault();
                    // Cycle through overlapping visualizers
                    this.cycleSelection(e.shiftKey ? -1 : 1);
                    break;
                case 'v':
                case 'V':
                    e.preventDefault();
                    this.toggleVisualizerVisibility(this.selectedVisualizer);
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    this.toggleVisualizerSelectable(this.selectedVisualizer);
                    break;
                case 'Escape':
                    this.selectVisualizer(null);
                    this.resetClickCycle();
                    break;
            }
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => { }
            };
            this.handleMouseDown(mouseEvent);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => { } });
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp({});
    }

    getSnapPosition(x, y) {
        const visualizer = this.selectedVisualizer;
        if (!visualizer) return { snapped: false, x, y };

        // Get viewport center (accounting for current zoom and pan)
        const viewportCenterX = this.canvas.width / 2;
        const viewportCenterY = this.canvas.height / 2;

        // Get visualizer center when positioned at x, y
        const visualizerCenterX = x + visualizer.width / 2;
        const visualizerCenterY = y + visualizer.height / 2;

        // Calculate distance from visualizer center to viewport center
        const distanceX = Math.abs(visualizerCenterX - viewportCenterX);
        const distanceY = Math.abs(visualizerCenterY - viewportCenterY);

        let snappedX = x;
        let snappedY = y;
        let snapped = false;

        // Snap to center horizontally
        if (distanceX <= this.snapDistance) {
            snappedX = viewportCenterX - visualizer.width / 2;
            snapped = true;
        }

        // Snap to center vertically
        if (distanceY <= this.snapDistance) {
            snappedY = viewportCenterY - visualizer.height / 2;
            snapped = true;
        }

        return {
            snapped,
            x: snappedX,
            y: snappedY,
            snappedX: distanceX <= this.snapDistance,
            snappedY: distanceY <= this.snapDistance
        };
    }

    bindPropertyEvents(visualizer) {
        const inputs = document.querySelectorAll('#propertiesContent .property-input');

        inputs.forEach(input => {
            const category = input.getAttribute('data-category');
            const property = input.getAttribute('data-property');

            if (category && property) {
                const updateProperty = () => {
                    let value = input.type === 'checkbox' ? input.checked : input.value;

                    // Convert string values to appropriate types
                    if (input.type === 'number' || input.type === 'range') {
                        value = parseFloat(value);
                    }

                    visualizer.updateProperty(category, property, value);

                    // Update range display values
                    const rangeValue = input.parentNode.querySelector('.range-value');
                    if (rangeValue && input.type === 'range') {
                        if (property === 'opacity' || property === 'smoothing') {
                            rangeValue.textContent = Math.round(value * 100) + '%';
                        } else {
                            rangeValue.textContent = value;
                        }
                    }
                };

                input.addEventListener('change', updateProperty);
                input.addEventListener('input', updateProperty);
            }
        });
    }

    toggleVisualizerVisibility(visualizer) {
        visualizer.visible = !visualizer.visible;
        this.updatePropertiesPanel(visualizer);

        // Show notification
        if (window.app) {
            window.app.showNotification(
                'Visibility Changed',
                `${visualizer.constructor.name} is now ${visualizer.visible ? 'visible' : 'hidden'}`,
                'info',
                2000
            );
        }
    }

    toggleVisualizerSelectable(visualizer) {
        visualizer.selectable = !visualizer.selectable;
        this.updatePropertiesPanel(visualizer);

        // If making non-selectable and it's currently selected, deselect it
        if (!visualizer.selectable && this.selectedVisualizer === visualizer) {
            this.selectVisualizer(null);
        }

        // Show notification
        if (window.app) {
            window.app.showNotification(
                'Selection Lock Changed',
                `${visualizer.constructor.name} is now ${visualizer.selectable ? 'selectable' : 'locked'}`,
                'info',
                2000
            );
        }
    }

    // Update the getVisualizersAt method to respect selectable property
    getVisualizersAt(x, y) {
        // Get all visualizers that contain the point and are selectable, ordered from front to back
        const visualizersAtPoint = [];

        // Check in reverse order (front to back in rendering order)
        for (let i = this.visualizers.length - 1; i >= 0; i--) {
            if (this.visualizers[i].containsPoint(x, y) && this.visualizers[i].selectable) {
                visualizersAtPoint.push({
                    visualizer: this.visualizers[i],
                    index: i
                });
            }
        }

        return visualizersAtPoint;
    }

    // Add method to bring visualizer to front
    bringToFront(visualizer) {
        const index = this.visualizers.indexOf(visualizer);
        if (index > -1) {
            // Remove from current position
            this.visualizers.splice(index, 1);
            // Add to end (front)
            this.visualizers.push(visualizer);
            console.log(`Brought ${visualizer.constructor.name} to front`);
        }
    }

    // Add method to send visualizer to back
    sendToBack(visualizer) {
        const index = this.visualizers.indexOf(visualizer);
        if (index > -1) {
            // Remove from current position
            this.visualizers.splice(index, 1);
            // Add to beginning (back)
            this.visualizers.unshift(visualizer);
            console.log(`Sent ${visualizer.constructor.name} to back`);
        }
    }

    getVisualizerAt(x, y) {
        // This is now a wrapper for backwards compatibility
        const visualizers = this.getVisualizersAt(x, y);
        return visualizers.length > 0 ? visualizers[0].visualizer : null;
    }

    handleVisualizerSelection(mousePos) {
        const currentTime = Date.now();
        const visualizersAtPoint = this.getVisualizersAt(mousePos.x, mousePos.y);

        if (visualizersAtPoint.length === 0) {
            // No visualizers at this point
            this.selectVisualizer(null);
            this.resetClickCycle();
            return null;
        }

        // Check if this is the same click position as last time
        const isSamePosition = this.lastClickedVisualizers.length > 0 &&
            this.arraysEqual(
                visualizersAtPoint.map(v => v.visualizer.id),
                this.lastClickedVisualizers.map(v => v.visualizer.id)
            );

        // Check if this is a rapid click (within 500ms)
        const isRapidClick = currentTime - this.lastClickTime < 500;

        if (isSamePosition && isRapidClick && visualizersAtPoint.length > 1) {
            // Cycle to next visualizer
            this.currentSelectionIndex = (this.currentSelectionIndex + 1) % visualizersAtPoint.length;
            console.log(`Cycling selection: ${this.currentSelectionIndex + 1}/${visualizersAtPoint.length}`);

            // Show cycling indicator
            this.showCyclingIndicator(visualizersAtPoint);
        } else {
            // New click position or not rapid click - start fresh
            this.currentSelectionIndex = 0;
            this.lastClickedVisualizers = visualizersAtPoint;

            if (visualizersAtPoint.length > 1) {
                console.log(`Multiple visualizers found: ${visualizersAtPoint.length}`);
                this.showCyclingIndicator(visualizersAtPoint);
            }
        }

        this.lastClickTime = currentTime;

        // Select the visualizer at current index
        const selectedVisualizer = visualizersAtPoint[this.currentSelectionIndex].visualizer;
        this.selectVisualizer(selectedVisualizer);

        // Reset cycle after 2 seconds of no clicks
        this.resetClickCycleTimeout();

        return selectedVisualizer;
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    }

    showCyclingIndicator(visualizersAtPoint) {
        if (visualizersAtPoint.length <= 1) return;

        // Show a temporary indicator of cycling
        const currentViz = visualizersAtPoint[this.currentSelectionIndex].visualizer;
        const lockStatus = currentViz.selectable ? '' : ' (Locked)';
        const visStatus = currentViz.visible ? '' : ' (Hidden)';
        const message = `${this.currentSelectionIndex + 1}/${visualizersAtPoint.length}: ${currentViz.constructor.name}${lockStatus}${visStatus}`;

        // Remove existing cycling notification
        const existingNotification = document.querySelector('.cycling-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new cycling notification
        const notification = document.createElement('div');
        notification.className = 'cycling-notification';
        notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 212, 255, 0.9);
        color: black;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10001;
        pointer-events: none;
        transition: opacity 0.2s ease;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 200);
            }
        }, 2000);
    }

    resetClickCycle() {
        this.lastClickedVisualizers = [];
        this.currentSelectionIndex = 0;
        this.clearClickCycleTimeout();

        // Remove cycling notification
        const notification = document.querySelector('.cycling-notification');
        if (notification) {
            notification.remove();
        }
    }

    resetClickCycleTimeout() {
        this.clearClickCycleTimeout();
        this.clickCycleTimeout = setTimeout(() => {
            this.resetClickCycle();
        }, 2000);
    }

    clearClickCycleTimeout() {
        if (this.clickCycleTimeout) {
            clearTimeout(this.clickCycleTimeout);
            this.clickCycleTimeout = null;
        }
    }

    // Add method to manually cycle through visualizers with keyboard
    cycleSelection(direction = 1) {
        if (this.lastClickedVisualizers.length <= 1) return;

        if (direction > 0) {
            this.currentSelectionIndex = (this.currentSelectionIndex + 1) % this.lastClickedVisualizers.length;
        } else {
            this.currentSelectionIndex = (this.currentSelectionIndex - 1 + this.lastClickedVisualizers.length) % this.lastClickedVisualizers.length;
        }

        const selectedVisualizer = this.lastClickedVisualizers[this.currentSelectionIndex].visualizer;
        this.selectVisualizer(selectedVisualizer);
        this.showCyclingIndicator(this.lastClickedVisualizers);
        this.resetClickCycleTimeout();
    }

    handleMouseDown(e) {
        e.preventDefault();
        const mousePos = this.getMousePos(e);
        this.lastMousePos = mousePos;

        console.log('Mouse down at:', mousePos);

        // Check for resize handles first (highest priority)
        if (this.selectedVisualizer) {
            const handle = this.getResizeHandle(mousePos);
            if (handle) {
                console.log('Resize handle clicked:', handle);
                this.isResizing = true;
                this.resizeHandle = handle;
                this.canvas.style.cursor = handle + '-resize';
                return;
            }

            // Check for rotation handle
            if (this.isRotationHandle(mousePos)) {
                console.log('Rotation handle clicked');
                this.isRotating = true;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }

        // Handle visualizer selection with cycling (SECOND PRIORITY - before video area)
        const clickedVisualizer = this.handleVisualizerSelection(mousePos);

        if (clickedVisualizer) {
            console.log('Visualizer selected:', clickedVisualizer.constructor.name);
            this.isDragging = true;
            const bounds = clickedVisualizer.getBounds();
            this.dragOffset = {
                x: mousePos.x - bounds.x,
                y: mousePos.y - bounds.y
            };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Check for video area interaction (THIRD PRIORITY - only if no visualizers)
        // Only allow interaction when video area is visible
        if (this.videoArea.visible) {
            const videoHandle = this.getVideoAreaResizeHandle(mousePos);
            if (videoHandle) {
                this.isResizingVideoArea = true;
                this.videoAreaHandle = videoHandle;
                this.canvas.style.cursor = videoHandle + '-resize';
                return;
            }

            if (this.isPointInVideoArea(mousePos.x, mousePos.y)) {
                this.isDraggingVideoArea = true;
                this.dragOffset = {
                    x: mousePos.x - this.videoArea.x,
                    y: mousePos.y - this.videoArea.y
                };
                this.canvas.style.cursor = 'move';
                return;
            }
        }

        console.log('Canvas clicked, no visualizer');
        // Start canvas panning if nothing else was clicked (LOWEST PRIORITY)
        this.isPanning = true;
        this.canvas.style.cursor = 'grab';
    }

    handleMouseMove(e) {
        // Only process if we're actively interacting or mouse is over canvas
        const isOverCanvas = e.target === this.canvas;
        const isInteracting = this.isDragging || this.isResizing || this.isRotating || this.isPanning || this.isDraggingVideoArea || this.isResizingVideoArea;

        if (!isOverCanvas && !isInteracting) {
            return;
        }

        e.preventDefault();
        const mousePos = this.getMousePos(e);

        if (this.isDraggingVideoArea) {
            // Move video area
            this.videoArea.x = mousePos.x - this.dragOffset.x;
            this.videoArea.y = mousePos.y - this.dragOffset.y;
        } else if (this.isResizingVideoArea) {
            // Resize video area
            this.handleVideoAreaResize(mousePos);
        } else if (this.isDragging && this.selectedVisualizer) {
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

        // Only update cursor when over canvas
        if (isOverCanvas) {
            this.updateCursor(mousePos);
        }
    } handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isPanning = false;
        this.isDraggingVideoArea = false;
        this.isResizingVideoArea = false;
        this.resizeHandle = null;
        this.videoAreaHandle = null;
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
                case 'Tab':
                    e.preventDefault();
                    // Cycle through overlapping visualizers
                    this.cycleSelection(e.shiftKey ? -1 : 1);
                    break;
                case 'Escape':
                    this.selectVisualizer(null);
                    this.resetClickCycle();
                    break;
            }
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => { }
            };
            this.handleMouseDown(mouseEvent);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => { } });
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
        // Remove selection from current visualizer
        if (this.selectedVisualizer) {
            this.selectedVisualizer.setSelected(false);
        }

        this.selectedVisualizer = visualizer;

        if (visualizer) {
            visualizer.setSelected(true);
            this.updatePropertiesPanel(visualizer);
            this.hideDropZone();
            console.log('Selected visualizer:', visualizer.constructor.name, 'ID:', visualizer.id);
        } else {
            this.showNoSelection();
            if (this.visualizers.length === 0) {
                this.showDropZone();
            }
            this.resetClickCycle();
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
    } updateAudioData(audioData, frequencyData) {
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
            { name: 'nw', x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 'ne', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 'sw', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { name: 'se', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { name: 'n', x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 's', x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { name: 'w', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
            { name: 'e', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 }
        ];

        console.log('Checking resize handles for mouse at:', mousePos);
        console.log('Visualizer bounds:', bounds);
        console.log('Handle positions:', handles);

        for (const handle of handles) {
            const isInHandle = Utils.pointInRect(mousePos.x, mousePos.y, handle.x, handle.y, handleSize, handleSize);
            if (isInHandle) {
                console.log('Found handle:', handle.name);
                return handle.name;
            }
        }

        return null;
    }

    isRotationHandle(mousePos) {
        if (!this.selectedVisualizer) return false;

        const bounds = this.selectedVisualizer.getBounds();
        const handleX = bounds.x + bounds.width / 2;
        const handleY = bounds.y - 24;

        return Utils.pointInCircle(mousePos.x, mousePos.y, handleX, handleY, 8);
    } handleResize(mousePos) {
        if (!this.selectedVisualizer || !this.resizeHandle) return;

        console.log('Handling resize with handle:', this.resizeHandle);
        console.log('Mouse position:', mousePos);
        console.log('Last mouse position:', this.lastMousePos);

        const bounds = this.selectedVisualizer.getBounds();
        const dx = mousePos.x - this.lastMousePos.x;
        const dy = mousePos.y - this.lastMousePos.y;

        console.log('Delta:', { dx, dy });

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

        console.log('New dimensions:', { newX, newY, newWidth, newHeight });

        this.selectedVisualizer.x = newX;
        this.selectedVisualizer.y = newY;
        this.selectedVisualizer.resize(newWidth, newHeight);
        this.updatePropertiesPanel();
    }

    handleRotation(mousePos) {
        if (!this.selectedVisualizer) return;

        const center = this.selectedVisualizer.getCenter();
        const angle = Utils.toDegrees(Utils.angle(center.x, center.y, mousePos.x, mousePos.y)); this.selectedVisualizer.rotate(angle);
        this.updatePropertiesPanel();
    }

    handleVideoAreaResize(mousePos) {
        if (!this.videoAreaHandle) return;

        const bounds = this.getVideoAreaBounds();
        const dx = mousePos.x - this.lastMousePos.x;
        const dy = mousePos.y - this.lastMousePos.y;

        let newWidth = bounds.width;
        let newHeight = bounds.height;
        let newX = this.videoArea.x;
        let newY = this.videoArea.y;

        switch (this.videoAreaHandle) {
            case 'se':
                newWidth = Math.max(400, bounds.width + dx);
                newHeight = Math.max(300, bounds.height + dy);
                break;
            case 'sw':
                newWidth = Math.max(400, bounds.width - dx);
                newHeight = Math.max(300, bounds.height + dy);
                newX = this.videoArea.x + dx;
                break;
            case 'ne':
                newWidth = Math.max(400, bounds.width + dx);
                newHeight = Math.max(300, bounds.height - dy);
                newY = this.videoArea.y + dy;
                break;
            case 'nw':
                newWidth = Math.max(400, bounds.width - dx);
                newHeight = Math.max(300, bounds.height - dy);
                newX = this.videoArea.x + dx;
                newY = this.videoArea.y + dy;
                break;
            case 'n':
                newHeight = Math.max(300, bounds.height - dy);
                newY = this.videoArea.y + dy;
                break;
            case 's':
                newHeight = Math.max(300, bounds.height + dy);
                break;
            case 'w':
                newWidth = Math.max(400, bounds.width - dx);
                newX = this.videoArea.x + dx;
                break;
            case 'e':
                newWidth = Math.max(400, bounds.width + dx);
                break;
        }

        this.videoArea.x = newX;
        this.videoArea.y = newY;
        this.videoArea.width = newWidth;
        this.videoArea.height = newHeight;

        // Update the input fields
        document.getElementById('videoAreaWidth').value = newWidth;
        document.getElementById('videoAreaHeight').value = newHeight;
    }

    updateCursor(mousePos) {
        // Check video area interactions first - only when visible
        if (this.videoArea.visible) {
            const videoHandle = this.getVideoAreaResizeHandle(mousePos);
            if (videoHandle) {
                this.canvas.style.cursor = videoHandle + '-resize';
                return;
            }

            if (this.isPointInVideoArea(mousePos.x, mousePos.y)) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }

        // Check visualizer interactions
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

    updatePropertiesPanel(visualizer) {
        const content = document.getElementById('propertiesContent');

        if (!visualizer) {
            this.showNoSelection();
            return;
        }

        const properties = visualizer.getProperties();

        content.innerHTML = `
        <div class="property-group">
            <h4>Layer Management</h4>
            <div class="property-item">
                <div class="layer-controls">
                    <button class="btn-small" id="bringToFront">
                        <i class="fas fa-arrow-up"></i> Bring to Front
                    </button>
                    <button class="btn-small" id="sendToBack">
                        <i class="fas fa-arrow-down"></i> Send to Back
                    </button>
                </div>
            </div>
            <div class="property-item">
                <div class="visibility-controls">
                    <button class="btn-small ${visualizer.visible ? 'active' : ''}" id="toggleVisibility">
                        <i class="fas fa-${visualizer.visible ? 'eye' : 'eye-slash'}"></i> 
                        ${visualizer.visible ? 'Visible' : 'Hidden'}
                    </button>
                    <button class="btn-small ${visualizer.selectable ? 'active' : ''}" id="toggleSelectable">
                        <i class="fas fa-${visualizer.selectable ? 'hand-pointer' : 'ban'}"></i> 
                        ${visualizer.selectable ? 'Selectable' : 'Locked'}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="property-group">
            <h4>Position</h4>
            <div class="property-item">
                <label class="property-label">X</label>
                <input type="number" class="property-input" value="${Math.round(properties.position.x)}" 
                       data-category="position" data-property="x">
            </div>
            <div class="property-item">
                <label class="property-label">Y</label>
                <input type="number" class="property-input" value="${Math.round(properties.position.y)}" 
                       data-category="position" data-property="y">
            </div>
        </div>
        
        <div class="property-group">
            <h4>Size</h4>
            <div class="property-item">
                <label class="property-label">Width</label>
                <input type="number" class="property-input" value="${Math.round(properties.size.width)}" 
                       data-category="size" data-property="width" min="50">
            </div>
            <div class="property-item">
                <label class="property-label">Height</label>
                <input type="number" class="property-input" value="${Math.round(properties.size.height)}" 
                       data-category="size" data-property="height" min="50">
            </div>
        </div>
        
        <div class="property-group">
            <h4>Transform</h4>
            <div class="property-item">
                <label class="property-label">Rotation</label>
                <input type="number" class="property-input" value="${Math.round(properties.transform.rotation)}" 
                       data-category="transform" data-property="rotation" min="-180" max="180">
            </div>
            <div class="property-row">
                <div class="property-item">
                    <label class="property-label">Scale X</label>
                    <input type="number" class="property-input" value="${properties.transform.scaleX}" 
                           data-category="transform" data-property="scaleX" min="0.1" max="5" step="0.1">
                </div>
                <div class="property-item">
                    <label class="property-label">Scale Y</label>
                    <input type="number" class="property-input" value="${properties.transform.scaleY}" 
                           data-category="transform" data-property="scaleY" min="0.1" max="5" step="0.1">
                </div>
            </div>
        </div>
        
        <div class="property-group">
            <h4>Appearance</h4>
            <div class="property-item">
                <label class="property-label">Color</label>
                <input type="color" class="property-input property-color" value="${properties.appearance.color}" 
                       data-category="appearance" data-property="color">
            </div>
            <div class="property-item">
                <label class="property-label">Stroke Width</label>
                <input type="number" class="property-input" value="${properties.appearance.strokeWidth}" 
                       data-category="appearance" data-property="strokeWidth" min="1" max="20">
            </div>
            <div class="property-item">
                <label class="property-label">Opacity</label>
                <input type="range" class="property-input property-range" value="${properties.appearance.opacity}" 
                       data-category="appearance" data-property="opacity" min="0" max="1" step="0.1">
                <span class="range-value">${Math.round(properties.appearance.opacity * 100)}%</span>
            </div>
        </div>
        
        <div class="property-group">
            <h4>Audio</h4>
            <div class="property-item">
                <label class="property-label">
                    <input type="checkbox" ${properties.audio.reactToAudio ? 'checked' : ''} 
                           data-category="audio" data-property="reactToAudio"> 
                    React to Audio
                </label>
            </div>
            <div class="property-item">
                <label class="property-label">Sensitivity</label>
                <input type="range" class="property-input property-range" value="${properties.audio.sensitivity}" 
                       data-category="audio" data-property="sensitivity" min="0.1" max="5" step="0.1">
                <span class="range-value">${properties.audio.sensitivity}</span>
            </div>
            <div class="property-item">
                <label class="property-label">Smoothing</label>
                <input type="range" class="property-input property-range" value="${properties.audio.smoothing}" 
                       data-category="audio" data-property="smoothing" min="0" max="1" step="0.1">
                <span class="range-value">${Math.round(properties.audio.smoothing * 100)}%</span>
            </div>
        </div>
        
        <div class="property-group">
            <h4>Keyboard Shortcuts</h4>
            <div class="shortcuts-info">
                <div class="shortcut-item">
                    <kbd>Tab</kbd> <span>Cycle through overlapping visualizers</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Shift</kbd> + <kbd>Tab</kbd> <span>Cycle backwards</span>
                </div>
                <div class="shortcut-item">
                    <kbd>V</kbd> <span>Toggle visibility</span>
                </div>
                <div class="shortcut-item">
                    <kbd>L</kbd> <span>Toggle selectable/lock</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Esc</kbd> <span>Deselect</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Del</kbd> <span>Delete selected</span>
                </div>
            </div>
        </div>
    `;

        // Bind layer management events
        const bringToFrontBtn = document.getElementById('bringToFront');
        const sendToBackBtn = document.getElementById('sendToBack');
        const toggleVisibilityBtn = document.getElementById('toggleVisibility');
        const toggleSelectableBtn = document.getElementById('toggleSelectable');

        if (bringToFrontBtn) {
            bringToFrontBtn.addEventListener('click', () => {
                this.bringToFront(visualizer);
            });
        }

        if (sendToBackBtn) {
            sendToBackBtn.addEventListener('click', () => {
                this.sendToBack(visualizer);
            });
        }

        if (toggleVisibilityBtn) {
            toggleVisibilityBtn.addEventListener('click', () => {
                this.toggleVisualizerVisibility(visualizer);
            });
        }

        if (toggleSelectableBtn) {
            toggleSelectableBtn.addEventListener('click', () => {
                this.toggleVisualizerSelectable(visualizer);
            });
        }

        // Bind property change events
        this.bindPropertyEvents(visualizer);
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
        this.setZoom(1); this.panX = 0;
        this.panY = 0;
    }

    // Video area management
    updateVideoAreaSize() {
        this.videoArea.width = parseInt(document.getElementById('videoAreaWidth').value);
        this.videoArea.height = parseInt(document.getElementById('videoAreaHeight').value);
    }

    toggleVideoArea() {
        this.videoArea.visible = !this.videoArea.visible;
        const button = document.getElementById('toggleVideoArea');
        if (this.videoArea.visible) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-video"></i> Hide Area';
        } else {
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-video"></i> Show Area';
        }
    }

    centerVideoArea() {
        this.videoArea.x = (this.canvas.width - this.videoArea.width) / 2;
        this.videoArea.y = (this.canvas.height - this.videoArea.height) / 2;
    }

    getVideoAreaBounds() {
        return {
            x: this.videoArea.x,
            y: this.videoArea.y,
            width: this.videoArea.width,
            height: this.videoArea.height
        };
    }

    isPointInVideoArea(x, y) {
        const bounds = this.getVideoAreaBounds();
        return Utils.pointInRect(x, y, bounds.x, bounds.y, bounds.width, bounds.height);
    }

    getVideoAreaResizeHandle(mousePos) {
        if (!this.videoArea.visible) return null;

        const bounds = this.getVideoAreaBounds();
        const handleSize = 8;
        const handles = [
            { name: 'se', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { name: 'sw', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { name: 'ne', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 'nw', x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 'e', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
            { name: 'w', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
            { name: 'n', x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 },
            { name: 's', x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 }
        ];

        for (const handle of handles) {
            const isInHandle = Utils.pointInRect(mousePos.x, mousePos.y, handle.x, handle.y, handleSize, handleSize);
            if (isInHandle) {
                return handle.name;
            }
        }

        return null;
    }

    render() {
        // Clear canvas
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply zoom and pan
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX, this.panY);

        // Always render video area FIRST (behind visualizers) - whether visible or not
        this.renderVideoArea();

        // Render snap guides if snapping
        if (this.isSnapping && this.showSnapGuides) {
            this.renderSnapGuides();
        }

        // Render visualizers
        this.visualizers.forEach(visualizer => {
            if (visualizer.visible) {
                visualizer.render(this.ctx);

                // Add visual indicator for non-selectable items
                if (!visualizer.selectable) {
                    this.renderLockIndicator(visualizer);
                }
            }
        });

        // Render selection outline and handles (on top)
        if (this.selectedVisualizer) {
            this.renderSelection();
        }

        this.ctx.restore();
    }

    renderSnapGuides() {
        if (!this.selectedVisualizer) return;

        const visualizer = this.selectedVisualizer;
        const viewportCenterX = this.canvas.width / 2;
        const viewportCenterY = this.canvas.height / 2;

        // Get current snap state
        const snapResult = this.getSnapPosition(visualizer.x, visualizer.y);

        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.globalAlpha = 0.8;

        // Vertical center line (when snapping horizontally)
        if (snapResult.snappedX) {
            this.ctx.beginPath();
            this.ctx.moveTo(viewportCenterX, 0);
            this.ctx.lineTo(viewportCenterX, this.canvas.height);
            this.ctx.stroke();

            // Center indicator
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.arc(viewportCenterX, viewportCenterY, 4, 0, 2 * Math.PI);
            this.ctx.fill();

            // Add text label
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CENTER', viewportCenterX, viewportCenterY - 15);
        }

        // Horizontal center line (when snapping vertically)
        if (snapResult.snappedY) {
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(0, viewportCenterY);
            this.ctx.lineTo(this.canvas.width, viewportCenterY);
            this.ctx.stroke();

            // Center indicator (if not already drawn)
            if (!snapResult.snappedX) {
                this.ctx.fillStyle = '#00d4ff';
                this.ctx.globalAlpha = 1;
                this.ctx.beginPath();
                this.ctx.arc(viewportCenterX, viewportCenterY, 4, 0, 2 * Math.PI);
                this.ctx.fill();

                // Add text label
                this.ctx.fillStyle = '#00d4ff';
                this.ctx.font = '12px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('CENTER', viewportCenterX, viewportCenterY - 15);
            }
        }

        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left'; // Reset text alignment
    }

    renderLockIndicator(visualizer) {
        const bounds = visualizer.getBounds();

        // Lock icon in top-right corner
        const iconX = bounds.x + bounds.width - 20;
        const iconY = bounds.y + 10;

        // Background circle
        this.ctx.fillStyle = 'rgba(255, 107, 53, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(iconX, iconY, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // Lock icon (simplified)
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.rect(iconX - 3, iconY - 1, 6, 4);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(iconX, iconY - 2, 2, Math.PI, 0, false);
        this.ctx.stroke();
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
            { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
            { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
            { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 },
            { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
            { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
            { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 }
        ];

        this.ctx.fillStyle = '#00d4ff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });

        // Rotation handle
        const rotHandleX = bounds.x + bounds.width / 2;
        const rotHandleY = bounds.y - 24;

        this.ctx.beginPath();
        this.ctx.arc(rotHandleX, rotHandleY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        // Connection line to rotation handle
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
        this.ctx.lineTo(rotHandleX, rotHandleY); this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    renderVideoArea() {
        const bounds = this.getVideoAreaBounds();

        if (this.videoArea.visible) {
            // Visible video area - existing orange styling
            this.ctx.strokeStyle = '#ff6b35';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            this.ctx.setLineDash([]);

            // Video area label
            this.ctx.fillStyle = '#ff6b35';
            this.ctx.font = '14px Inter, sans-serif';
            this.ctx.fillText(`Video Area (${bounds.width}×${bounds.height})`, bounds.x + 10, bounds.y + 20);

            // Resize handles for visible video area
            const handleSize = 8;
            const handles = [
                { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
                { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
                { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 },
                { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
                { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 }
            ];

            this.ctx.fillStyle = '#ff6b35';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;

            handles.forEach(handle => {
                this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
                this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
            });
        } else {
            // Hidden video area - show faint white outline
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';  // Faint white
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);  // Smaller dashes for subtlety
            this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            this.ctx.setLineDash([]);

            // Optional: Very faint label
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.fillText(`Video Area (${bounds.width}×${bounds.height})`, bounds.x + 10, bounds.y + 20);
        }
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
