// AuGoWolf
// Clones the view template once per label entry,
// then pushes input file into every cloned view.

const idControls = document.getElementById("idControls");
const idFullscreenControls = document.getElementById("idFullscreenControls");
const idFileInput = document.getElementById("idFileInput");

// Master Sources
const idMasterImageSource = document.getElementById("idMasterImageSource");
const idMasterVideoSource = document.getElementById("idMasterVideoSource");

const idLabelText = document.getElementById("idLabelText");
const idAddLabelBtn = document.getElementById("idAddLabelBtn");
const idAddEmptyViewBtn = document.getElementById("idAddEmptyViewBtn");

const idTotalViewCount = document.getElementById("idTotalViewCount");
const idVisibleViewCount = document.getElementById("idVisibleViewCount");
const idEmptyViewCount = document.getElementById("idEmptyViewCount");

// All video controls
const idVideoControls = document.getElementById("idVideoControls");
const idVideoTimestamp = document.getElementById("idVideoTimestamp");
const idVideoLength = document.getElementById("idVideoLength");

const idVideoPlayBtn = document.getElementById("idVideoPlayBtn");
const idVideoRestartBtn = document.getElementById("idVideoRestartBtn");

const idVideoSubtract5Btn = document.getElementById("idVideoSubtract5Btn");
const idVideoSubtract10Btn = document.getElementById("idVideoSubtract10Btn");

const idVideoAdd5Btn = document.getElementById("idVideoAdd5Btn");
const idVideoAdd10Btn = document.getElementById("idVideoAdd10Btn");

const idVideoMuteBtn = document.getElementById("idVideoMuteBtn");
const idVideoLoopBtn = document.getElementById("idVideoLoopBtn");

const idViewTemplate = document.getElementById("idViewTemplate");
const idEmptyViewTemplate = document.getElementById("idEmptyViewTemplate");
const idViewsContainer = document.getElementById("idViewsContainer");
const idColumnAmount = document.getElementById("idColumnAmount");
const idLayoutUrl = document.getElementById("idLayoutUrl");

const idEnterFullscreen = document.getElementById("idEnterFullscreen");
const idExitFullscreen = document.getElementById("idExitFullscreen");

const views = []; // { root, label, image, video }
let currentFile = null;

const VIDEO_MAX_DESYNC = 0.1; // seconds
let videoMasterInstance = null;
let videoCurrentTime = 0; // seconds
let videoDuration = 0; // seconds
let videoPlaying = false;
let videoMuted = false;
let videoLoops = false;

let viewUidTracker = 0; // Actually the UID tracker
let totalCurrentVisibleViews = 0;
let totalCurrentEmptyViews = 0;


function addView(label) {
    const clone = idViewTemplate.content.cloneNode(true);
    
    const root = clone.querySelector(".view");
    const new_label = clone.querySelector(".viewLabel");
    
    //const image = clone.querySelector(".viewImage");
    //const video = clone.querySelector(".viewVideo");
    const canvas = clone.querySelector(".glslCanvas");
    const sandbox = new GlslCanvas(canvas);
    
    const shader_type = clone.querySelector(".shaderType");
    const shader_severity = clone.querySelector(".shaderSeverity");
    const shader_severity_label = clone.querySelector(".severityLabel");
    const delete_btn = clone.querySelector(".deleteBtn");

    root.id = "idView-" + viewUidTracker;
    new_label.textContent = label;
    
    //image.id = "idViewImage-" + viewUidTracker;
    //video.id = "idViewVideo-" + viewUidTracker;
    canvas.id = "idViewCanvas-" + viewUidTracker;
    
    shader_type.id = "idShaderType-" + viewUidTracker;
    shader_type.addEventListener("change", (e) => {
        setShaderType(root.id, e.target.value);
    });

    shader_severity.id = "idShaderSeverity-" + viewUidTracker;
    shader_severity.addEventListener("change", (e) => {
        setShaderSeverity(root.id, e.target.value);
        
        if (shader_severity_label) {
            shader_severity_label.textContent = e.target.value;
        }
    });

    delete_btn.id = "idDeleteBtn-" + viewUidTracker;
    delete_btn.addEventListener("click", () => {
        deleteView(root.id);
    });

    viewUidTracker++;
    totalCurrentVisibleViews++;


    idViewsContainer.appendChild(clone);
    const view = {
        root,
        label,
        //image,
        //video,
        canvas,
        sandbox, // GlslCanvas Object

        shaderType: ColourShader.NONE,
        severity: 0.5,
    };

    views.push(view);

    createMasterVideoInstance();

    // if a file's already loaded, show it in this new view
    if (currentFile) {
        showFileInView(view, currentFile);
    }
}


function addEmptyView() {
    const clone = idEmptyViewTemplate.content.cloneNode(true);

    const root = clone.querySelector(".emptyView");
    const delete_btn = clone.querySelector(".deleteBtn");

    root.id = "idView-" + viewUidTracker;
    delete_btn.id = "idDeleteBtn-" + viewUidTracker;

    delete_btn.addEventListener("click", () => {
        deleteView(root.id);
    });

    viewUidTracker++;
    totalCurrentEmptyViews++;

    idViewsContainer.appendChild(clone);
    const view = { root };
    views.push(view);
}


function deleteView(viewId) {
    const view_to_delete = document.getElementById(viewId);
    if (!view_to_delete) return;

    if (view_to_delete.className == "view") {
        totalCurrentVisibleViews--;
    } else if (view_to_delete.className == "emptyView") {
        totalCurrentEmptyViews--;
    }
    
    view_to_delete.remove();
    
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx !== -1) {
        const wasMaster = views[idx].video && views[idx].video === videoMasterInstance;
        
        if (views[idx].sandbox) {
            views[idx].sandbox.destroy();
        }

        views.splice(idx, 1);    

        if (wasMaster) {
            videoMasterInstance = null;
            createMasterVideoInstance();
        }

        if (videoMasterInstance == null) {
            idVideoControls.hidden = true;
        }
    }

    setViewCounts();
}


function updateGridShape() {
    const columns = Math.max(1, Number(idColumnAmount.value));
    if (columns == 1) { idColumnAmount.innerHTML = "1" };

    idViewsContainer.style.setProperty("--grid-columns", columns);
}


function createMasterVideoInstance() {
    if (!videoMasterInstance) {
        const viewWithVideo = views.find((v) => v.video);
        if (!viewWithVideo) return null;

        videoMasterInstance = viewWithVideo.video;
        videoMasterInstance.muted = videoMuted;

        videoMasterInstance.addEventListener("timeupdate", () => {
            videoCurrentTime = videoMasterInstance.currentTime;

            views.forEach(({ video }) => {
                if (!video) return;
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


function showFileInView(view, file) {
    const { image, video, canvas, sandbox } = view;
    if (!sandbox) return;
    
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    canvas.hidden = false;
    
    if (isImage) {
        if (!image || !video) return;
        video.pause();
        video.removeAttribute("src");
        video.hidden = true;
        idVideoControls.hidden = true;

        image.src = url;
        //image.hidden = false;

        image.onload = () => {
            // i DON'T want the canvas to be the og size, i want it to resize to whatever the parent container makes it in the flexbox
            //canvas.width = image.naturalWidth;
            //canvas.height = image.naturalHeight;
            
            sandbox.loadTexture("u_texture", url);
        };
    }

    else if (isVideo) {
        if (!image || !video) return;
        createMasterVideoInstance();

        image.removeAttribute("src");
        image.hidden = true;
        idVideoControls.hidden = false;

        video.src = url;
        //video.hidden = false;

        if (video === videoMasterInstance) {
            video.muted = videoMuted; // Only the Master Instance can be unmuted
        } else {
            video.muted = true;
        }

        if (
            videoMasterInstance &&
            video !== videoMasterInstance &&
            Number.isFinite(videoMasterInstance.currentTime)
        ) {
            video.currentTime = videoMasterInstance.currentTime;
        }

        video.onloadedmetadata = () => {
            // i DON'T want the canvas to be the og size, i want it to resize to whatever the parent container makes it in the flexbox
            //canvas.width = video.videoWidth;
            //canvas.height = video.videoHeight;
            
            sandbox.loadTexture("u_texture", video);
        };

        if (videoPlaying) {
            video.play();
        }
    }
}


function handleAddLabel() {
    const label = idLabelText.value.trim();

    addView(label);
    idLabelText.value = "";
    idLabelText.focus();
    setViewCounts();
}


function handleAddEmpty() {
    addEmptyView();
    idAddEmptyViewBtn.focus();
    setViewCounts();
}


function handlePlayVideo() {
    videoPlaying = !videoPlaying;

    const master = createMasterVideoInstance();
    if (!master) return;

    if (videoPlaying) {
        idVideoPlayBtn.innerHTML = "Pause";

        views.forEach(({ video }) => {
            if (video) {
                video.play();
            }
        });
    }
    
    else {
        idVideoPlayBtn.innerHTML = "Resume";

        views.forEach(({ video }) => {
            if (video) video.pause();
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
        if (video) {
            video.currentTime = 0;
            video.pause();
        } 
    });

    videoCurrentTime = 0;
    setCurrentTimestamp();
}


function handleMuteVideo() {
    videoMuted = !videoMuted;

    idVideoMuteBtn.innerHTML = videoMuted ? "Unmute" : "Mute";
    
    if (videoMasterInstance) videoMasterInstance.muted = videoMuted;
}


function handleLoopVideo() {
    videoLoops = !videoLoops;

    idVideoLoopBtn.innerHTML = videoLoops ? "Stop Looping" : "Loop";

    if (videoMasterInstance) {
        videoMasterInstance.loop = videoLoops;
    }
}


function skip(timeInSeconds) {
    videoCurrentTime = clamp(videoCurrentTime + timeInSeconds, 0, videoDuration);
    if (videoMasterInstance) videoMasterInstance.currentTime = videoCurrentTime;
}


function setVideoDuration(file) {
    if (!videoMasterInstance) return;

    const videoUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');

    tempVideo.addEventListener('loadedmetadata', () => {
        videoDuration = tempVideo.duration;
        URL.revokeObjectURL(videoUrl);

        idVideoLength.innerHTML = timeSecToMinSec(videoDuration);
    });

    tempVideo.src = videoUrl;
}


function setCurrentTimestamp() {
    if (!videoMasterInstance) return;

    videoCurrentTime = videoMasterInstance.currentTime;

    idVideoTimestamp.innerHTML = timeSecToMinSec(videoCurrentTime);
}


function setShaderType(viewId, shaderType) {
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx === -1) return;

    const view = views[idx];
    view.shaderType = shaderType;

    if (view.image) applyImageShader(view);
    else if (view.video) applyVideoFrameShader(view);
}


function setShaderSeverity(viewId, shaderSeverity) {
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx === -1) return;

    const view = views[idx];
    view.shaderSeverity = shaderSeverity;

    if (view.image) applyImageShader(view);
    else if (view.video) applyVideoFrameShader(view);
}


function loadAllShaders() {
    if (!videoMasterInstance) return;

    views.forEach((view) => {
        if (view.isImage) {
            applyImageShader(view);
        } else if (view.isVideo) {
            applyVideoFrameShader(view);
        }
    });
}


function render() {
    views.forEach(({ image, video }) => {
        if (image) {

        }

        else if (video) {

        }
    })
}


function syncVideos() {
    if (!videoMasterInstance) return;
    
    views.forEach(({ video }) => {
        if (video) {
            video.currentTime = videoMasterInstance.currentTime;
            if (videoPlaying) {
                video.play();
            } else {
                video.pause();
            }
        } 
    });
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


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


function setViewCounts() {
    idTotalViewCount.innerHTML = totalCurrentVisibleViews + totalCurrentEmptyViews;
    idVisibleViewCount.innerHTML = totalCurrentVisibleViews;
    idEmptyViewCount.innerHTML = totalCurrentEmptyViews;
}


function enterFullscreen() {
    idFullscreenControls.hidden = true;
    // turn off fullscreen for all visible views
    idExitFullscreen.hidden = false;
}


function exitFullscreen() {
    idExitFullscreen.hidden = true;
    // turn off fullscreen for all visible views
    idFullscreenControls.hidden = false;
}


function addAllEventListeners() {
    idAddLabelBtn.addEventListener("click", handleAddLabel);
    idAddEmptyViewBtn.addEventListener("click", handleAddEmpty);

    idVideoPlayBtn.addEventListener("click", handlePlayVideo);
    idVideoRestartBtn.addEventListener("click", handleRestartVideo);

    idVideoSubtract5Btn.addEventListener("click", () => { skip(-5); });
    idVideoSubtract10Btn.addEventListener("click", () => { skip(-10); });
    idVideoAdd5Btn.addEventListener("click", () => { skip(5); });
    idVideoAdd10Btn.addEventListener("click", () => { skip(10); });

    idVideoMuteBtn.addEventListener("click", handleMuteVideo);
    idVideoLoopBtn.addEventListener("click", handleLoopVideo);

    idColumnAmount.addEventListener("input", updateGridShape);

    idLayoutUrl.addEventListener("onclick", copyUrl);

    idEnterFullscreen.addEventListener("click", enterFullscreen);
    idExitFullscreen.addEventListener("click", exitFullscreen);
    
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