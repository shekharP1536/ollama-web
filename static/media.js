const mediaFileInput = document.getElementById("media_file");
const other_option_input = document.getElementById("other_option_input");
mediaFileInput.addEventListener("change", function () {
    if (mediaFileInput.files.length > 0) {
        // Get the file details
        const file = mediaFileInput.files[0];
        const fileName = file.name; // File name
        const fileSize = file.size; // File size in bytes

        // Convert size to KB or MB for better readability
        const fileSizeInKB = (fileSize / 1024).toFixed(2);
        const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

        console.log(`Uploaded file name: ${fileName}`);
        console.log(`File size: ${fileSize} bytes (${fileSizeInKB} KB / ${fileSizeInMB} MB)`);
        validate_file(fileName,fileSizeInMB);
    } else {
        console.log("No file selected.");
    }
});
function validate_file(filename, filesize) {
    const fileSize = 32
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'html', 'json','py', 'pdf', 'doc', 'docx'];
    const fileExtension = filename.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
        console.error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
        alert(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
        return;
    }
    if (filesize > fileSize) {
        console.error(`File size exceeds 32 MB. Your file size: ${(filesize / (1024 * 1024)).toFixed(2)} MB`);
        alert(`File size exceeds 32 MB. Your file size: ${(filesize / (1024 * 1024)).toFixed(2)} MB`);
        return;
    }
    createMediaTag(filename, `${(filesize / (1024 * 1024)).toFixed(2)} MB`);
}
function createMediaTag(name, size) {
    other_option_input.innerHTML = "";
    other_option_input.innerHTML += "<strong>Uploaded media:</strong>";
    const tag = document.createElement("div");
    tag.classList.add("media-tag");
    const tagContent = document.createElement("div");
    tagContent.innerHTML += '<i class="fa-regular fa-file"></i>'
    tagContent.classList.add("media-tag-content");
    const tagName = document.createElement("p");
    const tagSize = document.createElement("p");
    tagName.classList.add("media-tag-name");
    tagSize.classList.add("media-tag-size");
    tagName.textContent = name;
    tagSize.textContent = `${size}`;
    const tagClose = document.createElement("div");
    tagClose.classList.add("media-tag-close");
    tagClose.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    tagClose.addEventListener("click" , ()=>{
        other_option_input.innerHTML = "";
        mediaFileInput.value = "";
    })
    tagContent.append(tagName, tagSize);
    tag.append(tagContent, tagClose);
    other_option_input.append(tag);
}
