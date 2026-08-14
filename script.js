// AuGoWolf
// Clones the view template once per entry in VIEW_LABELS,
// then pushes input file into every cloned view.

// Shader matrices

const idFileInput = document.getElementById("idFileInput");

const idLabelText = document.getElementById("idLabelText");
const idAddLabelBtn = document.getElementById("idAddLabelBtn");
const idVideoControls = document.getElementById("idVideoControls");

const idViewTemplate = document.getElementById("idViewTemplate");
const idViewsContainer = document.getElementById("idViewsContainer");

const views = []; // { root, label, image, video }
let currentFile = null;
let muted = false;
let viewCount = 0;


function addView(label) {
    const clone = idViewTemplate.content.cloneNode(true);
    
    const root = clone.querySelector(".view");
    const image = clone.querySelector(".viewImage");
    const video = clone.querySelector(".viewVideo");
    const new_label = clone.querySelector(".viewLabel");

    root.id = "idView-" + viewCount;
    image.id = "idViewImage-" + viewCount;
    video.id = "idViewVideo-" + viewCount;
    new_label.textContent = label;
    viewCount++;
    
    idViewsContainer.appendChild(clone);
    const view = { root, label, image, video };
    views.push(view);

    // if a file's already loaded, show it in this new view
    if (currentFile) {
        showFileInView(view, currentFile);
    }
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
        image.removeAttribute("src");
        image.hidden = true;
        idVideoControls.hidden = false;

        video.src = url;
        video.hidden = false;
    }
}


function handleAddLabel() {
    const label = idLabelText.value.trim();
    if (!label) return;

    addView(label);
    idLabelText.value = "";
    idLabelText.focus();
}


idAddLabelBtn.addEventListener("click", handleAddLabel);

idLabelText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddLabel();
})

idFileInput.addEventListener("change", () => {
    const file = idFileInput.files[0];
    if (!file) return;

    currentFile = file;
    console.log(file);
    views.forEach((view) => showFileInView(view, file));
});