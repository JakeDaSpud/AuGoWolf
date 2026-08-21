// AuGoWolf
// Clones the view template once per label entry,
// then pushes input file into every cloned view.

const idControls = document.getElementById("idControls");
const idFullscreenControls = document.getElementById("idFullscreenControls");
const idFileInput = document.getElementById("idFileInput");

const idLabelText = document.getElementById("idLabelText");
const idAddLabelBtn = document.getElementById("idAddLabelBtn");
const idAddEmptyViewBtn = document.getElementById("idAddEmptyViewBtn");
const idDeleteAllViewsBtn = document.getElementById("idDeleteAllViewsBtn");

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
let sourceUrl = null;

// Master Sources
const masterImageInstance = document.getElementById("idMasterImage");
const masterVideoInstance = document.getElementById("idMasterVideo");

const VIDEO_MAX_DESYNC = 0.1; // seconds
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
    
    const canvas = clone.querySelector(".glslCanvas");
    const sandbox = new GlslCanvas(canvas);
    
    const shader_type = clone.querySelector(".shaderType");
    const shader_severity = clone.querySelector(".shaderSeverity");
    const shader_severity_label = clone.querySelector(".severityLabel");
    const delete_btn = clone.querySelector(".deleteBtn");

    root.id = "idView-" + viewUidTracker;
    new_label.textContent = label;
    
    canvas.id = "idViewCanvas-" + viewUidTracker;
    
    shader_type.id = "idShaderType-" + viewUidTracker;
    shader_type.addEventListener("change", (e) => {
        setShaderType(root.id, e.target.value);
    });

    shader_severity.id = "idShaderSeverity-" + viewUidTracker;
    shader_severity.addEventListener("input", (e) => {
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
        canvas,
        sandbox, // GlslCanvas Object

        shaderType: ColourShader.NONE,
        severity: 0.5,
    };

    views.push(view);

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
        if (views[idx].sandbox) {
            views[idx].sandbox.destroy();
        }

        views.splice(idx, 1);
        if (totalCurrentVisibleViews === 0) idVideoControls.hidden = true;
    }

    setViewCounts();
}


function updateGridShape() {
    const columns = Math.max(1, Number(idColumnAmount.value));
    if (columns == 1) { idColumnAmount.innerHTML = "1" };

    idViewsContainer.style.setProperty("--grid-columns", columns);
}


function updateFile(file) {
    console.log("new file: ", file);
    currentFile = file;
    sourceUrl = URL.createObjectURL(currentFile);
}


function showFileInView(view, file=currentFile) {
    const { canvas, sandbox } = view;
    if (!sandbox) return;
    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    canvas.hidden = false;
    if (canvas.parentNode) canvas.parentNode.hidden = false;
    
    if (isImage) {
        if (masterImageInstance.src !== sourceUrl) {
            masterImageInstance.src = sourceUrl;
            // reset video
            masterVideoInstance.removeAttribute('src');
        }
        
        masterImageInstance.onload = () => {
            idVideoControls.hidden = true;
            applyViewShader(view);
        };

        if (masterImageInstance.complete && masterImageInstance.src) {
            idVideoControls.hidden = true;
            applyViewShader(view);
        }
    }

    else if (isVideo) {
        if (masterVideoInstance.src !== sourceUrl) {
            masterVideoInstance.src = sourceUrl;
            // reset image
            masterImageInstance.removeAttribute('src');

            masterVideoInstance.onloadedmetadata = () => {
                idVideoControls.hidden = false;
                applyViewShader(view);
    
                if (videoPlaying) {
                    masterVideoInstance.play();
                } else {
                    masterVideoInstance.pause();
                }
            };
        }
        // video already loaded, don't reset view's currentTime or .src
        else {
            idVideoControls.hidden = false;
            applyViewShader(view);
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

    if (videoPlaying) {
        masterVideoInstance.play();
        idVideoPlayBtn.innerHTML = "Pause";
    }
    
    else {
        masterVideoInstance.pause();
        idVideoPlayBtn.innerHTML = "Resume";
    }
}


function handleRestartVideo() {
    masterVideoInstance.currentTime = 0;
    videoCurrentTime = 0;
    
    if (!videoPlaying) {
        masterVideoInstance.pause();
        idVideoPlayBtn.innerHTML = "Play";
    }
    
    setCurrentTimestamp();
}


function handleMuteVideo() {
    videoMuted = !videoMuted;

    idVideoMuteBtn.innerHTML = videoMuted ? "Unmute" : "Mute";
    
    if (videoLoaded()) masterVideoInstance.muted = videoMuted;
}


function handleLoopVideo() {
    videoLoops = !videoLoops;

    idVideoLoopBtn.innerHTML = videoLoops ? "Stop Looping" : "Loop";

    if (videoLoaded()) {
        masterVideoInstance.loop = videoLoops;
    }
}


function handleDeleteAllViews() {
    while (views.length > 0) {
        deleteView(views[0].root.id);
    }
}


function skip(timeInSeconds) {
    console.log("videocurrenttime before clamp: ", videoCurrentTime);
    videoCurrentTime = clamp(videoCurrentTime + timeInSeconds, 0, videoDuration);
    console.log("videocurrenttime after clamp: ", videoCurrentTime);
    if (videoLoaded()) {
        console.log("setting currentTime to", videoCurrentTime);
        masterVideoInstance.currentTime = videoCurrentTime;
    };
}


function setVideoDuration() {
    if (!videoLoaded()) return;

    videoDuration = masterVideoInstance.duration;
    idVideoLength.innerHTML = timeSecToMinSec(videoDuration);
}


function setCurrentTimestamp() {
    if (!videoLoaded()) return;

    videoCurrentTime = masterVideoInstance.currentTime;
    idVideoTimestamp.innerHTML = timeSecToMinSec(videoCurrentTime);
}


function videoLoaded() {
    return masterVideoInstance.hasAttribute('src');
}


function imageLoaded() {
    return masterImageInstance.hasAttribute('src');
}


function setShaderType(viewId, shaderType) {
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx === -1) return;

    const view = views[idx];
    view.shaderType = shaderType;
    applyViewShader(view);
}


function setShaderSeverity(viewId, shaderSeverity) {
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx === -1) return;

    const view = views[idx];
    view.shaderSeverity = parseFloat(shaderSeverity);
    applyViewShader(view);
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

    if (totalCurrentVisibleViews + totalCurrentEmptyViews <= 0) {
        idDeleteAllViewsBtn.disabled = true;
    } else {
        idDeleteAllViewsBtn.disabled = false;
    }
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

    idDeleteAllViewsBtn.addEventListener("click", handleDeleteAllViews);

    idColumnAmount.addEventListener("input", updateGridShape);

    idLayoutUrl.addEventListener("onclick", copyUrl);

    idEnterFullscreen.addEventListener("click", enterFullscreen);
    idExitFullscreen.addEventListener("click", exitFullscreen);
    
    idLabelText.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAddLabel();
    });

    masterVideoInstance.addEventListener("loadedmetadata", setVideoDuration);
    masterVideoInstance.addEventListener("timeupdate", setCurrentTimestamp);

    idFileInput.addEventListener("change", () => {
        const file = idFileInput.files[0];
        if (!file) return;

        updateFile(file);
        views.forEach((view) => showFileInView(view));
    });

    updateGridShape();
}


addAllEventListeners();