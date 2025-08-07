# Gonio-Visualizer

The **Gonio Visualizer** is a real-time stereo audio visualization tool that displays a goniometer-style representation of the stereo field.  
It provides an engaging, customizable view of audio signals using HTML5 Canvas and the Web Audio API.

Test Here: https://samnzito.github.io/Gonio-Visualizer/

## 🎯 Features

- **Stereo Goniometer Visualization**  
  Displays the stereo image of left and right audio channels in real time.
  
- **Multiple Color Modes**  
  - `Static` – Fixed dot color (default green).  
  - `Gradient` – Slowly shifting hue over time.  
  - `Spectrum` – Color based on dot position.

- **Particle Mode**  
  Adds particle effects for a more dynamic display.

- **Audio Controls**  
  - Play / Pause  
  - Rewind / Forward (10 seconds)  
  - Volume adjustment  
  - Timeline scrubber with time display  

- **File Loading**  
  Load audio files from the local system via file picker.

- **Fullscreen Mode**  
  Immersive visualization with auto-hiding controls.

- **Responsive Canvas**  
  Automatically resizes and scales to fit the window.

## 📂 Project Structure
```
.
├── js/audioProcessor.js # Handles audio loading, playback, channel data, and analysis
├── js/gonioVisualizer.js # Draws the goniometer visualization on a canvas
├── js/main.js # UI logic, event handling, and animation loop
├── style.css # style sheet
└── index.html # HTML layout for controls and canvas
```

### `audioProcessor.js`
- Uses the Web Audio API to:
  - Load audio from a file
  - Split into left and right channels
  - Provide time-domain and frequency data
  - Control playback, seeking, and volume
  - Optional beat detection

### `gonioVisualizer.js`
- Draws the stereo image using:
  - (Left - Right) for **X-axis**
  - (Left + Right) for **Y-axis**
- Supports persistence trails, point size adjustments, and particle rendering.
- Color modes change the visualization’s look in real time.

### `main.js`
- Connects the UI to the audio processor and visualizer.
- Handles:
  - File input
  - Play/pause, rewind, forward buttons
  - Volume & timeline sliders
  - Color mode & particle mode toggles
  - Fullscreen mode with hidden controls
  - Continuous animation loop

## 🚀 Usage

1. Open the project in a browser that supports the Web Audio API.
2. Click the **Music** button to select an audio file from your computer.
3. Use the **Play/Pause**, **Rewind**, and **Forward** buttons to control playback.
4. Adjust **Volume** and scrub through the track with the **Timeline** slider.
5. Use **Color Mode** to switch between static, gradient, and spectrum styles.
6. Enable **Particle Mode** for extra visual effects.
7. Click **Fullscreen** for an immersive experience.

## 🎨 Controls

| Control            | Action |
|--------------------|--------|
| ▶ / ⏸ Play/Pause   | Start or pause playback |
| ⏪ Rewind           | Skip back 10s |
| ⏩ Forward          | Skip ahead 10s |
| 🎨 Color Mode      | Cycle visualization colors |
| ✨ Particle Mode   | Toggle particle effects |
| ⛶ Fullscreen      | Toggle fullscreen display |
| 🔊 Volume Slider  | Adjust playback volume |
| 📜 Timeline Slider | Seek through the track |

**Keyboard Shortcuts:**
- `Space` – Play/Pause
- `←` – Rewind 10s
- `→` – Forward 10s
- `M` – Mute/Unmute
- `F` – Toggle Fullscreen

## 🛠 Requirements
- Modern web browser (Chrome, Edge, Firefox, Safari) with Web Audio API support
- JavaScript enabled

## 📜 License
This project is provided as-is for educational and personal use.
