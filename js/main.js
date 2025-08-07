// Declare audioProcessor in the global scope
let audioProcessor;

document.addEventListener('DOMContentLoaded', async () => {
    // Get DOM elements
    const audioInput = document.getElementById('audioInput');
    const playPauseButton = document.getElementById('playPauseButton');
    const rewindButton = document.getElementById('rewindButton');
    const forwardButton = document.getElementById('forwardButton');
    const musicButton = document.getElementById('musicButton');
    // Remove reference to favorite button
    const currentTrack = document.getElementById('currentTrack');
    const volumeSlider = document.getElementById('volumeSlider');
    const timelineSlider = document.getElementById('timelineSlider');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    
    // Initialize audio processor and visualizer
    audioProcessor = new AudioProcessor();
    const success = await audioProcessor.initialize();
    
    if (!success) {
        alert('Failed to initialize audio system. Please check your browser compatibility.');
        return;
    }
    
    const visualizer = new GonioVisualizer('gonioCanvas');
    
    // Format time in MM:SS format
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) seconds = 0;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Music button opens file selector
    musicButton.addEventListener('click', () => {
        audioInput.click();
    });
    
    // Handle file selection
    audioInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            currentTrack.textContent = 'Loading...';
            await audioProcessor.loadAudio(file);
            currentTrack.textContent = file.name;
            
            // Enable play button
            playPauseButton.disabled = false;
            rewindButton.disabled = false;
            forwardButton.disabled = false;
            
            // Update play/pause button icon
            const playPauseIcon = playPauseButton.querySelector('i');
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
            
            // Enable timeline slider and set max value to duration
            const duration = audioProcessor.getDuration();
            timelineSlider.disabled = false;
            timelineSlider.min = 0;
            timelineSlider.max = duration;
            timelineSlider.value = 0;
            
            // Update total time display
            totalTimeDisplay.textContent = formatTime(duration);
            currentTimeDisplay.textContent = "0:00";
        } catch (error) {
            alert('Error loading audio file. Please try another file.');
            currentTrack.textContent = 'Error loading file';
        }
    });
    
    // Handle play/pause button
    playPauseButton.addEventListener('click', () => {
        if (!audioProcessor.audioBuffer) return;
        
        const playPauseIcon = playPauseButton.querySelector('i');
        
        if (audioProcessor.isPlaying) {
            // Currently playing, so pause
            audioProcessor.pause();
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
        } else {
            // Currently paused, so play
            audioProcessor.play();
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
        }
    });
    
    // Handle rewind button (skip back 10 seconds)
    rewindButton.addEventListener('click', () => {
        if (audioProcessor.audioBuffer) {
            const newTime = Math.max(0, audioProcessor.getCurrentTime() - 10);
            audioProcessor.seek(newTime);
        }
    });
    
    // Handle forward button (skip ahead 10 seconds)
    forwardButton.addEventListener('click', () => {
        if (audioProcessor.audioBuffer) {
            const newTime = Math.min(audioProcessor.getDuration(), audioProcessor.getCurrentTime() + 10);
            audioProcessor.seek(newTime);
        }
    });
    
    // Toggle favorite button
    // Remove the favorite button event listener section
    
    // Handle volume slider
    // Volume slider
    volumeSlider.addEventListener('input', () => {
        const volumeValue = parseFloat(volumeSlider.value);
        audioProcessor.setVolume(volumeValue);
    });
    
    // Handle timeline slider change (when user drags)
    timelineSlider.addEventListener('input', () => {
        // Update time display while dragging
        currentTimeDisplay.textContent = formatTime(parseFloat(timelineSlider.value));
    });
    
    // Handle timeline slider change (when user releases)
    timelineSlider.addEventListener('change', () => {
        const seekTime = parseFloat(timelineSlider.value);
        audioProcessor.seek(seekTime);
    });
    
    // Update timeline slider and time display during playback
    function updateTimeDisplay() {
        if (audioProcessor.audioBuffer) {
            const currentTime = audioProcessor.getCurrentTime();
            
            // Only update if not currently being dragged by user
            if (!timelineSlider.matches(':active')) {
                timelineSlider.value = currentTime;
                currentTimeDisplay.textContent = formatTime(currentTime);
            }
        }
        requestAnimationFrame(updateTimeDisplay);
    }
    
    // Start time display update loop
    updateTimeDisplay();
    
    // Animation loop for visualization
    function animate() {
        if (audioProcessor.isPlaying) {
            const { leftData, rightData } = audioProcessor.getChannelData();
            visualizer.update(leftData, rightData);
            
            // Update play/pause button if needed (in case playback ends)
            if (!audioProcessor.isPlaying) {
                const playPauseIcon = playPauseButton.querySelector('i');
                playPauseIcon.classList.remove('fa-pause');
                playPauseIcon.classList.add('fa-play');
            }
        }
        requestAnimationFrame(animate);
    }
    
    // Start animation loop
    animate();
    
    // Color mode button
    const colorModeButton = document.getElementById('colorModeButton');
    colorModeButton.addEventListener('click', () => {
        // Cycle through color modes: static -> gradient -> spectrum -> static
        if (visualizer.colorMode === 'static') {
            visualizer.colorMode = 'gradient';
            visualizer.colorHue = 120; // Reset to green hue when entering gradient mode
            colorModeButton.classList.add('active');
        } else if (visualizer.colorMode === 'gradient') {
            visualizer.colorMode = 'spectrum';
            colorModeButton.classList.add('active');
        } else {
            visualizer.colorMode = 'static';
            visualizer.dotColor = 'rgb(0, 255, 0)'; // Reset to default green color
            colorModeButton.classList.remove('active');
        }
    });
    
    // Particle mode button
    const particleModeButton = document.getElementById('particleModeButton');
    particleModeButton.addEventListener('click', () => {
        visualizer.particleMode = !visualizer.particleMode;
        particleModeButton.classList.toggle('active', visualizer.particleMode);
    });
    
    // Fullscreen button
    const fullscreenButton = document.getElementById('fullscreenButton');
    const container = document.querySelector('.container');
    // Define controls that should be hidden in fullscreen mode
    const controls = [
    document.querySelector('.timeline-control'),
    document.querySelector('.player-controls'),
    document.querySelector('.info')
    ];
    
    let controlsTimeout;
    
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            
            // Hide controls after a delay
            hideControlsWithDelay();
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            
            // Always show controls when not in fullscreen
            showControls();
        }
    });
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
        updateFullscreenButton();
        
        if (document.fullscreenElement) {
            // Entered fullscreen, hide controls after delay
            hideControlsWithDelay();
        } else {
            // Exited fullscreen, always show controls
            showControls();
        }
    }
    
    function updateFullscreenButton() {
        const icon = fullscreenButton.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }
    
    // Show controls
    function showControls() {
        controls.forEach(control => {
            control.classList.remove('hidden');
        });
    }
    
    // Hide controls
    function hideControls() {
        controls.forEach(control => {
            control.classList.add('hidden');
        });
    }
    
    // Hide controls after a delay
    function hideControlsWithDelay() {
        clearTimeout(controlsTimeout);
        showControls();
        controlsTimeout = setTimeout(() => {
            if (document.fullscreenElement) {
                hideControls();
            }
        }, 3000); // Hide after 3 seconds of inactivity
    }
    
    // Show controls on mouse movement when in fullscreen
    container.addEventListener('mousemove', () => {
        if (document.fullscreenElement) {
            hideControlsWithDelay();
        }
    });
    
    // Add touch event support for mobile devices
    container.addEventListener('touchmove', () => {
        if (document.fullscreenElement) {
            hideControlsWithDelay();
        }
    });
    
    // Prevent default touch behavior to avoid scrolling issues
    document.addEventListener('touchmove', (e) => {
        if (e.target.id === 'gonioCanvas' || 
            e.target.closest('.player-controls') || 
            e.target.closest('.timeline-control')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Add playlist support
    let playlist = [];
    let currentTrackIndex = -1;
    
    // Function to load and play a track from the playlist
    function loadTrackFromPlaylist(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentTrackIndex = index;
        const track = playlist[index];
        
        // Update UI
        currentTrack.textContent = track.name;
        
        // Load and play the track
        audioProcessor.loadAudioFromUrl(track.url).then(() => {
            // Enable controls
            playPauseButton.disabled = false;
            rewindButton.disabled = false;
            forwardButton.disabled = false;
            
            // Update timeline
            const duration = audioProcessor.getDuration();
            timelineSlider.disabled = false;
            timelineSlider.min = 0;
            timelineSlider.max = duration;
            timelineSlider.value = 0;
            
            // Update time display
            totalTimeDisplay.textContent = formatTime(duration);
            currentTimeDisplay.textContent = "0:00";
            
            // Start playback
            audioProcessor.play();
            const playPauseIcon = playPauseButton.querySelector('i');
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
        });
    }
    
    // Add next/previous track buttons
    document.getElementById('previousTrackButton').addEventListener('click', () => {
        if (currentTrackIndex > 0) {
            loadTrackFromPlaylist(currentTrackIndex - 1);
        }
    });
    
    document.getElementById('nextTrackButton').addEventListener('click', () => {
        if (currentTrackIndex < playlist.length - 1) {
            loadTrackFromPlaylist(currentTrackIndex + 1);
        }
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Space bar - toggle play/pause
    if (event.code === 'Space') {
        playPauseButton.click();
        event.preventDefault();
    }
    
    // Left arrow - rewind
    if (event.code === 'ArrowLeft') {
        rewindButton.click();
        event.preventDefault();
    }
    
    // Right arrow - forward
    if (event.code === 'ArrowRight') {
        forwardButton.click();
        event.preventDefault();
    }
    
    // M key - mute/unmute
    if (event.code === 'KeyM') {
        if (volumeSlider.value > 0) {
            volumeSlider.dataset.lastVolume = volumeSlider.value;
            volumeSlider.value = 0;
        } else {
            volumeSlider.value = volumeSlider.dataset.lastVolume || 1;
        }
        
        // Make sure to convert the string value to a number
        const volumeValue = parseFloat(volumeSlider.value);
        
        // Apply the volume change to the audio processor
        audioProcessor.setVolume(volumeValue);
        
        // Debug output to verify the volume is being set
        console.log("Volume set to:", volumeValue);
        
        event.preventDefault();
    }
    
    // F key - toggle fullscreen
    if (event.code === 'KeyF') {
        document.getElementById('fullscreenButton').click();
        event.preventDefault();
    }
});

// Add event listeners for visualization controls
    // Get visualization control buttons
    const colorModeButton = document.getElementById('colorModeButton');
    const particleModeButton = document.getElementById('particleModeButton');
    const fullscreenButton = document.getElementById('fullscreenButton');
    
    // Color mode button - cycles through static, gradient, and spectrum modes
    colorModeButton.addEventListener('click', () => {
        // Cycle through color modes: static -> gradient -> spectrum -> static
        if (visualizer.colorMode === 'static') {
            visualizer.colorMode = 'gradient';
            colorModeButton.classList.add('active');
        } else if (visualizer.colorMode === 'gradient') {
            visualizer.colorMode = 'spectrum';
            colorModeButton.classList.add('active');
        } else {
            visualizer.colorMode = 'static';
            visualizer.dotColor = 'rgb(0, 255, 0)'; // Reset to default green color
            colorModeButton.classList.remove('active');
        }
    });
    
    // Handle particle mode button
    particleModeButton.addEventListener('click', () => {
        // Toggle particle mode
        visualizer.particleMode = !visualizer.particleMode;
        
        // Update button appearance
        particleModeButton.classList.toggle('active');
    });
    
    // Fullscreen button (if you want to implement this as well)
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    
    function updateFullscreenButton() {
        const icon = fullscreenButton.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
    }
    
    // Add playlist support
    let playlist = [];
    let currentTrackIndex = -1;
    
    // Function to load and play a track from the playlist
    function loadTrackFromPlaylist(index) {
        if (index < 0 || index >= playlist.length) return;
        
        currentTrackIndex = index;
        const track = playlist[index];
        
        // Update UI
        currentTrack.textContent = track.name;
        
        // Load and play the track
        audioProcessor.loadAudioFromUrl(track.url).then(() => {
            // Enable controls
            playPauseButton.disabled = false;
            rewindButton.disabled = false;
            forwardButton.disabled = false;
            
            // Update timeline
            const duration = audioProcessor.getDuration();
            timelineSlider.disabled = false;
            timelineSlider.min = 0;
            timelineSlider.max = duration;
            timelineSlider.value = 0;
            
            // Update time display
            totalTimeDisplay.textContent = formatTime(duration);
            currentTimeDisplay.textContent = "0:00";
            
            // Start playback
            audioProcessor.play();
            const playPauseIcon = playPauseButton.querySelector('i');
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
        });
    }
    
    // Add next/previous track buttons
    document.getElementById('previousTrackButton').addEventListener('click', () => {
        if (currentTrackIndex > 0) {
            loadTrackFromPlaylist(currentTrackIndex - 1);
        }
    });
    
    document.getElementById('nextTrackButton').addEventListener('click', () => {
        if (currentTrackIndex < playlist.length - 1) {
            loadTrackFromPlaylist(currentTrackIndex + 1);
        }
    });
// Now your keyboard event handler can access audioProcessor
document.addEventListener('keydown', (event) => {
    if (event.key === 'm') {
        const volumeValue = parseFloat(document.getElementById('volumeSlider').value);
        audioProcessor.setVolume(volumeValue);
    }
});
