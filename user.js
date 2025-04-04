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
const reverseCameraButton = document.getElementById('reverseCameraButton');


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
let isFront = true;
let facingMode = "user"

//.....................................................................................................................
// function for reversing camera
function reverse() {
    isFront = !isFront; // Toggle camera
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    startCamera();
  }
  
  


reverseCameraButton.addEventListener('click',reverse);

//.....................................................................................................................
// **Start Camera**
async function startCamera() {
  try {
    var facingMode = isFront ? "user" : "environment";
    videoStream = await navigator.mediaDevices.getUserMedia({ video:
      { facingMode: { ideal: facingMode } }
     });
    audioStream = await navigator.mediaDevices.getUserMedia({  audio:true });
    video.srcObject = videoStream;
    video.play();
    console.log('Camera started.');
    stopButton.style.display = 'block'; // Show the stop button when the camera starts
    if (isFront) {
      video.style.transform = "scaleX(-1)"; // Mirror for front camera
    } else {
      video.style.transform = "none"; // Normal for rear camera
    }
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
    audioStream.getTracks().forEach((track) => track.stop());
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
async function capturePhoto() {
    if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('No valid video stream or resolution is unavailable.');
      alert('Please start the camera and ensure it is working properly before capturing a photo.');
      return;
    }
  
    const canvas = document.createElement('canvas');
    const maxWidth = 1920, maxHeight = 1080;
    const videoAspectRatio = video.videoWidth / video.videoHeight;
  
    if (videoAspectRatio > 1) {
      canvas.width = Math.min(video.videoWidth, maxWidth);
      canvas.height = canvas.width / videoAspectRatio;
    } else {
      canvas.height = Math.min(video.videoHeight, maxHeight);
      canvas.width = canvas.height * videoAspectRatio;
    }
  
    const ctx = canvas.getContext('2d');
  
    if (isFront) {
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
    }
  
    ctx.filter = currentFilter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    const dataURL = canvas.toDataURL('image/png');
    console.log('Photo captured with filter:', currentFilter);
  
    video.pause();
  
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      try {
        const cloudinaryURL = await uploadToCloudinary(dataURL); // ✅ Upload to Cloudinary
        if (cloudinaryURL) {
          writeToAirtable(email, cloudinaryURL); // ✅ Save Cloudinary URL to Airtable
          alert("Photo saved successfully!");
        } else {
          alert("Failed to upload photo.");
        }
      } catch (error) {
        console.error("Error saving photo:", error);
        alert("An error occurred.");
      }
  
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
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    const canvasStream = canvas.captureStream();
  
    const drawFrame = () => {
      ctx.save();
      if (isFront) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }
      ctx.filter = currentFilter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      requestAnimationFrame(drawFrame);
    };
    drawFrame();
  
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
  
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/mp4' });
      const fileReader = new FileReader();
  
      fileReader.onloadend = async function () {
        const videoDataURL = fileReader.result;
  
        const cloudinaryURL = await uploadToCloudinary(videoDataURL); // ✅ Upload video
        if (cloudinaryURL) {
          writeToAirtable(email, null, cloudinaryURL); // ✅ Save Cloudinary URL to Airtable
          alert("Video saved successfully!");
        } else {
          alert("Failed to upload video.");
        }
      };
  
      fileReader.readAsDataURL(blob);
    };
  
    mediaRecorder.start();
    isRecording = true;
    startTimer();
    captureButton.textContent = '⏹ Stop Recording';
    pauseButton.style.display = 'inline-block';
    continueButton.style.display = 'none';
  }
  

//..........................................................................................................
// **Stop Recording**
function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      console.log('Camera stopped.');
    }
  
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
  
    resetTimer();
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  
    isRecording = false;
    captureButton.style.display = 'none';
    pauseButton.style.display = 'none';
    continueButton.style.display = 'none';
    saveButton.style.display = 'none';
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




//...................................................................................

let email =" ";

document.addEventListener("DOMContentLoaded", function () {
    // Fetch user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    
    if (!userData) {
        alert("You must log in first!");
        window.location.href = "login.html"; // Redirect to login if no user is found
    } else {
        console.log("User data:", userData); // Debugging
        
        // Ensure the element exists before trying to update it
        const userNameElement = document.getElementById("user-name");
        if (userNameElement) {
            userNameElement.innerText = userData.Name || "User";
            email = userData.email||"email";
            console.log(userData.email);
        } else {
            console.error("Element with ID 'user-name' not found in the DOM.");
        }
    }
});

const BASE_ID = "appSunSHf6bdvfsLj"; // Replace with your Airtable Base ID
const TABLE_NAME = "user_data"; // Replace with your Table Name or friendly name
const API_KEY = "patrBN0pEEoKIgr8j.0a00b86c77c9ddd225c5e7d9d74a2f8e4e1ced5115ab56137dec66358fb0c5d7"; // Replace with your Airtable API Key


// document.getElementById("saveButton").addEventListener(onclick,()=>{
    
    // ✅ Function to write user data to Airtable
    async function writeToAirtable(email, photo, video) {
        console.log("🔹 Entered writeToAirtable function");
        console.log("Email:", email);
        console.log("Photo URL:", photo);
        console.log("Video URL:", video);
      
        const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
        
        // ✅ Construct Airtable record
        const record = {
          records: [
            {
              fields: {
                email: email, // Email field in Airtable
      
                // ✅ Only include photo if it's provided
                ...(photo && { 
                  photo: [{ url: photo }] 
                }),
      
                // ✅ Only include video if it's provided
                ...(video && { 
                  video: [{ url: video }] 
                }),
              },
            },
          ],
        };
      
        console.log("🔹 Preparing to send data to Airtable...");
      
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
          });
      
          const responseBody = await response.json();
      
          if (response.ok) {
            console.log("✅ Data successfully written to Airtable:", responseBody);
          } else {
            alert("❌ Error uploading to Airtable. Please try again.");
            console.error("❌ Airtable response error:", responseBody);
          }
        } catch (error) {
          console.error("❌ Fetch error:", error);
        }
      }
      
//.......................................................................................
      async function uploadToCloudinary(dataURL) {
        const cloudName = "snapstudio";  
        const uploadPreset = "SnapUpload";  
    
        const blob = await fetch(dataURL).then(res => res.blob());
        
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", uploadPreset);
    
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: "POST",
                body: formData
            });
    
            const data = await response.json();
            if (data.secure_url) {
                return data.secure_url;
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            return null;
        }
    }
    