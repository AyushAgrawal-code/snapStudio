const video = document.getElementById('video');
const photoModeButton = document.getElementById('photoModeButton');
const videoModeButton = document.getElementById('videoModeButton');
const captureButton = document.getElementById('captureButton');
const stopButton = document.getElementById('stopButton');
const saveButton = document.getElementById('saveButton');
const timerDisplay = document.getElementById('timer');
const themeToggle = document.getElementById('themeToggle');
const pauseButton = document.getElementById('pauseButton');
const continueButton = document.getElementById('continueButton');

let videoStream = null;
let audioStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingTimer = null;
let seconds = 0;
let isRecording = false;
let isPaused = false;
let isVideoMode = false;
let currentFilter = 'none'; // Default filter is none

//.....................................................................................................................
// **Start Camera**
async function startCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    audioStream = await navigator.mediaDevices.getUserMedia({  audio:true });
    video.srcObject = videoStream;
    video.play();
    console.log('Camera started.');
    stopButton.style.display = 'block'; // Show the stop button when the camera starts

    // Dynamic button visibility
    if (isVideoMode) {
      captureButton.style.display = 'block';
      pauseButton.style.display = 'inline-block';
      continueButton.style.display = 'none';
      saveButton.style.display = 'none'; // Hide save button in video mode initially
    } else {
      captureButton.style.display = 'inline-block';
      pauseButton.style.display = 'none';
      continueButton.style.display = 'none';
      saveButton.style.display = 'none'; // Hide save button in photo mode
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Could not access the camera. Please enable permissions.');
  }
}

//...........................................................................................................
// **Stop Camera**
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    console.log('Camera stopped.');
  }
  resetTimer();
  mediaRecorder.stop();
  isRecording = false;
  captureButton.style.display = 'none';
  pauseButton.style.display = 'none';
  continueButton.style.display = 'none';
  saveButton.style.display = 'none';
}

//...........................................................................................................
// **Start Timer**
function startTimer() {
  recordingTimer = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

//..........................................................................................................
// **Stop Timer**
function resetTimer() {
  clearInterval(recordingTimer);
  seconds = 0;
  timerDisplay.textContent = '00:00';
}

//..........................................................................................................
function capturePhoto() {
  if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
    console.error('No valid video stream or resolution is unavailable.');
    alert('Please start the camera and ensure it is working properly before capturing a photo.');
    return;
  }

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const maxWidth = 1920;
  const maxHeight = 1080;
  const videoAspectRatio = video.videoWidth / video.videoHeight;

  // Set canvas dimensions to match video aspect ratio
  if (videoAspectRatio > 1) {
    canvas.width = Math.min(video.videoWidth, maxWidth);
    canvas.height = canvas.width / videoAspectRatio;
    
  } else {
    canvas.height = Math.min(video.videoHeight, maxHeight);
    canvas.width = canvas.height * videoAspectRatio;
  }

  // Get the canvas context and apply the filter
  const ctx = canvas.getContext('2d');
  
  ctx.scale(-1, 1); // Flip horizontally
  ctx.filter = currentFilter; // Apply the same filter used on the video
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

  // Convert canvas content to a data URL for saving
  const dataURL = canvas.toDataURL('image/png');
  console.log('Photo captured with filter:', currentFilter);

  // Pause video for better UX
  video.pause();

  // Display the save button
  saveButton.style.display = 'block';
  saveButton.onclick = () => {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `photo_${canvas.width}x${canvas.height}.png`;
    a.click();

    // Hide the save button and resume video
    saveButton.style.display = 'none';
    video.play();
  };
}

//..........................................................................................................
// **Start Recording**
function startRecording() {
  if (!videoStream) {
    alert('Start the camera first!');
    return;
  }

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set the canvas size to match the video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Create a canvas stream
  const canvasStream = canvas.captureStream();

  // Mirror video filters on canvas frames
  const drawFrame = () => {
    ctx.scale(-1, 1); // Flip horizontally
    ctx.filter = currentFilter; // Apply the filter
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    requestAnimationFrame(drawFrame); // Keep updating frames
  };
  drawFrame();

  // Combine canvas stream with audio (if available) from the original stream
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);

  mediaRecorder = new MediaRecorder(combinedStream);
  recordedChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { mimeType: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    saveButton.style.display = 'block';
    saveButton.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording_with_filters.mp4';
      a.click();
      saveButton.style.display = 'none';
      URL.revokeObjectURL(url);
    };
    console.log('Video recording saved with filter:', currentFilter);
  };

  mediaRecorder.start();
  isRecording = true;
  startTimer();
  captureButton.textContent = '⏹ Stop Recording';
  pauseButton.style.display = 'inline-block';
  continueButton.style.display = 'none';
  console.log('Recording started with filters.');
}


//..........................................................................................................
// **Stop Recording**
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    console.log('Recording stopped.');
    resetTimer();
    isRecording = false;
    captureButton.textContent = '🎥 Start Recording';
    pauseButton.style.display = 'none';
    continueButton.style.display = 'none';
  } else {
    console.error('MediaRecorder is not initialized or recording has already stopped.');
  }
}

//..........................................................................................................
// **Pause Recording**
function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    isPaused = true;
    video.pause();

    // Pause the timer
    clearInterval(recordingTimer);

    pauseButton.style.display = 'none';
    continueButton.style.display = 'inline-block';

    console.log('Recording paused.');
  } else {
    console.error('Cannot pause recording: MediaRecorder is not recording.');
  }
}

//..........................................................................................................
// **Continue Recording**
function continueRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {

    mediaRecorder.resume();
    isPaused = false;
    video.play();
    // Resume the timer without resetting it
    startTimer();

    pauseButton.style.display = 'inline-block';
    continueButton.style.display = 'none';

    console.log('Recording resumed.');
  } else {
    console.error('Cannot resume recording: MediaRecorder is not paused.');
  }
}

//..........................................................................................................
// **Apply Filter**
function applyFilter(filter) {
  currentFilter = filter;
  video.style.filter = filter;
  console.log(`Filter applied: ${filter}`);
}

//..........................................................................................................
// **Reset Filter**
function resetFilter() {
  currentFilter = 'none';
  video.style.filter = 'none';
  console.log('Filters reset.');
}

//..........................................................................................................
// **Theme Toggle**
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

//..........................................................................................................
// **Event Listeners**
photoModeButton.addEventListener('click', () => {
  isVideoMode = false;
  captureButton.textContent = '📷 Capture Photo';
  captureButton.style.display = 'inline-block';
  pauseButton.style.display = 'none';
  continueButton.style.display = 'none';
  saveButton.style.display = 'none';
  startCamera();
});

videoModeButton.addEventListener('click', () => {
  isVideoMode = true;
  pauseButton.style.display = 'inline-block';
  continueButton.style.display = 'none';
  captureButton.textContent = '🎥 Start Recording';
  captureButton.style.display = 'block';
  saveButton.style.display = 'none';
  startCamera();
});

captureButton.addEventListener('click', () => {
  if (isVideoMode) {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  } else {
    capturePhoto();
  }
});

pauseButton.addEventListener('click', pauseRecording);
continueButton.addEventListener('click', continueRecording);
stopButton.addEventListener('click', stopCamera);

console.log('PhotoSnap Studio initialized.');
