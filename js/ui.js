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
        // Get audio element reference - it might not exist yet
        this.audioElement = document.getElementById('audioElement') || document.querySelector('audio');

        // Only bind audio events if audio element exists
        if (this.audioElement) {
            // Remove existing listeners to prevent duplicates
            this.audioElement.removeEventListener('loadeddata', this.handleLoadedData);
            this.audioElement.removeEventListener('play', this.handlePlay);
            this.audioElement.removeEventListener('pause', this.handlePause);
            this.audioElement.removeEventListener('ended', this.handleEnded);
            this.audioElement.removeEventListener('error', this.handleError);

            // Add fresh listeners
            this.audioElement.addEventListener('loadeddata', this.handleLoadedData);
            this.audioElement.addEventListener('play', this.handlePlay);
            this.audioElement.addEventListener('pause', this.handlePause);
            this.audioElement.addEventListener('ended', this.handleEnded);
            this.audioElement.addEventListener('error', this.handleError);
        }

        // File input (remove and re-add to prevent duplicates)
        const audioFileInput = document.getElementById('audioFile');
        if (audioFileInput) {
            audioFileInput.removeEventListener('change', this.handleFileChange);
            audioFileInput.addEventListener('change', this.handleFileChange);

            // Also handle when the dialog is cancelled (no file selected)
            audioFileInput.addEventListener('cancel', () => {
                console.log('Audio file selection cancelled');
            });
        }

        // Bind toolbar buttons
        this.bindToolbarButtons();
    }

    bindToolbarButtons() {
        // Project buttons
        const newProjectBtn = document.getElementById('newProject');
        if (newProjectBtn) {
            newProjectBtn.removeEventListener('click', this.handleNewProject);
            newProjectBtn.addEventListener('click', this.handleNewProject);
        }

        const openProjectBtn = document.getElementById('openProject');
        if (openProjectBtn) {
            openProjectBtn.removeEventListener('click', this.handleOpenProject);
            openProjectBtn.addEventListener('click', this.handleOpenProject);
        }

        const saveProjectBtn = document.getElementById('saveProject');
        if (saveProjectBtn) {
            saveProjectBtn.removeEventListener('click', this.handleSaveProject);
            saveProjectBtn.addEventListener('click', this.handleSaveProject);
        }

        //const exportProjectBtn = document.getElementById('exportProject');
        //if (exportProjectBtn) {
        //    exportProjectBtn.removeEventListener('click', this.handleExportProject);
        //    exportProjectBtn.addEventListener('click', this.handleExportProject);
        //}

        const exportProjectBtn = document.getElementById('exportProject');
        if (exportProjectBtn) {
            exportProjectBtn.removeEventListener('click', this.handleExportProject);
            // Show export guide modal instead of export dialog
            exportProjectBtn.addEventListener('click', () => {
                if (window.app && window.app.canvas) {
                    window.app.canvas.showExportGuideModal();
                }
            });
        }

        // Audio control buttons
        const playPauseBtn = document.getElementById('playPause');
        if (playPauseBtn) {
            playPauseBtn.removeEventListener('click', this.handlePlayPause);
            playPauseBtn.addEventListener('click', this.handlePlayPause);
        }

        const stopBtn = document.getElementById('stop');
        if (stopBtn) {
            stopBtn.removeEventListener('click', this.handleStop);
            stopBtn.addEventListener('click', this.handleStop);
        }

        const loadAudioBtn = document.getElementById('loadAudio');
        if (loadAudioBtn) {
            loadAudioBtn.removeEventListener('click', this.handleLoadAudio);
            loadAudioBtn.addEventListener('click', this.handleLoadAudio);
        }

        // View control buttons
        const zoomInBtn = document.getElementById('zoomIn');
        if (zoomInBtn) {
            zoomInBtn.removeEventListener('click', this.handleZoomIn);
            zoomInBtn.addEventListener('click', this.handleZoomIn);
        }

        const zoomOutBtn = document.getElementById('zoomOut');
        if (zoomOutBtn) {
            zoomOutBtn.removeEventListener('click', this.handleZoomOut);
            zoomOutBtn.addEventListener('click', this.handleZoomOut);
        }

        const resetZoomBtn = document.getElementById('resetZoom');
        if (resetZoomBtn) {
            resetZoomBtn.removeEventListener('click', this.handleResetZoom);
            resetZoomBtn.addEventListener('click', this.handleResetZoom);
        }

        const fullscreenBtn = document.getElementById('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.removeEventListener('click', this.handleFullscreen);
            fullscreenBtn.addEventListener('click', this.handleFullscreen);
        }

        // Panel toggle buttons
        const toggleLeftPanelBtn = document.getElementById('toggleLeftPanel');
        if (toggleLeftPanelBtn) {
            toggleLeftPanelBtn.removeEventListener('click', this.handleToggleLeftPanel);
            toggleLeftPanelBtn.addEventListener('click', this.handleToggleLeftPanel);
        }

        const toggleBottomPanelBtn = document.getElementById('toggleBottomPanel');
        if (toggleBottomPanelBtn) {
            toggleBottomPanelBtn.removeEventListener('click', this.handleToggleBottomPanel);
            toggleBottomPanelBtn.addEventListener('click', this.handleToggleBottomPanel);
        }

        // Also bind resize handles
        this.bindResizeHandles();
    }

    removeExistingListeners() {
        // Clone and replace nodes to remove all event listeners
        const buttonsToClean = [
            'newProject', 'openProject', 'saveProject', 'exportProject',
            'playPause', 'stop', 'loadAudio',
            'zoomIn', 'zoomOut', 'resetZoom', 'fullscreen',
            'toggleLeftPanel', 'toggleBottomPanel'
        ];

        buttonsToClean.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    // Create bound handler methods to prevent duplicate listeners
    handleNewProject = () => this.newProject();
    handleOpenProject = () => this.openProject();
    handleSaveProject = () => this.saveProject();
    handleExportProject = () => this.exportProject();

    handlePlayPause = () => {
        if (window.app && window.app.audio) {
            window.app.audio.togglePlayPause();
        }
    };

    handleLoadedData = (e) => {
        console.log('Audio loaded');
    };

    handlePlay = (e) => {
        console.log('Audio playing');
    };

    handlePause = (e) => {
        console.log('Audio paused');
    };

    handleEnded = (e) => {
        console.log('Audio ended');
    };

    handleError = (e) => {
        console.error('Audio error:', e);
    };

    handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && window.app && window.app.audio) {
            window.app.audio.loadAudioFile(file);
        }
    };

    handleStop = () => {
        if (window.app && window.app.audio) {
            window.app.audio.stop();
        }
    };

    handleLoadAudio = () => {
        const audioInput = document.getElementById('audioFile');
        if (audioInput) {
            // Reset the input to allow selecting the same file again
            audioInput.value = '';
            audioInput.click();
        }
    };

    handleZoomIn = () => {
        if (window.app && window.app.canvas) {
            window.app.canvas.zoomIn();
        }
    };

    handleZoomOut = () => {
        if (window.app && window.app.canvas) {
            window.app.canvas.zoomOut();
        }
    };

    handleResetZoom = () => {
        if (window.app && window.app.canvas) {
            window.app.canvas.resetZoom();
        }
    };

    handleFullscreen = () => {
        this.toggleFullscreen();
    };

    handleToggleLeftPanel = () => {
        this.toggleLeftPanel();
    };

    handleToggleBottomPanel = () => {
        this.toggleBottomPanel();
    };

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

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.log('Error attempting to exit fullscreen:', err);
            });
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            { type: 'reactiveimage', name: 'Reactive Image', icon: 'fas fa-image', description: 'Audio-reactive image with effects' },

            // Advanced visualizers
            { type: 'spectrum', name: 'Spectrum', icon: 'fas fa-signal', description: 'Gradient spectrum analyzer' },
            { type: 'particles', name: 'Particles', icon: 'fas fa-atom', description: 'Animated particle system' },
            { type: 'wave', name: 'Wave Layers', icon: 'fas fa-water', description: 'Layered wave patterns' },
            { type: 'lissajous', name: 'Lissajous', icon: 'fas fa-infinity', description: 'Mathematical curves with trails' },
            { type: 'vortex', name: 'Vortex', icon: 'fas fa-tornado', description: 'Rotating spiral arms' },
            { type: 'plasma', name: 'Plasma', icon: 'fas fa-fire', description: 'Smooth plasma effects' },
            { type: 'network', name: 'Network', icon: 'fas fa-project-diagram', description: 'Connected node network' },
            { type: 'kaleidoscope', name: 'Kaleidoscope', icon: 'fas fa-gem', description: 'Symmetrical kaleidoscope patterns' },
            { type: 'galaxy', name: 'Galaxy', icon: 'fas fa-star', description: 'Spiral galaxy with rotating stars' },
            { type: 'dna', name: 'DNA Helix', icon: 'fas fa-dna', description: 'Double helix DNA structure' },
            { type: 'flower', name: 'Flower', icon: 'fas fa-seedling', description: 'Blooming flower petals' },
            { type: 'tunnel', name: 'Tunnel', icon: 'fas fa-circle-notch', description: '3D tunnel effect' },
            { type: 'fractaltree', name: 'Fractal Tree', icon: 'fas fa-tree', description: 'Growing fractal tree branches' }
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
            'kaleidoscope': 'advanced',
            'galaxy': 'effects',
            'dna': 'effects',
            'flower': 'effects',
            'tunnel': 'effects',
            'fractaltree': 'effects'
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

    resetAudioState() {
        // Stop playback
        this.stop();

        // Disconnect audio source
        if (this.audioSource) {
            try {
                this.audioSource.disconnect();
            } catch (error) {
                console.log('Audio source already disconnected');
            }
            this.audioSource = null;
        }

        // Clear audio element
        if (this.audioElement.src) {
            this.audioElement.pause();
            this.audioElement.removeAttribute('src');
            this.audioElement.load();
        }

        // Clean up blob URL
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
        }

        // Reset state
        this.isPlaying = false;
        this.audioFile = null;
        this.updatePlayButton();

        console.log('Audio state completely reset');
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
        //this.showExportDialog();
            // Show export guide modal instead of export dialog
            if (window.app && window.app.canvas) {
                window.app.canvas.showExportGuideModal();
            }
    }

    showExportDialog() {
        // Get default export dimensions from video area if visible, otherwise canvas
        let defaultWidth = 1920;
        let defaultHeight = 1080;

        if (window.app && window.app.canvas && window.app.canvas.videoArea.visible) {
            defaultWidth = window.app.canvas.videoArea.width;
            defaultHeight = window.app.canvas.videoArea.height;
        }

        // Get audio duration for full-length export
        let audioDuration = 10; // default 10 seconds
        if (window.app && window.app.audio && window.app.audio.audioElement) {
            const audioInfo = window.app.audio.getAudioInfo();
            if (audioInfo && audioInfo.duration && !isNaN(audioInfo.duration)) {
                audioDuration = Math.ceil(audioInfo.duration);
            }
        }

        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
        <div class="export-content">
            <h3>Export ${window.app.canvas && window.app.canvas.videoArea.visible ? 'Video Area' : 'Canvas'}</h3>
            <div class="export-options">
                <div class="export-option">
                    <label>
                        <input type="radio" name="exportType" value="image" checked>
                        Export as Image (PNG)
                    </label>
                </div>
                <div class="export-option">
                    <label>
                        <input type="radio" name="exportType" value="webm">
                        Export as WebM Video ${window.app.audio && window.app.audio.audioElement ? '(with Audio)' : '(Video Only)'}
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
                        <option value="0.9">High</option>
                        <option value="0.7">Medium</option>
                        <option value="0.5">Low</option>
                    </select>
                </div>
                <div class="setting" id="recordingSettings" style="display: none;">
                    <label>Duration:</label>
                    <select id="recordingDuration">
                        <option value="5">5 seconds</option>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="${audioDuration}" ${audioDuration > 60 ? 'selected' : ''}>Full Audio (${Math.floor(audioDuration / 60)}:${String(audioDuration % 60).padStart(2, '0')})</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div class="setting" id="customDurationSetting" style="display: none;">
                    <label>Custom Duration (seconds):</label>
                    <input type="number" id="customDuration" value="10" min="1" max="600">
                </div>
                <div class="setting" id="fpsSettings" style="display: none;">
                    <label>Frame Rate:</label>
                    <select id="recordingFPS">
                        <option value="24">24 FPS (Cinematic)</option>
                        <option value="30" selected>30 FPS (Standard)</option>
                        <option value="60">60 FPS (Smooth)</option>
                    </select>
                </div>
                <div class="setting" id="bitrateSettings" style="display: none;">
                    <label>Video Quality:</label>
                    <select id="recordingBitrate">
                        <option value="2500">2.5 Mbps (Good)</option>
                        <option value="5000" selected>5 Mbps (High)</option>
                        <option value="8000">8 Mbps (Very High)</option>
                        <option value="12000">12 Mbps (Ultra)</option>
                    </select>
                </div>
            </div>
            <div class="export-info" id="exportInfo" style="display: none;">
                <p><i class="fas fa-info-circle"></i> Recording will capture visualizations without viewport elements. Audio will be included if available.</p>
            </div>
            <div class="export-actions">
                <button class="btn" id="cancelExport">Cancel</button>
                <button class="btn" id="startExport">Export</button>
            </div>
        </div>
    `;

        // Add styles for the info section
        const style = document.createElement('style');
        style.id = 'exportDialogStyles';
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
            max-width: 500px;
            color: white;
            max-height: 80vh;
            overflow-y: auto;
        }
        .export-options {
            margin: 16px 0;
        }
        .export-option {
            margin: 8px 0;
        }
        .export-option label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
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
            width: 140px;
            font-size: 14px;
        }
        .setting input, .setting select {
            flex: 1;
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: white;
        }
        .export-info {
            margin: 16px 0;
            padding: 12px;
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 4px;
            font-size: 13px;
        }
        .export-info i {
            color: #00d4ff;
            margin-right: 8px;
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

        // Show/hide recording settings based on export type
        const exportTypeRadios = dialog.querySelectorAll('input[name="exportType"]');
        const recordingSettings = dialog.querySelector('#recordingSettings');
        const fpsSettings = dialog.querySelector('#fpsSettings');
        const bitrateSettings = dialog.querySelector('#bitrateSettings');
        const customDurationSetting = dialog.querySelector('#customDurationSetting');
        const exportInfo = dialog.querySelector('#exportInfo');

        exportTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'webm') {
                    recordingSettings.style.display = 'flex';
                    fpsSettings.style.display = 'flex';
                    bitrateSettings.style.display = 'flex';
                    exportInfo.style.display = 'block';
                } else {
                    recordingSettings.style.display = 'none';
                    fpsSettings.style.display = 'none';
                    bitrateSettings.style.display = 'none';
                    customDurationSetting.style.display = 'none';
                    exportInfo.style.display = 'none';
                }
            });
        });

        // Handle duration selection
        const durationSelect = dialog.querySelector('#recordingDuration');
        durationSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customDurationSetting.style.display = 'flex';
            } else {
                customDurationSetting.style.display = 'none';
            }
        });

        // Define close function
        const closeDialog = () => {
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
            if (document.getElementById('exportDialogStyles')) {
                document.head.removeChild(document.getElementById('exportDialogStyles'));
            }
        };

        // Define export function
        const startExport = () => {
            const exportType = dialog.querySelector('input[name="exportType"]:checked').value;
            const width = parseInt(dialog.querySelector('#exportWidth').value);
            const height = parseInt(dialog.querySelector('#exportHeight').value);
            const quality = parseFloat(dialog.querySelector('#exportQuality').value);

            if (exportType === 'webm') {
                // WebM video export using background canvas recording
                let duration;
                const durationValue = dialog.querySelector('#recordingDuration').value;

                if (durationValue === 'custom') {
                    duration = parseInt(dialog.querySelector('#customDuration').value) * 1000;
                } else {
                    duration = parseInt(durationValue) * 1000;
                }

                const fps = parseInt(dialog.querySelector('#recordingFPS').value);
                const bitrate = parseInt(dialog.querySelector('#recordingBitrate').value) * 1000;

                if (window.app && window.app.canvas) {
                    // Update recording canvas size
                    if (window.app.canvas.recordingCanvas) {
                        window.app.canvas.recordingCanvas.width = width;
                        window.app.canvas.recordingCanvas.height = height;
                    }

                    // Check if we have audio loaded for full-length export
                    if (durationValue == audioDuration && window.app.audio && window.app.audio.audioElement) {
                        // Start audio playback from the beginning for full-length recording
                        window.app.audio.audioElement.currentTime = 0;
                        window.app.audio.play();
                    }

                    window.app.canvas.startRecording({ duration, fps, bitrate });

                    // Show notification with duration info
                    const durationText = duration > 60000 ?
                        `${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}` :
                        `${duration / 1000}s`;

                    window.app.showNotification(
                        'Recording Started',
                        `Recording ${durationText} at ${fps} FPS (${width}×${height})`,
                        'info',
                        3000
                    );
                }
            } else {
                // Image export
                this.performImageExport(width, height, quality);
            }

            closeDialog();
        };

        // Bind event handlers
        const cancelBtn = dialog.querySelector('#cancelExport');
        const exportBtn = dialog.querySelector('#startExport');

        cancelBtn.addEventListener('click', closeDialog);
        exportBtn.addEventListener('click', startExport);

        // Close on escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
    }

    // Add this new method for image export
    performImageExport(width, height, quality) {
        if (!window.app || !window.app.canvas) return;

        try {
            const canvas = window.app.canvas.canvas;

            // Create a temporary canvas for export
            const exportCanvas = document.createElement('canvas');
            const exportCtx = exportCanvas.getContext('2d');

            // Set export dimensions
            exportCanvas.width = width;
            exportCanvas.height = height;

            // Calculate scale to fit current canvas content
            const scaleX = width / canvas.width;
            const scaleY = height / canvas.height;
            const scale = Math.min(scaleX, scaleY);

            // Center the content
            const offsetX = (width - canvas.width * scale) / 2;
            const offsetY = (height - canvas.height * scale) / 2;

            // Fill background
            exportCtx.fillStyle = '#000000';
            exportCtx.fillRect(0, 0, width, height);

            // Draw scaled canvas content
            exportCtx.drawImage(
                canvas,
                offsetX, offsetY,
                canvas.width * scale, canvas.height * scale
            );

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `vithum-export-${timestamp}.png`;

            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = exportCanvas.toDataURL('image/png', quality);
            link.click();

            // Show success notification
            if (window.app) {
                window.app.showNotification(
                    'Image Exported',
                    `Canvas exported as ${filename}`,
                    'success',
                    3000
                );
            }

        } catch (error) {
            console.error('Failed to export image:', error);

            if (window.app) {
                window.app.showNotification(
                    'Export Failed',
                    'Failed to export canvas as image',
                    'error',
                    3000
                );
            }
        }
    }

    // Remove the old performExport method if it exists, and replace with this simpler version
    performExport(type, width, height, quality) {
        // This method can be kept for backwards compatibility
        if (type === 'image') {
            this.performImageExport(width, height, quality);
        }
    }

    exportImage(canvas, width, height, quality) {
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
