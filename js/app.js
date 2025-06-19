// Main application entry point

class VithumApp {
    constructor() {
        this.canvas = null;
        this.audio = null;
        this.ui = null;
        this.animationFrame = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Vithum Audio Visualizer Studio...');
            
            // Initialize core components
            this.audio = new AudioManager();
            this.canvas = new CanvasManager();
            this.ui = new UIManager();
            
            // Initialize UI
            this.ui.init();
            
            // Start main animation loop
            this.startAnimationLoop();
            
            console.log('Vithum Studio initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize Vithum Studio:', error);
            this.showErrorMessage('Failed to initialize the application. Please refresh and try again.');
        }
    }

    startAnimationLoop() {
        const animate = () => {
            try {
                // Get audio data
                const audioData = this.audio.getAudioData();
                
                // Update visualizers with audio data
                if (this.canvas && audioData.audioData && audioData.frequencyData) {
                    this.canvas.updateAudioData(audioData.audioData, audioData.frequencyData);
                }
                
                // Continue animation loop
                this.animationFrame = requestAnimationFrame(animate);
            } catch (error) {
                console.error('Animation loop error:', error);
            }
        };
        
        animate();
    }

    showWelcomeMessage() {
        const hasSeenWelcome = localStorage.getItem('vithum_welcome_seen');
        
        if (!hasSeenWelcome) {
            setTimeout(() => {
                this.showNotification(
                    'Welcome to Vithum Studio!',
                    'Drag visualizers from the left panel to the canvas, or double-click to add them. Load an audio file to see them react to music.',
                    'info',
                    10000
                );
                localStorage.setItem('vithum_welcome_seen', 'true');
            }, 1000);
        }
    }

    showErrorMessage(message) {
        this.showNotification('Error', message, 'error', 5000);
    }

    showNotification(title, message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <strong>${title}</strong>
                    <button class="notification-close">&times;</button>
                </div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                    border-left: 4px solid #00d4ff;
                    color: white;
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                }
                .notification-error {
                    border-left-color: #ff4444;
                }
                .notification-success {
                    border-left-color: #44ff44;
                }
                .notification-warning {
                    border-left-color: #ffaa00;
                }
                .notification-content {
                    padding: 16px;
                }
                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .notification-message {
                    font-size: 14px;
                    opacity: 0.9;
                    line-height: 1.4;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const monitor = () => {
            const currentTime = performance.now();
            frameCount++;
            
            // Update FPS every second
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Log performance if FPS drops below 30
                if (fps < 30) {
                    console.warn(`Low FPS detected: ${fps} fps`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        monitor();
    }

    // Error handling
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification(
                'Application Error',
                'An unexpected error occurred. Some features may not work correctly.',
                'error',
                5000
            );
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showNotification(
                'Promise Error',
                'A background operation failed. Please try again.',
                'error',
                5000
            );
        });
    }

    // Feature detection
    checkBrowserSupport() {
        const features = {
            webAudio: !!(window.AudioContext || window.webkitAudioContext),
            canvas: !!document.createElement('canvas').getContext,
            fileApi: !!(window.File && window.FileReader && window.FileList && window.Blob),
            dragDrop: 'draggable' in document.createElement('span'),
            localStorage: !!window.localStorage
        };
        
        const missingFeatures = Object.keys(features).filter(key => !features[key]);
        
        if (missingFeatures.length > 0) {
            this.showNotification(
                'Browser Compatibility',
                `Some features may not work properly. Missing: ${missingFeatures.join(', ')}`,
                'warning',
                8000
            );
        }
        
        return features;
    }

    // Auto-save functionality
    enableAutoSave(intervalMs = 60000) { // Auto-save every minute
        setInterval(() => {
            try {
                if (this.canvas && this.canvas.visualizers.length > 0) {
                    const data = this.canvas.serialize();
                    localStorage.setItem('vithum_autosave', JSON.stringify(data));
                    console.log('Auto-saved project');
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, intervalMs);
    }

    // Restore from auto-save
    restoreAutoSave() {
        try {
            const data = localStorage.getItem('vithum_autosave');
            if (data) {
                const projectData = JSON.parse(data);
                if (projectData.visualizers && projectData.visualizers.length > 0) {
                    const restore = confirm('An auto-saved project was found. Would you like to restore it?');
                    if (restore && this.canvas) {
                        this.canvas.deserialize(projectData);
                        this.showNotification(
                            'Project Restored',
                            'Your auto-saved project has been restored.',
                            'success',
                            3000
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Failed to restore auto-save:', error);
        }
    }

    // Cleanup on page unload
    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.audio) {
            this.audio.cleanup();
        }
        
        console.log('Vithum Studio cleaned up');
    }

    // Public API for external integrations
    getAPI() {
        return {
            canvas: this.canvas,
            audio: this.audio,
            ui: this.ui,
            addVisualizer: (type, x, y, width, height) => {
                return this.canvas ? this.canvas.addVisualizer(type, x, y, width, height) : null;
            },
            loadAudio: (file) => {
                return this.audio ? this.audio.loadAudioFile(file) : false;
            },
            exportImage: (width, height, quality) => {
                return this.ui ? this.ui.exportImage(this.canvas.canvas, width, height, quality) : false;
            },
            saveProject: () => {
                return this.ui ? this.ui.saveProject() : false;
            },
            loadProject: (data) => {
                return this.canvas ? this.canvas.deserialize(data) : false;
            }
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global app instance
        window.app = new VithumApp();
        
        // Setup additional features
        window.app.setupErrorHandling();
        window.app.checkBrowserSupport();
        window.app.enableAutoSave();
        
        // Restore auto-save after a short delay
        setTimeout(() => {
            window.app.restoreAutoSave();
        }, 2000);
        
        // Start performance monitoring in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.app.startPerformanceMonitoring();
        }
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            window.app.cleanup();
        });
        
    } catch (error) {
        console.error('Failed to start Vithum Studio:', error);
        
        // Show fallback error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif; text-align: center;">
                <div>
                    <h1>🎵 Vithum Studio</h1>
                    <p>Failed to load the application.</p>
                    <p>Please refresh the page and try again.</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #00d4ff; border: none; border-radius: 5px; color: black; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
});

// Export for external use
window.VithumApp = VithumApp;
