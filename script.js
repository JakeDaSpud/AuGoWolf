// AuGoWolf
// Clones the view template once per label entry,
// then pushes input file into every cloned view.

// Shader matrices

const idFileInput = document.getElementById("idFileInput");

const idLabelText = document.getElementById("idLabelText");
const idAddLabelBtn = document.getElementById("idAddLabelBtn");
const idVideoControls = document.getElementById("idVideoControls");

// All video controls
const idVideoTimestamp = document.getElementById("idVideoTimestamp");
const idVideoLength = document.getElementById("idVideoLength");
const idVideoPlayBtn = document.getElementById("idVideoPlayBtn");
const idVideoRestartBtn = document.getElementById("idVideoRestartBtn");
const idVideoMuteBtn = document.getElementById("idVideoMuteBtn");
const idVideoLoopBtn = document.getElementById("idVideoLoopBtn");

const idViewTemplate = document.getElementById("idViewTemplate");
const idViewsContainer = document.getElementById("idViewsContainer");
const idRowAmount = document.getElementById("idRowAmount");
const idColumnAmount = document.getElementById("idColumnAmount");
const idLayoutUrl = document.getElementById("idLayoutUrl");

const views = []; // { root, label, image, video }
let currentFile = null;

const VIDEO_MAX_DESYNC = 0.1; // seconds
let videoMasterInstance = null;
let videoCurrentTime = 0; // seconds
let videoPlaying = false;
let videoMuted = false;
let videoLoops = false;

let viewCount = 0;


function addView(label) {
    const clone = idViewTemplate.content.cloneNode(true);
    
    const root = clone.querySelector(".view");
    const image = clone.querySelector(".viewImage");
    const video = clone.querySelector(".viewVideo");
    const new_label = clone.querySelector(".viewLabel");
    const delete_btn = clone.querySelector(".deleteBtn");

    root.id = "idView-" + viewCount;
    image.id = "idViewImage-" + viewCount;
    video.id = "idViewVideo-" + viewCount;
    delete_btn.id = "idDeleteBtn-" + viewCount;
    new_label.textContent = label;
    
    delete_btn.addEventListener("click", () => {
        deleteView(root.id);
    });

    viewCount++;

    idViewsContainer.appendChild(clone);
    const view = { root, label, image, video };
    views.push(view);

    createMasterVideoInstance();

    // if a file's already loaded, show it in this new view
    if (currentFile) {
        showFileInView(view, currentFile);
    }
}


function deleteView(viewId) {
    const view_to_delete = document.getElementById(viewId);
    if (!view_to_delete) return;

    view_to_delete.remove();

    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx !== -1) {
        views.splice(idx, 1);
    }
}


function updateGridShape() {
    const rows = Math.max(1, Number(idRowAmount.value));
    if (rows == 1) { idRowAmount.innerHTML = "1" }; 
    const columns = Math.max(1, Number(idColumnAmount.value));
    if (columns == 1) { idColumnAmount.innerHTML = "1" };

    idViewsContainer.style.setProperty("--grid-rows", rows);
    idViewsContainer.style.setProperty("--grid-columns", columns);
}


function createMasterVideoInstance() {
    if (!videoMasterInstance && views.length > 0) {
        videoMasterInstance = views[0].video;

        videoMasterInstance.addEventListener("timeupdate", () => {
            videoCurrentTime = videoMasterInstance.currentTime;

            views.forEach(({ video }) => {
                if (video === videoMasterInstance) return;

                const difference = Math.abs(video.currentTime - videoCurrentTime);

                if (difference > VIDEO_MAX_DESYNC) {
                    video.currentTime = videoCurrentTime;
                }
            });

            setCurrentTimestamp();
        });
    }

    return videoMasterInstance;
}


function showFileInView({ image, video }, file) {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (isImage) {
        video.pause();
        video.removeAttribute("src");
        video.hidden = true;
        idVideoControls.hidden = true;

        image.src = url;
        image.hidden = false;
    }

    else if (isVideo) {
        createMasterVideoInstance();

        image.removeAttribute("src");
        image.hidden = true;
        idVideoControls.hidden = false;

        // MAYBE MAKE ONLY ONE VIDEO PLAY AUDIO?
        // IT WORKS BC THEY ALL SYNCED, BUT COULD BE INEFFICIENT?

        video.src = url;
        video.hidden = false;
        
        video.muted = videoMuted;
        video.loop = videoLoops;

        if (videoMasterInstance) {
            video.currentTime = videoMasterInstance.currentTime;
        }

        if (videoPlaying) {
            video.play();
        }
    }
}


function handleAddLabel() {
    const label = idLabelText.value.trim();
    if (!label) return;

    addView(label);
    idLabelText.value = "";
    idLabelText.focus();
}


function handlePlayVideo() {
    videoPlaying = !videoPlaying;

    const master = createMasterVideoInstance();
    if (!master) return;

    if (videoPlaying) {
        idVideoPlayBtn.innerHTML = "Pause";

        views.forEach(({ video }) => {
            video.currentTime = master.currentTime;
            video.play();
        });
    }
    
    else {
        idVideoPlayBtn.innerHTML = "Resume";

        views.forEach(({ video }) => {
            video.pause();
        });
    }
}


function handleRestartVideo() {
    const master = createMasterVideoInstance();
    if (!master) return;

    videoPlaying = false;
    idVideoPlayBtn.innerHTML = "Play";

    master.currentTime = 0;
    
    views.forEach(({ video }) => {
        video.currentTime = 0;
        video.pause();
    });

    videoCurrentTime = 0;
    setCurrentTimestamp();
}


function handleMuteVideo() {
    videoMuted = !videoMuted;

    idVideoMuteBtn.innerHTML = videoMuted ? "Unmute" : "Mute";
    
    views.forEach(({ video }) => {
        video.muted = videoMuted;
    });
}


function handleLoopVideo() {
    videoLoops = !videoLoops;

    idVideoLoopBtn.innerHTML = videoLoops ? "Stop Looping" : "Loop";

    views.forEach(({ video }) => {
        video.loop = videoLoops;
    });
}


function setVideoDuration(file) {
    if (!videoMasterInstance) return;

    const videoUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');

    tempVideo.addEventListener('loadedmetadata', () => {
        const durationInSeconds = tempVideo.duration;
        URL.revokeObjectURL(videoUrl);

        idVideoLength.innerHTML = timeSecToMinSec(durationInSeconds);
    });

    tempVideo.src = videoUrl;
}


function setCurrentTimestamp() {
    if (!videoMasterInstance) return;

    videoCurrentTime = videoMasterInstance.currentTime;

    idVideoTimestamp.innerHTML = timeSecToMinSec(videoCurrentTime);
}


function copyUrl() {
    idLayoutUrl.select();
    document.execCommand('copy');
    alert('Copied to clipboard');
}


function timeSecToMinSec(timeInSeconds) {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


function addAllEventListeners() {
    idAddLabelBtn.addEventListener("click", handleAddLabel);
    idVideoPlayBtn.addEventListener("click", handlePlayVideo);
    idVideoRestartBtn.addEventListener("click", handleRestartVideo);
    idVideoMuteBtn.addEventListener("click", handleMuteVideo);
    idVideoLoopBtn.addEventListener("click", handleLoopVideo);

    idRowAmount.addEventListener("input", updateGridShape);
    idColumnAmount.addEventListener("input", updateGridShape);

    idLayoutUrl.addEventListener("onclick", copyUrl);

    idLabelText.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAddLabel();
    });

    idFileInput.addEventListener("change", () => {
        const file = idFileInput.files[0];
        if (!file) return;

        currentFile = file;

        console.log(file);
        setVideoDuration(currentFile);
        views.forEach((view) => showFileInView(view, file));
    });

    updateGridShape();
}


addAllEventListeners();