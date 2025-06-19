# 🎵 Vithum - Audio Visualizer Studio

A powerful web-based audio visualizer creation studio with drag-and-drop functionality, real-time audio processing, and advanced visual effects.

## ✨ Features

### 🎨 Visual Studio
- **Drag & Drop Interface**: Intuitive drag-and-drop visualizer creation
- **Multiple Visualizer Types**: Waveform, Frequency Bars, Circle, Spiral, Radial, Particles, and Spectrum visualizers
- **Real-time Preview**: See visualizers react to audio in real-time
- **Visual Selection Cues**: Clear visual feedback for selected vs unselected visualizers
- **Precise Controls**: Resize, rotate, and scale visualizers with handles
- **Layering System**: Multiple visualizers on a single canvas with proper layering

### 🎵 Audio Processing
- **Web Audio API**: Professional-grade audio processing
- **Multiple Input Sources**: Load audio files or use microphone input
- **Real-time Analysis**: FFT analysis for frequency and time domain data
- **Audio Reactive**: All visualizers respond to audio in real-time
- **Customizable Sensitivity**: Adjust how visualizers react to audio

### 🎛️ Advanced Controls
- **Properties Panel**: Detailed property editing for each visualizer
- **Transform Controls**: Position, size, rotation, and scale
- **Appearance Settings**: Colors, opacity, stroke width, backgrounds
- **Audio Settings**: Sensitivity, smoothing, audio reactivity
- **Animation Controls**: Speed, pulse strength, rotation speed

### 💾 Project Management
- **Save/Load Projects**: Save your work as JSON files
- **Auto-save**: Automatic project backup every minute
- **Export Options**: Export as PNG images (video export coming soon)
- **Keyboard Shortcuts**: Efficient workflow with keyboard shortcuts

## 🚀 Getting Started

### Installation
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process required - pure HTML, CSS, and JavaScript!

### Quick Start
1. **Load Audio**: Click "Load Audio" and select an audio file
2. **Add Visualizers**: Drag visualizers from the left panel to the canvas, or double-click to add
3. **Customize**: Select visualizers and edit properties in the right panel
4. **Play**: Hit the play button to see your visualizers react to music
5. **Save**: Use Ctrl+S to save your project

## 🎮 Controls

### Mouse Controls
- **Click**: Select visualizer
- **Drag**: Move selected visualizer
- **Handles**: Resize visualizer (corner and edge handles)
- **Rotation Handle**: Rotate visualizer (blue circle above selection)
- **Canvas**: Pan around canvas when no visualizer selected

### Keyboard Shortcuts
- **Arrow Keys**: Move selected visualizer (Shift for larger steps)
- **Delete/Backspace**: Remove selected visualizer
- **Escape**: Deselect current visualizer
- **Ctrl+N**: New project
- **Ctrl+O**: Open project
- **Ctrl+S**: Save project
- **Ctrl+E**: Export project
- **Space**: Play/pause audio

### Touch Support
- Full touch support for mobile and tablet devices
- Touch to select, drag to move, pinch to zoom

## 🎨 Visualizer Types

### Basic Visualizers
- **Waveform**: Classic audio waveform display
- **Frequency Bars**: Traditional spectrum analyzer bars
- **Circle**: Pulsing circle that reacts to volume
- **Spiral**: Animated spiral with frequency-reactive radius

### Advanced Visualizers
- **Radial**: Radial lines extending from center based on frequencies
- **Particles**: Particle system that reacts to audio energy
- **Spectrum**: Advanced spectrum display with gradient options

## 🔧 Browser Support

### Recommended Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- Web Audio API
- Canvas 2D
- File API
- Drag and Drop API
- Local Storage

## 📁 Project Structure

```
Vithum/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── js/
│   ├── app.js         # Main application entry point
│   ├── utils.js       # Utility functions
│   ├── visualizers.js # Visualizer classes and rendering
│   ├── canvas.js      # Canvas management and interactions
│   ├── audio.js       # Audio processing and Web Audio API
│   └── ui.js          # UI management and user interactions
├── README.md          # This file
└── LICENSE           # License information
```

## 🎯 Usage Examples

### Creating a Simple Visualizer
1. Load an audio file
2. Drag a "Frequency Bars" visualizer to the canvas
3. Adjust the color in the properties panel
4. Set sensitivity to 1.5 for more reactive response
5. Press play and enjoy!

### Advanced Setup
1. Add multiple visualizers (waveform + particles + circle)
2. Position them in different areas of the canvas
3. Set different colors for each
4. Adjust individual sensitivities
5. Add rotation to the circle visualizer
6. Save your project for later use

## 🛠️ Customization

### Adding New Visualizer Types
1. Create a new class extending `BaseVisualizer` in `visualizers.js`
2. Implement the `render()` method
3. Add the type to `VisualizerFactory.create()`
4. Add UI elements in `index.html`

### Modifying Audio Processing
- Adjust FFT size in `AudioManager` for different frequency resolution
- Modify smoothing constants for different response characteristics
- Add new audio analysis functions (beat detection, onset detection, etc.)

## 🎪 Advanced Features

### Audio Analysis
- Real-time FFT analysis
- Volume, bass, mids, treble extraction
- Beat detection (basic implementation included)
- Customizable analysis window sizes

### Performance Optimization
- Efficient canvas rendering
- RAF-based animation loop
- Automatic performance monitoring
- Memory-conscious audio processing

### Extensibility
- Plugin-ready architecture
- Event-driven design
- Modular component system
- Easy to extend with new features

## 🐛 Troubleshooting

### Audio Issues
- **No audio**: Check if file is supported (MP3, WAV, OGG)
- **No visualization**: Ensure audio is playing and visualizers are added
- **Poor performance**: Try reducing the number of visualizers

### Browser Issues
- **Features not working**: Update to a supported browser version
- **Drag and drop not working**: Check if browser supports HTML5 drag and drop
- **Audio context errors**: User interaction required before audio can play

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🎉 Credits

Built with modern web technologies:
- Web Audio API for audio processing
- Canvas API for rendering
- HTML5 Drag and Drop for interaction
- CSS3 for beautiful styling
- Vanilla JavaScript for performance

---

**Enjoy creating amazing audio visualizations with Vithum Studio! 🎵✨**
Audio Visualizer Creation Studio
