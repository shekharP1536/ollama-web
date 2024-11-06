const messageDiv = document.getElementById("new_msg");
let currentSpeaker = null;
let messageContent = "";
let loadingIndicator;
let flow = false;
const sentences = [];
let currentSentence = "";

// Initialize the page and populate model list on load
document.addEventListener("DOMContentLoaded", get_list);

// Function to start a new message
function startMessage(speaker) {
  const modelName = document.getElementById('select_model_btn').value || "Model";
  endMessage(); // Close any open messages

  currentSpeaker = speaker;

  // Create new message container
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message", speaker === "user" ? "user-message" : "bot-message");
  
  // Create a container for the speaker's name
  const speakerNameContainer = document.createElement("div");
  speakerNameContainer.classList.add("speaker-name");
  speakerNameContainer.innerHTML = `<strong>${speaker === "user" ? "You" : modelName}:</strong>`;
  messageContainer.appendChild(speakerNameContainer);

  // Create a container for the response content
  const messageContentContainer = document.createElement("div");
  messageContentContainer.classList.add("message-content");
  messageContainer.appendChild(messageContentContainer);

  // Add a hover effect to show the copy button
  var copyButton = document.createElement("i");
  copyButton.classList.add("fa-regular");
  copyButton.classList.add("fa-copy");
  copyButton.addEventListener("click", () => {
    copyToClipboard(messageContentContainer.innerText)
    copyButton = '<i class="fa-solid fa-copy"></i> copied';
  });

  messageContainer.appendChild(copyButton);

  messageDiv.appendChild(messageContainer);

  messageContent = messageContentContainer;

  if (speaker === "bot" && loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Function to add content to the current message
function addContent(content) {
  if (content === "```") {
    messageContent.innerHTML += "<custom>";
  } else {
    messageContent.innerText += content;
  }
}

// Function to end the current message and optionally show a loading indicator
function endMessage() {
  flow = false;
  if (currentSpeaker === "user") {
    showLoadingIndicator("Processing...");
  }
  currentSpeaker = null;
}

// Function to show a loading indicator
function showLoadingIndicator(text) {
  loadingIndicator = document.createElement("div");
  loadingIndicator.classList.add("loading-indicator");
  loadingIndicator.innerHTML = text;
  messageDiv.appendChild(loadingIndicator);
}

// Function to handle user input and send it to the server
function sendUserInput() {
  const inputField = document.getElementById("userInput");
  const userPrompt = inputField.value.trim();
  const modelSelected = document.getElementById('select_model_btn').value;

  if (!modelSelected) {
    alert("Please select a model");
    return;
  }

  if (userPrompt) {
    fetch("/get_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt, model_need: modelSelected })
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response received:", data.response);
      })
      .catch((error) => console.error("Error:", error));

    inputField.value = ""; // Clear input field
  }
}

// Function to create options for the model selection dropdown
function createModelOption(name) {
  const selectElement = document.getElementById('select_model_btn');
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  selectElement.appendChild(option);
}

// Fetch the list of models from the server and populate the dropdown
function get_list() {
  fetch("/list_request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: "list_of_llm" })
  })
    .then((response) => response.json())
    .then((data) => {
      data.list.models.forEach((model) => createModelOption(model.name));
    })
    .catch((error) => console.error("Fetch error:", error));
}

// Event listeners for submitting input
document.getElementById("submitButton").onclick = sendUserInput;
document.getElementById("userInput").addEventListener("keypress", (event) => {
  if (!flow && event.key === "Enter") sendUserInput();
});

// Function to enable or disable input based on action
function action(isProcessing) {
  flow = isProcessing;
  document.getElementById("submitButton").disabled = isProcessing;
  console.log(isProcessing ? "Disabled" : "Enabled");
}

// Event listener for receiving server messages
const eventSource = new EventSource("/stream_response");
eventSource.onmessage = function (event) {
  const response = event.data;
  switch (response) {
    case "[|/__USER_START__/|]":
      startMessage("user");
      break;
    case "[|/__USER_END__/|]":
      endMessage();
      break;
    case "[|/__START__/|]":
      action(true);
      startMessage("bot");
      break;
    case "[|/__DONE__/|]":
      endMessage();
      action(false);
      break;
    default:
      addContent(response);
      break;
  }
};

// Function to copy text to clipboard
function copyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  // alert("Copied to clipboard!");
}
