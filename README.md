# 🎵 Vithum - Audio Visualizer Studio

A powerful web-based audio visualizer creation studio with drag-and-drop functionality, real-time audio processing, advanced visual effects.

https://horrelltech.github.io/Vithum/

## ✨ Features

### 🎨 Visual Studio
- **Drag & Drop Interface**: Intuitive drag-and-drop visualizer creation with library search
- **Extensive Visualizer Library**: 20+ visualizer types including Waveform, Frequency Bars, Circle, Spiral, Radial, Particles, Spectrum, Kaleidoscope, Matrix Rain, DNA Helix, Galaxy, Fractal Tree, 3D Tunnel, Fog Effects, and more
- **Real-time Preview**: See visualizers react to audio in real-time
- **Advanced Selection System**: Tab cycling through overlapping visualizers, visual selection cues
- **Precision Controls**: Resize, rotate, scale with handles, snap-to-grid, precise positioning
- **Layer Management**: Bring to front/send to back, visibility toggles, locking system
- **Canvas Management**: Customizable canvas size, video area overlay, zoom controls, pan navigation

### 🎵 Audio Processing
- **Web Audio API**: Professional-grade audio processing with FFT analysis
- **Multiple Input Sources**: Load audio files with drag-and-drop support
- **Real-time Analysis**: Advanced frequency and time domain analysis
- **Audio Reactive**: All visualizers respond to audio with customizable frequency ranges
- **Timeline Controls**: Full audio timeline with seeking, progress tracking
- **Playback Controls**: Play, pause, stop with keyboard shortcuts

### 🎛️ Advanced Controls
- **Comprehensive Properties Panel**: Detailed property editing for each visualizer type
- **Transform Controls**: Position (X/Y), size (width/height), rotation, scale (X/Y)
- **Appearance Settings**: Colors, opacity, stroke width, backgrounds, transparency
- **Audio Settings**: Sensitivity, smoothing, frequency range (min/max), audio reactivity toggle
- **Animation Controls**: Speed, pulse strength, rotation speed, morphing effects
- **Visualizer-Specific Properties**: Unique controls for each visualizer type (segments, layers, complexity, etc.)

### 📹 Export & Recording
- **Export Guide Modal**: Comprehensive guide for recording visualizations
- **Screen Recording Recommendations**: Platform-specific recording tool suggestions
- **Video Editing Tools**: Recommended tools for post-processing recordings
- **Project Management**: Save/load projects as JSON files
- **Auto-save**: Automatic project backup every minute
- **Image Export**: Export static frames as PNG images

### 📱 Cross-Platform Support
- **Desktop Optimized**: Full feature set for desktop browsers
- **Touch Support**: Touch-friendly controls for tablets
- **Mobile Compatible**: Responsive design for mobile devices
- **Keyboard Shortcuts**: Comprehensive keyboard navigation

## 🚀 Getting Started

### Installation
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process required - pure HTML, CSS, and JavaScript!

### Quick Start
1. **Load Audio**: Click "Load Audio" or drag an audio file onto the canvas
2. **Add Visualizers**: Drag visualizers from the left panel to the canvas, or double-click to add
3. **Customize**: Select visualizers and edit properties in the right panel
4. **Layer Management**: Use bring to front/send to back for layering
5. **Play**: Hit the play button to see your visualizers react to music
6. **Export**: Use the export guide to record your creations

## 🎮 Controls

### Mouse Controls
- **Click**: Select visualizer
- **Tab**: Cycle through overlapping visualizers
- **Shift+Tab**: Cycle backwards through visualizers
- **Drag**: Move selected visualizer
- **Handles**: Resize visualizer (corner and edge handles)
- **Rotation Handle**: Rotate visualizer (blue circle above selection)
- **Canvas**: Pan around canvas when no visualizer selected
- **Double-click**: Add visualizer at cursor position

### Keyboard Shortcuts
- **V**: Toggle visibility of selected visualizer
- **L**: Toggle selectable/lock state
- **Escape**: Deselect current visualizer
- **Delete**: Remove selected visualizer
- **Arrow Keys**: Move selected visualizer (Shift for larger steps)
- **Ctrl+N**: New project
- **Ctrl+O**: Open project
- **Ctrl+S**: Save project
- **Space**: Play/pause audio

### Touch Support
- Full touch support for mobile and tablet devices
- Touch to select, drag to move, pinch to zoom
- Touch-friendly UI controls

## 🎨 Visualizer Types

### Basic Visualizers
- **Waveform**: Classic audio waveform display
- **Frequency Bars**: Traditional spectrum analyzer bars
- **Circle**: Pulsing circle that reacts to volume
- **Spiral**: Animated spiral with frequency-reactive radius
- **Radial**: Radial lines extending from center

### Advanced Visualizers
- **Particles**: Dynamic particle system with audio reactivity
- **Spectrum**: Advanced spectrum display with gradient options
- **Wave Layers**: Layered wave patterns
- **Lissajous**: Mathematical curves with trailing effects
- **Vortex**: Rotating spiral arms
- **Plasma**: Smooth plasma field effects
- **Network**: Connected node network visualization

### Artistic Visualizers
- **Kaleidoscope**: Symmetrical kaleidoscope patterns with customizable complexity
- **Galaxy**: Spiral galaxy with rotating stars
- **DNA Helix**: Double helix DNA structure animation
- **Flower**: Blooming flower petals
- **Fractal Tree**: Growing fractal tree branches with wind effects
- **Matrix Rain**: Digital rain effect with customizable characters

### 3D & Effects
- **3D Tunnel**: Perspective tunnel effect
- **3D Equalizer**: Equalizer with 3D perspective
- **Sunburst**: Radial sunburst rays
- **Reactive Fog**: Audio-reactive fog/mist effects
- **Reactive Image**: Custom image with audio-reactive scaling and flash effects
- **Starfield**: Infinite zooming starfield
- **Polygon Pulse**: Morphing polygon shapes

## 🔧 Browser Support

### Recommended Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- Web Audio API
- Canvas 2D
- File API
- Drag and Drop API
- Local Storage
- RequestAnimationFrame

## 📁 Project Structure

```
Vithum/
├── index.html          # Main HTML file
├── styles.css          # Main CSS styles
├── visualizers.css     # Visualizer-specific styles
├── js/
│   ├── app.js         # Main application entry point & initialization
│   ├── utils.js       # Utility functions and helpers
│   ├── visualizers.js # All visualizer classes and rendering logic
│   ├── canvas.js      # Canvas management, interactions, and export
│   ├── audio.js       # Audio processing and Web Audio API
│   └── ui.js          # UI management and user interactions
├── README.md          # Documentation
└── LICENSE           # License information
```

## 🎯 Usage Examples

### Creating a Simple Visualizer
1. Load an audio file
2. Drag a "Frequency Bars" visualizer to the canvas
3. Adjust color and sensitivity in the properties panel
4. Set frequency range for specific audio response
5. Press play and enjoy!

### Advanced Multi-Layer Setup
1. Add background fog effect
2. Add kaleidoscope in center with high complexity
3. Add particle system around edges
4. Add matrix rain as overlay
5. Adjust individual sensitivities and colors
6. Lock background elements and work with foreground
7. Save your project for later use

### Creating Reactive Image Visualizations
1. Add a Reactive Image visualizer
2. Upload your custom image
3. Set shape (rectangle, circle, square)
4. Enable mask mode for shape clipping
5. Adjust reactive scale strength and flash effects
6. Combine with other visualizers for complex scenes

## 🛠️ Customization

### Adding New Visualizer Types
1. Create a new class extending `BaseVisualizer` in `visualizers.js`
2. Implement the `render()` and `updateAudioData()` methods
3. Add specific property handling in `updateProperty()`
4. Add the type to `VisualizerFactory.create()`
5. Add UI elements in the visualizer library

### Modifying Audio Processing
- Adjust FFT size in `AudioManager` for different frequency resolution
- Modify smoothing constants for different response characteristics
- Customize frequency range mapping for different visualizers
- Add beat detection and onset analysis

## 🎪 Advanced Features

### Audio Analysis
- Real-time FFT analysis with customizable window sizes
- Frequency band splitting (bass, mids, treble)
- Audio smoothing and sensitivity controls
- Per-visualizer frequency range selection

### Performance Optimization
- Efficient canvas rendering with selective updates
- RAF-based animation loop
- Automatic performance monitoring
- Memory-conscious audio processing
- Optimized visualizer rendering

### Export System
- Comprehensive export guide with platform-specific instructions
- Screen recording tool recommendations (OBS, Bandicam, etc.)
- Mobile recording solutions (iOS Screen Recording, Android tools)
- Video editing tool suggestions (DaVinci Resolve, iMovie, etc.)
- Recording optimization tips

### Layer Management
- Visual layering with bring to front/send to back
- Lock/unlock system for protecting visualizers
- Visibility toggles for complex compositions
- Tab cycling for easy selection of overlapping elements

## 🐛 Troubleshooting

### Audio Issues
- **No audio**: Check if file format is supported (MP3, WAV, OGG, M4A)
- **No visualization**: Ensure audio is playing and visualizers have audio reactivity enabled
- **Poor performance**: Reduce number of complex visualizers (particles, fog, etc.)

### Browser Issues
- **Features not working**: Update to a supported browser version
- **Drag and drop not working**: Check if browser supports HTML5 drag and drop
- **Audio context errors**: User interaction required before audio can play
- **Export issues**: Use recommended screen recording software

### Performance Issues
- **Low FPS**: Monitor shows warnings for FPS below 30
- **Memory usage**: Large numbers of particles or complex visualizers
- **Audio lag**: Reduce audio processing complexity or buffer size

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest new visualizer types
- Submit pull requests
- Improve documentation
- Add new export formats

## 🎉 Credits

Built with modern web technologies:
- Web Audio API for professional audio processing
- Canvas API for high-performance rendering
- HTML5 Drag and Drop for intuitive interaction
- CSS3 for modern styling and animations
- Vanilla JavaScript for optimal performance
- Font Awesome for iconography

## 🔮 Roadmap

### Upcoming Features
- MIDI controller support
- Advanced beat detection
- Custom shader effects
- WebGL 3D visualizers
- Collaborative editing
- Plugin system

---

**Create stunning audio visualizations with Vithum Studio! 🎵✨**

*Professional-grade audio visualization in your browser*
