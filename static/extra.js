const myModal = new bootstrap.Modal(document.getElementById('keyboard_shortcut_modal'));
const tooltipTriggerList = document.querySelectorAll('[data-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
console.log(tooltipList); var slidebar = document.getElementById("toogle_section");
slidebar.addEventListener("click", () => {
    toggle_section();
});
const section = document.getElementById("section_a");
document.addEventListener("DOMContentLoaded", () => {
    var loader = document.getElementById("loader");
    loader.remove();
    const currentState = localStorage.getItem("slideBarState");
    console.log(currentState);
    if (currentState == "hidden") {
        section.classList.add("section_view")
    }
});
function toggle_section() {
    const currentState = localStorage.getItem("slideBarState");

    // Toggle the visibility class
    section.classList.toggle("section_view");

    // Update localStorage based on the new state
    if (section.classList.contains("section_view")) {
        localStorage.setItem("slideBarState", "hidden");
        slidebar.setAttribute("data-bs-original-title", "Show Slidebar<br> <u>Ctrl + b</u>");
    } else {
        localStorage.setItem("slideBarState", "shown");
        slidebar.setAttribute("data-bs-original-title", "Hide Slidebar<br><u>Ctrl + b</u> ");

    }
}

$(document).on("keydown", function (e) {
    const focusedElement = document.activeElement;

    // Ctrl + B for bold text
    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault(); // Prevent default Ctrl+B behavior
        if (focusedElement) {
            console.log('excueted b');
            toggle_section();
        }
    }

    // Enter + Shift to create a new line in contenteditable div
    if (focusedElement && focusedElement.id === 'userInput' && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault(); // Prevent default Enter behavior
        document.execCommand('insertLineBreak'); // Insert a new line
    }

    // Initialize modal instance once

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();

            // Optional: Add focused element logic if necessary
            if (document.activeElement) {
                console.log("Toggling modal using Ctrl + /");
                myModal.toggle();
            }
        }
    });


    // Shift + < to decrease font size
    if (e.shiftKey && e.key === '<') {
        e.preventDefault();
        if (focusedElement) {
            // Replace with modern implementation for font size adjustment
            const range = window.getSelection().getRangeAt(0);
            if (range && range.startContainer.parentNode.style) {
                let currentSize = window
                    .getComputedStyle(range.startContainer.parentNode)
                    .fontSize.replace('px', '');
                range.startContainer.parentNode.style.fontSize =
                    Math.max((parseInt(currentSize) || 16) - 2, 8) + 'px';
            }
        }
    }

    // Alt + / to focus on #userInput
    if (e.which === 191 || e.keyCode === 191) { // Key /
        if (!focusedElement || (focusedElement.type !== 'text' && focusedElement.name !== 'userInput')) {
            e.preventDefault(); // Prevent default behavior
            $("#userInput").focus();
        }
    }
});
