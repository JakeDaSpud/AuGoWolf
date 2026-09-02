// AuGoWolf
// Clones the view template once per label entry,
// then pushes input file into every cloned view.

// TODO Cleaning
// - remove unused files
// - clean up comments
// - remove unused code

// TODO Features
// - add preset layouts
// - add youtube / video url as an option, not just local files?

// FIXME
// - make images full resolution (or scaled?)
    // maintain aspect ratio: fit to width
// - load video -> load image, video still visible on canvas?

const PRESET_LAYOUT_FULL_IRISH = ''
const PRESET_LAYOUT_PROTAN_SCALE = '?layout=Protanopia%20Scale%3B4%3B0%3BReference%3AN%3A0.5%3B';
const PRESET_LAYOUT_DEUTERAN_SCALE = '?layout=Deuteranopia%20Scale%3B4%3B0%3BReference%3AN%3A0.5%3B';
const PRESET_LAYOUT_TRITAN_SCALE = '?layout=Tritanopia%20Scale%3B4%3B0%3BReference%3AN%3A0.5%3B';
const PRESET_LAYOUT_ACHROMA_SCALE = '?layout=Achromatopsia%20Scale%3B4%3B0%3BReference%3AN%3A0.5%3B';

const LayoutPresetValueToUrlCode = new Map([
    ["NONE",     ''],
    ["FULL",     'Full Irish;4;0;Reference:N:0.5;Achromatopsia:A:1;Monochromacy:A:0.5;!e;!e;Protanopia:P:1;Protanomaly:P:0.5;!e;!e;Deuteranopia:D:1;Deuteranomaly:D:0.5;!e;!e;Tritanopia:T:1;Tritanomaly:T:0.5;'],
    ["ACHROMA",  'Achromatopsia Scale;6;0;Reference:N:0.5;Monochromatic 20%:A:0.2;Monochromatic 40%:A:0.4;Monochromatic 60%:A:0.6;Monochromatic 80%:A:0.8;Achromatopsic 100%:A:1;'],
    ["PROTAN",   'Protanopia Scale;6;0;Reference:N:0.5;Protanomalous 20%:P:0.2;Protanomalous 40%:P:0.4;Protanomalous 60%:P:0.6;Protanomalous 80%:P:0.8;Protanopic 100%:P:1;'],
    ["DEUTERAN", 'Deuteranopia Scale;6;0;Reference:N:0.5;Deuteranomalous 20%:D:0.2;Deuteranomalous 40%:D:0.4;Deuteranomalous 60%:D:0.6;Deuteranomalous 80%:D:0.8;Deuteranopic 100%:D:1;'],
    ["TRITAN",   'Tritanopia Scale;6;0;Reference:N:0.5;Tritanomalous 20%:T:0.2;Tritanomalous 40%:T:0.4;Tritanomalous 60%:T:0.6;Tritanomalous 80%:T:0.8;Tritanopic 100%:T:1;']
]);

const idHeader = document.getElementById("idHeader");
const idFooter = document.getElementById("idFooter");

const idControls = document.getElementById("idControls");
const idFullscreenControls = document.getElementById("idFullscreenControls");
const idFileInput = document.getElementById("idFileInput");

const idPresetLayoutSelect = document.getElementById("idPresetLayoutSelect");
const idPresetLayoutSubmitBtn = document.getElementById("idPresetLayoutSubmitBtn");

const idLayoutNameText = document.getElementById("idLayoutNameText");
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
const idGenerateLayoutUrlBtn = document.getElementById("idGenerateLayoutUrlBtn");

const idEnterFullscreen = document.getElementById("idEnterFullscreen");
const idExitFullscreen = document.getElementById("idExitFullscreen");

const idSimpleModeCheckbox = document.getElementById("idSimpleModeCheckbox");

const idCvdFilterDefs = document.getElementById("idCvdFilterDefs");
const ColourShaderToSelectValue = new Map([
    [ColourShader.NONE,             "NONE"          ],
    [ColourShader.ACHROMATOPSIA,    "ACHROMATOPSIA" ],
    [ColourShader.PROTANOPIA,       "PROTANOPIA"    ],
    [ColourShader.DEUTERANOPIA,     "DEUTERANOPIA"  ],
    [ColourShader.TRITANOPIA,       "TRITANOPIA"    ],
]);

const views = []; // { root, label, image, video }
let currentFile = null;
let sourceUrl = null;

// url encoding
const EMPTY_VIEW_CODE = '!e';
let last_layout_url = null;
let layoutIsSimple = false;

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


function addView(label, param_type=null, param_severity=null) {
    const clone = idViewTemplate.content.cloneNode(true);
    
    const root = clone.querySelector(".view");
    const new_label = clone.querySelector(".viewLabel");
    
    const canvas = clone.querySelector(".glslCanvas");
    
    const shader_type = clone.querySelector(".shaderType");
    const shader_severity = clone.querySelector(".shaderSeverity");
    const shader_severity_label = clone.querySelector(".severityLabel");
    const delete_btn = clone.querySelector(".deleteBtn");
    
    root.id = "idView-" + viewUidTracker;
    new_label.textContent = label;
    
    canvas.id = "idViewCanvas-" + viewUidTracker;
    
    shader_type.id = "idShaderType-" + viewUidTracker;
    shader_severity.id = "idShaderSeverity-" + viewUidTracker;
    delete_btn.id = "idDeleteBtn-" + viewUidTracker;
    
    viewUidTracker++;
    totalCurrentVisibleViews++;
    
    idViewsContainer.appendChild(clone);
    
    const resolved_type = param_type != null ? urlCodeToShaderType(param_type) : ColourShader.NONE;
    const resolved_severity = param_severity != null ? parseFloat(param_severity) : 0.5;
    
    setShaderTypeSelect(shader_type, resolved_type);
    shader_severity.value = resolved_severity;
    if (shader_severity_label) shader_severity_label.textContent = resolved_severity.toFixed(2);
    
    let filterCode = toFilterCode(resolved_type, resolved_severity);
    getOrComputeCachedMatrix(filterCode);

    canvas.classList.add(filterCode);

    const view = {
        root,
        label,
        canvas,
        filterCode, // cvdfX000
        visible: true,
        shaderType: resolved_type,
        shaderSeverity: resolved_severity,
    };

    views.push(view);

    if (layoutIsSimple) {
        setSimpleModeForView(view, true);
    }
    
    if (param_type != null) setShaderType(root.id, resolved_type);
    if (param_severity != null) setShaderSeverity(root.id, resolved_severity);
    
    shader_type.addEventListener("change", (e) => {
        setShaderType(root.id, e.target.value);
    });
    
    shader_severity.addEventListener("input", (e) => {
        const val_as_string = e.target.value;
        console.log("new value for View[", root.id, "]: ", val_as_string, " of type ", typeof(val_as_string));
        
        setShaderSeverity(root.id, val_as_string);
        
        if (shader_severity_label) {
            shader_severity_label.textContent = parseFloat(val_as_string).toFixed(2);
        }
    });

    delete_btn.addEventListener("click", () => {
        deleteView(root.id);
    });

    // if a file's already loaded, show it in this new view
    if (currentFile) {
        drawViewFrame(view);
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
    const view = {
        root,
        visible: false,
    };
    views.push(view);

    if (layoutIsSimple) {
        setSimpleModeForView(view, true);
    }
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
        views.splice(idx, 1);
        if (totalCurrentVisibleViews === 0) idVideoControls.hidden = true;
    }

    setViewCounts();
}


function setShaderTypeSelect(selectElement, shaderType) {
    const option = ColourShaderToSelectValue.get(shaderType);
    if (option != null) {
        selectElement.value = option;
    }
}


function updateGridShape() {
    const columns = Math.max(1, Number(idColumnAmount.value));
    if (columns == 1) { idColumnAmount.innerHTML = "1" };

    idViewsContainer.style.setProperty("--grid-columns", columns);
}


function updateFile(file) {
    console.log("new file: ", file);
    currentFile = file;
    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    sourceUrl = URL.createObjectURL(currentFile);

    if (isImage) {
        if (masterImageInstance.src != sourceUrl) {
            masterImageInstance.src = sourceUrl;
            // reset video
            masterVideoInstance.removeAttribute('src');
        }
        
        masterImageInstance.onload = () => {
            idVideoControls.hidden = true;
            loadImages();
        };

        if (masterImageInstance.complete && masterImageInstance.src) {
            idVideoControls.hidden = true;
            loadImages();
        }
    }

    else if (isVideo) {
        if (masterVideoInstance.src != sourceUrl) {
            masterVideoInstance.src = sourceUrl;
            // reset image
            masterImageInstance.removeAttribute('src');

            masterVideoInstance.onloadedmetadata = () => {
                idVideoControls.hidden = false;
    
                if (videoPlaying) {
                    masterVideoInstance.play();
                } else {
                    masterVideoInstance.pause();
                }

                views.forEach(drawViewFrame);
            };
        }
        // video already loaded, don't reset view's currentTime or .src
        else {
            idVideoControls.hidden = false;
        }
    }

    updateAllViewFilters();
}


function updateViewFilter(view) {
    if (!view || !view.canvas) return;

    const newFilterCode = toFilterCode(view.shaderType, view.shaderSeverity);
    if (newFilterCode == view.filterCode) return;

    getOrComputeCachedMatrix(newFilterCode);
    view.canvas.classList.remove(view.filterCode);
    view.canvas.classList.add(newFilterCode);
    view.filterCode = newFilterCode;

    drawViewFrame(view);
}


function updateAllViewFilters() {
    views.forEach((view) => {
        if (!view.visible || !view.canvas) return;
        updateViewFilter(view);
    });
}


function applyAllViewShaders() {
    return; // TEMP ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !
    views.forEach((view) => {
        updateViewFilter(view);
    });
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


function drawViewFrame(view) {
    if (!view.canvas) return;
    const ctx = view.canvas.getContext("2d");

    if (imageLoaded()) {
        ctx.drawImage(masterImageInstance, 0, 0, view.canvas.width, view.canvas.height);
        view.canvas.hidden = false;
        if (view.canvas.parentNode) view.canvas.parentNode.hidden = false;
    } else if (videoLoaded()) {
        ctx.drawImage(masterVideoInstance, 0, 0, view.canvas.width, view.canvas.height);
        view.canvas.hidden = false;
        if (view.canvas.parentNode) view.canvas.parentNode.hidden = false;
    }
}


function loadImages() {
    if (!imageLoaded()) return;
    views.forEach(drawViewFrame);
}


function videoRenderLoop() {
    if (videoLoaded() && !masterVideoInstance.paused && !masterVideoInstance.ended) {
        views.forEach((view) => {
            if (view.visible && view.canvas && !view.canvas.hidden) drawViewFrame(view);
        });
    }
    requestAnimationFrame(videoRenderLoop);
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
    deleteAllViews();
}


function deleteAllViews() {
    while (views.length > 0) {
        deleteView(views[0].root.id);
    }
    setViewCounts();
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
    updateViewFilter(view);
}


function setShaderSeverity(viewId, shaderSeverity) {
    const idx = views.findIndex(v => v.root.id === viewId);
    if (idx === -1) return;

    const view = views[idx];
    view.shaderSeverity = parseFloat(shaderSeverity);
    console.log("setting severity to", view.shaderSeverity);
    updateViewFilter(view);
}


function timeSecToMinSec(timeInSeconds) {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    idHeader.hidden = true;
    idFooter.hidden = true;
}


function exitFullscreen() {
    idExitFullscreen.hidden = true;
    // turn off fullscreen for all visible views
    idFullscreenControls.hidden = false;

    idHeader.hidden = false;
    idFooter.hidden = false;
}


function toggleSimpleMode(isSimple=null) {
    if (isSimple == null) isSimple = !layoutIsSimple;
    layoutIsSimple = isSimple;

    setSimpleModeForAllViews(isSimple);
}


function setSimpleModeForView(view, isSimple) {
    const root = view.root;
    if (!root) return;

    // true
        // only name and canvas
        // hides sliders and buttons and background and border
    
    // false
        // name, canvas, properties, sliders, delete all visible

    root.classList.toggle('simple-view', isSimple);
}


function setSimpleModeForAllViews(isSimple) {
    views.forEach((view) => {
        setSimpleModeForView(view, isSimple);
    });
}


function handlePresetLayout() {
    resetLayout();

    let preset_layout_url_code = LayoutPresetValueToUrlCode.get(idPresetLayoutSelect.value);
    console.log(preset_layout_url_code);
    buildLayoutFromUrlCode(preset_layout_url_code, true);
}


function resetLayout() {
    deleteAllViews();
    
    idLayoutNameText.value = '';
    
    idColumnAmount.value = 3;
    updateGridShape();
    
    idLayoutUrl.value = '';

    idSimpleModeCheckbox.checked = false;
    toggleSimpleMode(idSimpleModeCheckbox.checked);
}


function checkUrlParameter() {
    let params = new URLSearchParams(document.location.search);
    let layout = params.get('layout');

    console.log("layout from params.get() ", layout);

    if (layout != "") {
        last_layout_url = layout;
        buildLayoutFromUrlCode(last_layout_url);
    }
}


function copyUrl() {
    idLayoutUrl.select();
    document.execCommand('copy');
    alert('Copied Layout URL to clipboard.');
}


function generateAndCopyLayoutUrl() {
    let output_url_code = "";
    
    // layout name "string"
    let trimmed_name = idLayoutNameText.value;
    trimmed_name = trimmed_name.replace(';', '');
    output_url_code += trimmed_name + ';';
    
    // column count int
    output_url_code += idColumnAmount.value + ';';
    
    // simpleMode bool / 0 1 int
    let simpleModeBit = idSimpleModeCheckbox.checked ? '1' : '0';
    output_url_code += simpleModeBit + ';';
    
    // views["name string":Type char N A P D T:Severity float x.xx;]
    views.forEach((view) => {
        if (view.visible) {
            output_url_code += getViewAsUrlCode(view);
        }

        else {
            output_url_code += getEmptyViewAsUrlCode();
        }
    });

    console.log("final url: ", output_url_code);

    // current url up until 'AuGoWolf/'
    let trimmed_current_url = window.location.href;
    trimmed_current_url = trimmed_current_url.split('AuGoWolf/')[0] + 'AuGoWolf/index.html';

    let final_url = trimmed_current_url + '?layout=' + encodeURIComponent(output_url_code);

    idLayoutUrl.value = final_url;
    copyUrl();
}


function getViewAsUrlCode(view) {
    let view_as_string = "";

    let trimmed_label = view.label;
    trimmed_label = trimmed_label.replace(':', '');
    trimmed_label = trimmed_label.replace(';', '');
    view_as_string += trimmed_label + ':'

    switch (view.shaderType) {
        case ColourShader.NONE:
            view_as_string += 'N';
            break;
        
        case ColourShader.ACHROMATOPSIA:
            view_as_string += 'A';
            break;
        
        case ColourShader.PROTANOPIA:
            view_as_string += 'P';
            break;
        
        case ColourShader.DEUTERANOPIA:
            view_as_string += 'D';
            break;
        
        case ColourShader.TRITANOPIA:
            view_as_string += 'T';
            break;
    
        default:
            break;
    }
    view_as_string += ':';

    view_as_string += view.shaderSeverity + ';';

    return view_as_string;
}


function getEmptyViewAsUrlCode() {
    return EMPTY_VIEW_CODE + ';';
}


function urlCodeToShaderType(code) {
    switch (code) {
        case 'N': return ColourShader.NONE;
        case 'A': return ColourShader.ACHROMATOPSIA;
        case 'P': return ColourShader.PROTANOPIA;
        case 'D': return ColourShader.DEUTERANOPIA;
        case 'T': return ColourShader.TRITANOPIA;
        default: return ColourShader.NONE;
    }
}


function buildLayoutFromUrlCode(urlCode, override=false) {
    if (override) {
        idLayoutUrl.value = urlCode;
    } else {
        idLayoutUrl.value = last_layout_url;
    }

    console.log('last_layout_url is now [', last_layout_url, ']');
    if (!urlCode) return;

    let values = urlCode.split(';');
    console.log('values = [', values, ']');

    // layout name
    idLayoutNameText.value = values[0];
    console.log('Layout name is now[', values[0], ']');

    // set column count
    idColumnAmount.value = parseInt(values[1]);
    console.log('Column amount is now[', values[1], ']');
    updateGridShape();
    
    for (i = 3; i < values.length - 1; i++) {
        if (values[i] === EMPTY_VIEW_CODE) {
            console.log('Adding EmptyView');
            addEmptyView();
            continue;
        }

        let current_view = values[i].split(':'); // gives me [label, type, severity]

        console.log('Adding View[', current_view[0], current_view[1], current_view[2], ']');
        addView(current_view[0], current_view[1], current_view[2]);
    }
    
    layoutIsSimple = !!parseInt(values[2]);
    console.log('Simple mode is now[', values[2], ']');
    idSimpleModeCheckbox.checked = layoutIsSimple;
    setSimpleModeForAllViews(layoutIsSimple);

    setViewCounts();
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

    idPresetLayoutSubmitBtn.addEventListener("click", handlePresetLayout);

    idLayoutUrl.addEventListener("onclick", copyUrl);
    idGenerateLayoutUrlBtn.addEventListener("click", generateAndCopyLayoutUrl);

    idEnterFullscreen.addEventListener("click", enterFullscreen);
    idExitFullscreen.addEventListener("click", exitFullscreen);

    idSimpleModeCheckbox.addEventListener("input", (e) => {
        toggleSimpleMode(e.target.checked);
    });

    idLabelText.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAddLabel();
    });

    masterVideoInstance.addEventListener("loadedmetadata", setVideoDuration);
    masterVideoInstance.addEventListener("timeupdate", setCurrentTimestamp);

    idFileInput.addEventListener("change", () => {
        const file = idFileInput.files[0];
        if (!file) return;

        updateFile(file);
    });

    updateGridShape();
}


addAllEventListeners();
checkUrlParameter();
requestAnimationFrame(videoRenderLoop);