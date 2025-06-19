// UI management and user interface interactions

class UIManager {
    constructor() {
        this.leftPanelWidth = 280;
        this.rightPanelWidth = 300;
        this.leftPanelCollapsed = false;
        this.rightPanelCollapsed = false;
        this.bottomPanelCollapsed = false;
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.currentCategory = 'all';

        this.initializePanelSizes();
        this.bindEvents();
        this.setupPanelToggles();
        this.setupAudioTimeline();
        this.populateVisualizerLibrary();
        this.initializeDragAndDrop();
    }

    initializePanelSizes() {
        // Set CSS custom properties for panel widths
        document.documentElement.style.setProperty('--left-panel-width', this.leftPanelWidth + 'px');
        document.documentElement.style.setProperty('--right-panel-width', this.rightPanelWidth + 'px');
        
        // Apply initial panel widths
        const leftPanel = document.querySelector('.left-panel');
        const rightPanel = document.querySelector('.right-panel');
        const leftHandle = document.querySelector('.resize-left');
        const rightHandle = document.querySelector('.resize-right');

        if (leftPanel) {
            leftPanel.style.width = this.leftPanelWidth + 'px';
        }
        
        if (rightPanel) {
            rightPanel.style.width = this.rightPanelWidth + 'px';
        }
        
        if (leftHandle) {
            leftHandle.style.left = (this.leftPanelWidth - 2) + 'px';
        }
        
        if (rightHandle) {
            rightHandle.style.right = (this.rightPanelWidth - 2) + 'px';
        }
    }

    bindEvents() {
        // Toolbar buttons
        document.getElementById('newProject').addEventListener('click', () => this.newProject());
        document.getElementById('openProject').addEventListener('click', () => this.openProject());
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        document.getElementById('exportProject').addEventListener('click', () => this.exportProject());

        // Playback controls
        document.getElementById('playPause').addEventListener('click', () => {
            if (window.app && window.app.audio) {
                window.app.audio.togglePlayPause();
            }
        });

        document.getElementById('stop').addEventListener('click', () => {
            if (window.app && window.app.audio) {
                window.app.audio.stop();
            }
        });

        document.getElementById('loadAudio').addEventListener('click', () => {
            document.getElementById('audioFile').click();
        });

        // View controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            if (window.app && window.app.canvas) {
                window.app.canvas.zoomIn();
            }
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            if (window.app && window.app.canvas) {
                window.app.canvas.zoomOut();
            }
        });

        document.getElementById('resetZoom').addEventListener('click', () => {
            if (window.app && window.app.canvas) {
                window.app.canvas.resetZoom();
            }
        });

        // Panel resizing
        this.bindResizeHandles();
    }

    bindResizeHandles() {
        const leftHandle = document.querySelector('.resize-left');
        const rightHandle = document.querySelector('.resize-right');

        if (leftHandle) {
            leftHandle.addEventListener('mousedown', (e) => {
                this.isResizingLeft = true;
                document.addEventListener('mousemove', this.handleLeftResize.bind(this));
                document.addEventListener('mouseup', this.stopResize.bind(this));
                e.preventDefault();
            });
        }

        if (rightHandle) {
            rightHandle.addEventListener('mousedown', (e) => {
                this.isResizingRight = true;
                document.addEventListener('mousemove', this.handleRightResize.bind(this));
                document.addEventListener('mouseup', this.stopResize.bind(this));
                e.preventDefault();
            });
        }
    }

    handleLeftResize(e) {
        if (!this.isResizingLeft || this.leftPanelCollapsed) return;

        const newWidth = Utils.clamp(e.clientX, 200, 400);
        this.leftPanelWidth = newWidth;

        const leftPanel = document.querySelector('.left-panel');
        const leftHandle = document.querySelector('.resize-left');

        leftPanel.style.width = newWidth + 'px';
        leftHandle.style.left = (newWidth - 4) + 'px';
    }

    handleRightResize(e) {
        if (!this.isResizingRight || this.rightPanelCollapsed) return;

        const newWidth = Utils.clamp(window.innerWidth - e.clientX, 200, 500);
        this.rightPanelWidth = newWidth;

        const rightPanel = document.querySelector('.right-panel');
        const rightHandle = document.querySelector('.resize-right');

        rightPanel.style.width = newWidth + 'px';
        rightHandle.style.right = (newWidth - 4) + 'px';
    }

    stopResize() {
        this.isResizingLeft = false;
        this.isResizingRight = false;
        document.removeEventListener('mousemove', this.handleLeftResize);
        document.removeEventListener('mousemove', this.handleRightResize);
        document.removeEventListener('mouseup', this.stopResize);
    }

    initializeDragAndDrop() {
        const visualizerItems = document.querySelectorAll('.visualizer-item');

        visualizerItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const visualizerType = item.getAttribute('data-type');
                e.dataTransfer.setData('text/plain', visualizerType);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            // Double-click to add visualizer
            item.addEventListener('dblclick', () => {
                const visualizerType = item.getAttribute('data-type');
                if (window.app && window.app.canvas) {
                    window.app.canvas.addVisualizer(visualizerType, 400, 300);
                }
            });
        });
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
                    <input type="number" class="property-input" value="${Math.round(properties.size.width)}" min="10"
                           data-category="size" data-property="width">
                </div>
                <div class="property-item">
                    <label class="property-label">Height</label>
                    <input type="number" class="property-input" value="${Math.round(properties.size.height)}" min="10"
                           data-category="size" data-property="height">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Transform</h4>
                <div class="property-item">
                    <label class="property-label">Rotation (°)</label>
                    <input type="number" class="property-input" value="${Math.round(properties.transform.rotation)}" 
                           data-category="transform" data-property="rotation">
                </div>
                <div class="property-row">
                    <div class="property-item">
                        <label class="property-label">Scale X</label>
                        <input type="number" class="property-input" value="${properties.transform.scaleX.toFixed(2)}" step="0.1" min="0.1"
                               data-category="transform" data-property="scaleX">
                    </div>
                    <div class="property-item">
                        <label class="property-label">Scale Y</label>
                        <input type="number" class="property-input" value="${properties.transform.scaleY.toFixed(2)}" step="0.1" min="0.1"
                               data-category="transform" data-property="scaleY">
                    </div>
                </div>
            </div>
            
            <div class="property-group">
                <h4>Appearance</h4>                <div class="property-item">
                    <label class="property-label">Color</label>
                    <input type="color" class="property-input property-color" value="${properties.appearance.color}"
                           data-category="appearance" data-property="color">
                </div>
                <div class="property-item">
                    <label class="property-label">Background</label>
                    <input type="color" class="property-input property-color" value="${properties.appearance.backgroundColor === 'transparent' ? '#000000' : properties.appearance.backgroundColor}"
                           data-category="appearance" data-property="backgroundColor" ${properties.appearance.backgroundColor === 'transparent' ? 'disabled' : ''}>
                </div>
                <div class="property-item">
                    <label class="property-label">Transparent Background</label>
                    <input type="checkbox" class="property-input" ${properties.appearance.backgroundColor === 'transparent' ? 'checked' : ''}
                           data-category="appearance" data-property="transparentBackground">
                </div>
                <div class="property-item">
                    <label class="property-label">Stroke Width</label>
                    <input type="number" class="property-input" value="${properties.appearance.strokeWidth}" min="1" max="20"
                           data-category="appearance" data-property="strokeWidth">
                </div>
                <div class="property-item">
                    <label class="property-label">Opacity</label>
                    <input type="range" class="property-input property-range" value="${properties.appearance.opacity}" min="0" max="1" step="0.01"
                           data-category="appearance" data-property="opacity">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Audio</h4>
                <div class="property-item">
                    <label class="property-label">React to Audio</label>
                    <input type="checkbox" class="property-input" ${properties.audio.reactToAudio ? 'checked' : ''}
                           data-category="audio" data-property="reactToAudio">
                </div>
                <div class="property-item">
                    <label class="property-label">Sensitivity</label>
                    <input type="range" class="property-input property-range" value="${properties.audio.sensitivity}" min="0.1" max="3" step="0.1"
                           data-category="audio" data-property="sensitivity">
                </div>
                <div class="property-item">
                    <label class="property-label">Smoothing</label>
                    <input type="range" class="property-input property-range" value="${properties.audio.smoothing}" min="0" max="1" step="0.1"
                           data-category="audio" data-property="smoothing">
                </div>
            </div>
            
            <div class="property-group">
                <h4>Animation</h4>
                <div class="property-item">
                    <label class="property-label">Speed</label>
                    <input type="range" class="property-input property-range" value="${properties.animation.animationSpeed}" min="0" max="5" step="0.1"
                           data-category="animation" data-property="animationSpeed">
                </div>
                <div class="property-item">
                    <label class="property-label">Pulse Strength</label>
                    <input type="range" class="property-input property-range" value="${properties.animation.pulseStrength}" min="0" max="2" step="0.1"
                           data-category="animation" data-property="pulseStrength">
                </div>
                <div class="property-item">
                    <label class="property-label">Rotate Speed</label>
                    <input type="range" class="property-input property-range" value="${properties.animation.rotateSpeed}" min="0" max="10" step="0.1"
                           data-category="animation" data-property="rotateSpeed">
                </div>
            </div>
        `;

        // Bind property change events
        this.bindPropertyEvents(visualizer);
    } 
    
    populateVisualizerLibrary() {
        const libraryContainer = document.getElementById('visualizerLibrary');
        if (!libraryContainer) return;

        const visualizers = [
            // Basic visualizers
            { type: 'waveform', name: 'Waveform', icon: 'fas fa-wave-square', description: 'Audio waveform display' },
            { type: 'frequency', name: 'Frequency Bars', icon: 'fas fa-chart-bar', description: 'Frequency spectrum bars' },
            { type: 'circle', name: 'Circle', icon: 'fas fa-circle', description: 'Pulsing circle visualizer' },
            { type: 'spiral', name: 'Spiral', icon: 'fas fa-hurricane', description: 'Animated spiral pattern' },
            { type: 'radial', name: 'Radial', icon: 'fas fa-sun', description: 'Radial frequency lines' },
            { type: 'spectrum', name: 'Spectrum', icon: 'fas fa-signal', description: 'Gradient spectrum analyzer' },
            
            // Advanced visualizers
            { type: 'particles', name: 'Particles', icon: 'fas fa-atom', description: 'Animated particle system' },
            { type: 'wave', name: 'Wave Layers', icon: 'fas fa-water', description: 'Layered wave patterns' },
            { type: 'lissajous', name: 'Lissajous', icon: 'fas fa-infinity', description: 'Mathematical curves with trails' },
            { type: 'vortex', name: 'Vortex', icon: 'fas fa-tornado', description: 'Rotating spiral arms' },
            { type: 'plasma', name: 'Plasma', icon: 'fas fa-fire', description: 'Smooth plasma effects' },
            { type: 'network', name: 'Network', icon: 'fas fa-project-diagram', description: 'Connected node network' },
            { type: 'kaleidoscope', name: 'Kaleidoscope', icon: 'fas fa-gem', description: 'Symmetrical kaleidoscope patterns' }
        ];

        libraryContainer.innerHTML = `
            <div class="library-header">
                <h3>Visualizer Library</h3>
                <div class="library-search">
                    <input type="text" id="visualizerSearch" placeholder="Search visualizers..." class="search-input">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="library-categories">
                <button class="category-btn active" data-category="all">All</button>
                <button class="category-btn" data-category="basic">Basic</button>
                <button class="category-btn" data-category="advanced">Advanced</button>
                <button class="category-btn" data-category="effects">Effects</button>
            </div>
            <div class="visualizer-grid" id="visualizerGrid">
                ${visualizers.map(viz => `
                    <div class="visualizer-item" 
                        data-type="${viz.type}" 
                        data-category="${this.getVisualizerCategory(viz.type)}"
                        draggable="true" 
                        title="${viz.description}">
                        <div class="visualizer-preview">
                            <i class="${viz.icon}"></i>
                        </div>
                        <div class="visualizer-info">
                            <span class="visualizer-name">${viz.name}</span>
                            <span class="visualizer-desc">${viz.description}</span>
                        </div>
                        <div class="visualizer-actions">
                            <button class="add-btn" onclick="window.ui.addVisualizerFromLibrary('${viz.type}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Re-initialize drag and drop for new elements
        this.initializeDragAndDrop();
        this.setupLibraryFiltering();
    }

    getVisualizerCategory(type) {
        const categories = {
            'waveform': 'basic',
            'frequency': 'basic', 
            'circle': 'basic',
            'spiral': 'basic',
            'radial': 'basic',
            'spectrum': 'basic',
            'particles': 'advanced',
            'wave': 'advanced',
            'lissajous': 'advanced',
            'vortex': 'advanced',
            'plasma': 'advanced',
            'network': 'advanced',
            'kaleidoscope': 'advanced'
        };
        return categories[type] || 'basic';
    }

    setupLibraryFiltering() {
        const searchInput = document.getElementById('visualizerSearch');
        const categoryBtns = document.querySelectorAll('.category-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterVisualizers(e.target.value, this.currentCategory);
            });
        }

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentCategory = btn.dataset.category;
                this.filterVisualizers(searchInput?.value || '', this.currentCategory);
            });
        });
    }

    getCurrentCategory() {
        const activeBtn = document.querySelector('.category-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    }

    filterVisualizers(searchTerm, category) {
        const visualizerItems = document.querySelectorAll('.visualizer-item');
        let visibleCount = 0;

        visualizerItems.forEach(item => {
            const type = item.dataset.type;
            const name = item.querySelector('.visualizer-name')?.textContent.toLowerCase() || '';
            const description = item.querySelector('.visualizer-desc')?.textContent.toLowerCase() || '';
            const itemCategory = item.dataset.category;

            const matchesSearch = !searchTerm || 
                name.includes(searchTerm.toLowerCase()) || 
                description.includes(searchTerm.toLowerCase()) ||
                type.includes(searchTerm.toLowerCase());

            const matchesCategory = category === 'all' || itemCategory === category;

            if (matchesSearch && matchesCategory) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide no results message
        this.toggleNoResultsMessage(visibleCount === 0);
    }

    toggleNoResultsMessage(show) {
        let noResultsEl = document.querySelector('.no-results');
        
        if (show && !noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.className = 'no-results';
            noResultsEl.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No visualizers found</p>
                <span class="suggestion">Try adjusting your search or category filter</span>
            `;
            document.querySelector('.visualizer-grid').appendChild(noResultsEl);
        } else if (!show && noResultsEl) {
            noResultsEl.remove();
        }
    }

    addVisualizerFromLibrary(type) {
        if (window.app && window.app.canvas) {
            // Add visualizer at center of viewport
            const canvasRect = window.app.canvas.canvas.getBoundingClientRect();
            const x = canvasRect.width / 2;
            const y = canvasRect.height / 2;
            window.app.canvas.addVisualizer(type, x, y);
        }
    }

    bindPropertyEvents(visualizer) {
        const inputs = document.querySelectorAll('#propertiesContent .property-input');

        inputs.forEach(input => {
            const category = input.getAttribute('data-category');
            const property = input.getAttribute('data-property');

            if (category && property) {
                input.addEventListener('change', () => {
                    let value = input.type === 'checkbox' ? input.checked : input.value;

                    // Special handling for transparent background
                    if (property === 'transparentBackground') {
                        const bgColorInput = document.querySelector('[data-property="backgroundColor"]');
                        if (value) {
                            visualizer.updateProperty('appearance', 'backgroundColor', 'transparent');
                            if (bgColorInput) bgColorInput.disabled = true;
                        } else {
                            const defaultColor = bgColorInput ? bgColorInput.value : '#000000';
                            visualizer.updateProperty('appearance', 'backgroundColor', defaultColor);
                            if (bgColorInput) bgColorInput.disabled = false;
                        }
                    } else {
                        visualizer.updateProperty(category, property, value);
                    }
                });

                input.addEventListener('input', () => {
                    let value = input.type === 'checkbox' ? input.checked : input.value;

                    // Special handling for transparent background
                    if (property === 'transparentBackground') {
                        const bgColorInput = document.querySelector('[data-property="backgroundColor"]');
                        if (value) {
                            visualizer.updateProperty('appearance', 'backgroundColor', 'transparent');
                            if (bgColorInput) bgColorInput.disabled = true;
                        } else {
                            const defaultColor = bgColorInput ? bgColorInput.value : '#000000';
                            visualizer.updateProperty('appearance', 'backgroundColor', defaultColor);
                            if (bgColorInput) bgColorInput.disabled = false;
                        }
                    } else {
                        visualizer.updateProperty(category, property, value);
                    }
                });
            }
        });
    }

    showNoSelection() {
        const content = document.getElementById('propertiesContent');
        content.innerHTML = `
            <div class="no-selection">
                <i class="fas fa-mouse-pointer"></i>
                <p>Select a visualizer to edit properties</p>
            </div>
        `;
    }

    // Project management
    newProject() {
        if (confirm('Create a new project? This will clear the current canvas.')) {
            if (window.app && window.app.canvas) {
                window.app.canvas.clear();
            }
            if (window.app && window.app.audio) {
                window.app.audio.stop();
            }
        }
    }

    async openProject() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const text = await Utils.readFileAsText(file);
                        const data = JSON.parse(text);

                        if (window.app && window.app.canvas) {
                            window.app.canvas.deserialize(data);
                        }

                        console.log('Project loaded successfully');
                    } catch (error) {
                        console.error('Failed to load project:', error);
                        alert('Failed to load project file.');
                    }
                }
            };

            input.click();
        } catch (error) {
            console.error('Failed to open project:', error);
        }
    }

    saveProject() {
        try {
            if (window.app && window.app.canvas) {
                const data = window.app.canvas.serialize();
                const json = JSON.stringify(data, null, 2);
                const filename = `vithum_project_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

                Utils.downloadFile(json, filename, 'application/json');
                console.log('Project saved successfully');
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Failed to save project.');
        }
    }

    exportProject() {
        // Show export options dialog
        this.showExportDialog();
    } showExportDialog() {
        // Get default export dimensions from video area if visible, otherwise canvas
        let defaultWidth = 1920;
        let defaultHeight = 1080;

        if (window.app && window.app.canvas && window.app.canvas.videoArea.visible) {
            defaultWidth = window.app.canvas.videoArea.width;
            defaultHeight = window.app.canvas.videoArea.height;
        }

        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="export-content">
                <h3>Export ${window.app.canvas.videoArea.visible ? 'Video Area' : 'Canvas'}</h3>
                <div class="export-options">
                    <div class="export-option">
                        <label>
                            <input type="radio" name="exportType" value="image" checked>
                            Export as Image (PNG)
                        </label>
                    </div>
                    <div class="export-option">
                        <label>
                            <input type="radio" name="exportType" value="video">
                            Export as Video (WebM)
                        </label>
                    </div>
                    <div class="export-option">
                        <label>
                            <input type="radio" name="exportType" value="gif">
                            Export as GIF
                        </label>
                    </div>
                </div>
                <div class="export-settings">
                    <div class="setting">
                        <label>Width:</label>
                        <input type="number" id="exportWidth" value="${defaultWidth}" min="400">
                    </div>
                    <div class="setting">
                        <label>Height:</label>
                        <input type="number" id="exportHeight" value="${defaultHeight}" min="300">
                    </div>
                    <div class="setting">
                        <label>Quality:</label>
                        <select id="exportQuality">
                            <option value="0.8">High</option>
                            <option value="0.6">Medium</option>
                            <option value="0.4">Low</option>
                        </select>
                    </div>
                </div>
                <div class="export-actions">
                    <button class="btn" onclick="this.closeExportDialog()">Cancel</button>
                    <button class="btn" onclick="this.startExport()">Export</button>
                </div>
            </div>
        `;

        // Add styles for dialog
        const style = document.createElement('style');
        style.textContent = `
            .export-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .export-content {
                background: #2d2d2d;
                padding: 24px;
                border-radius: 8px;
                min-width: 400px;
                color: white;
            }
            .export-options {
                margin: 16px 0;
            }
            .export-option {
                margin: 8px 0;
            }
            .export-settings {
                margin: 16px 0;
            }
            .setting {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 8px 0;
            }
            .setting label {
                width: 80px;
            }
            .setting input, .setting select {
                flex: 1;
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: white;
            }
            .export-actions {
                margin-top: 24px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(dialog);

        // Bind dialog methods
        window.closeExportDialog = () => {
            document.body.removeChild(dialog);
            document.head.removeChild(style);
        };

        window.startExport = () => {
            const exportType = document.querySelector('input[name="exportType"]:checked').value;
            const width = parseInt(document.getElementById('exportWidth').value);
            const height = parseInt(document.getElementById('exportHeight').value);
            const quality = parseFloat(document.getElementById('exportQuality').value);

            this.performExport(exportType, width, height, quality);
            window.closeExportDialog();
        };
    }

    performExport(type, width, height, quality) {
        if (!window.app || !window.app.canvas) return;

        try {
            const canvas = window.app.canvas.canvas;

            switch (type) {
                case 'image':
                    this.exportImage(canvas, width, height, quality);
                    break;
                case 'video':
                    this.exportVideo(canvas, width, height, quality);
                    break;
                case 'gif':
                    this.exportGIF(canvas, width, height, quality);
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    } exportImage(canvas, width, height, quality) {
        // Create a temporary canvas with desired dimensions
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        // Get video area bounds if available
        if (window.app && window.app.canvas && window.app.canvas.videoArea.visible) {
            const videoArea = window.app.canvas.videoArea;
            // Draw only the video area portion of the canvas
            tempCtx.drawImage(canvas,
                videoArea.x, videoArea.y, videoArea.width, videoArea.height,  // source
                0, 0, width, height  // destination
            );
        } else {
            // Fallback: draw the entire canvas
            tempCtx.drawImage(canvas, 0, 0, width, height);
        }

        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vithum_export_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', quality);
    }

    exportVideo(canvas, width, height, quality) {
        // Basic video export implementation
        console.log('Video export not yet implemented');
        alert('Video export is not yet implemented. Please use image export instead.');
    }

    exportGIF(canvas, width, height, quality) {
        // Basic GIF export implementation
        console.log('GIF export not yet implemented');
        alert('GIF export is not yet implemented. Please use image export instead.');
    }

    // Keyboard shortcuts
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newProject();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openProject();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportProject();
                        break;
                }
            }

            // Space bar for play/pause
            if (e.code === 'Space' && window.app && window.app.audio) {
                e.preventDefault();
                window.app.audio.togglePlayPause();
            }
        });
    }

    // Panel toggles
    setupPanelToggles() {
        // Left panel toggle
        const leftToggle = document.getElementById('leftPanelToggle');
        if (leftToggle) {
            leftToggle.addEventListener('click', () => {
                this.toggleLeftPanel();
            });
        }

        // Right panel toggle
        const rightToggle = document.getElementById('rightPanelToggle');
        if (rightToggle) {
            rightToggle.addEventListener('click', () => {
                this.toggleRightPanel();
            });
        }

        // Bottom panel toggle
        const bottomToggle = document.getElementById('bottomPanelToggle');
        if (bottomToggle) {
            bottomToggle.addEventListener('click', () => {
                this.toggleBottomPanel();
            });
        }
    }

    toggleLeftPanel() {
        const panel = document.getElementById('leftPanel');
        const handle = document.querySelector('.resize-left');
        const icon = document.querySelector('#leftPanelToggle i');

        this.leftPanelCollapsed = !this.leftPanelCollapsed;

        if (this.leftPanelCollapsed) {
            panel.classList.add('collapsed');
            if (handle) handle.style.left = '36px';
            if (icon) icon.className = 'fas fa-chevron-right';
        } else {
            panel.classList.remove('collapsed');
            if (handle) handle.style.left = (this.leftPanelWidth - 4) + 'px';
            if (icon) icon.className = 'fas fa-chevron-left';
        }
    }

    toggleRightPanel() {
        const panel = document.getElementById('rightPanel');
        const handle = document.querySelector('.resize-right');
        const icon = document.querySelector('#rightPanelToggle i');

        this.rightPanelCollapsed = !this.rightPanelCollapsed;

        if (this.rightPanelCollapsed) {
            panel.classList.add('collapsed');
            if (handle) handle.style.right = '36px';
            if (icon) icon.className = 'fas fa-chevron-left';
        } else {
            panel.classList.remove('collapsed');
            if (handle) handle.style.right = (this.rightPanelWidth - 4) + 'px';
            if (icon) icon.className = 'fas fa-chevron-right';
        }
    }

    toggleBottomPanel() {
        const panel = document.getElementById('bottomPanel');
        const icon = document.querySelector('#bottomPanelToggle i');

        this.bottomPanelCollapsed = !this.bottomPanelCollapsed;

        if (this.bottomPanelCollapsed) {
            panel.classList.add('collapsed');
            if (icon) icon.className = 'fas fa-chevron-up';
        } else {
            panel.classList.remove('collapsed');
            if (icon) icon.className = 'fas fa-chevron-down';
        }
    }

    // Audio timeline setup
    setupAudioTimeline() {
        const progressBar = document.getElementById('progressBar');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalTimeSpan = document.getElementById('totalTime');

        // Update timeline when audio progresses
        setInterval(() => {
            if (window.app && window.app.audio) {
                const audioInfo = window.app.audio.getAudioInfo();
                if (audioInfo && audioInfo.duration) {
                    const progress = (audioInfo.currentTime / audioInfo.duration) * 100;
                    progressBar.value = progress;

                    currentTimeSpan.textContent = this.formatTime(audioInfo.currentTime);
                    totalTimeSpan.textContent = this.formatTime(audioInfo.duration);
                }
            }
        }, 100);

        // Handle seeking
        progressBar.addEventListener('input', (e) => {
            if (window.app && window.app.audio) {
                const audioInfo = window.app.audio.getAudioInfo();
                if (audioInfo && audioInfo.duration) {
                    const seekTime = (e.target.value / 100) * audioInfo.duration;
                    window.app.audio.audioElement.currentTime = seekTime;
                }
            }
        });
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Initialize UI
    init() {
        console.log('UI Manager initialized');
        // Additional initialization can be added here
        
        this.populateVisualizerLibrary();
        this.bindKeyboardShortcuts();
    }
}

// Export for use in other files
window.UIManager = UIManager;
