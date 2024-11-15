const messageDiv = document.getElementById("new_msg");
let currentSpeaker = null;
let messageContent = "";
let loadingIndicator;
let flow = false;
const sentences = [];
let currentSentence = "";
marked.use({
  mangle: false,
  headerIds: false,
});

// Initialize the page and populate model list on load
document.addEventListener("DOMContentLoaded", get_list);

// Function to start a new message
function startMessage(speaker) {
  const modelName =
    document.getElementById("select_model_btn").value || "Model";
  endMessage(); // Close any open messages

  currentSpeaker = speaker;

  // Create new message container
  const messageContainer = document.createElement("div");
  messageContainer.classList.add(
    "message",
    speaker === "user" ? "user-message" : "bot-message"
  );

  // Create a container for the speaker's name
  const speakerNameContainer = document.createElement("div");
  speakerNameContainer.classList.add("speaker-name");
  speakerNameContainer.innerHTML = `<strong>${
    speaker === "user" ? "You" : modelName
  }:</strong>`;
  messageContainer.appendChild(speakerNameContainer);

  // Create a container for the response content
  const messageContentContainer = document.createElement("div");
  messageContentContainer.classList.add("message-content");
  messageContainer.appendChild(messageContentContainer);

  // Add a hover effect to show the copy button
  var copyButton_container = document.createElement("p");
  copyButton_container.classList.add("copy");
  copyButton_container.style.Display = "none";
  var copyButton = document.createElement("i");
  copyButton.classList.add("fa-regular");
  copyButton.classList.add("fa-copy");
  copyButton.addEventListener("click", () => {
    copyToClipboard(messageContentContainer.innerText);
    copyButton_container.innerHTML = '<i class="fa-solid fa-copy"></i> copied';
  });

  messageContainer.appendChild(copyButton_container);
  copyButton_container.appendChild(copyButton);

  messageDiv.appendChild(messageContainer);

  messageContent = messageContentContainer;

  if (speaker === "bot" && loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Function to add content to the current message
function addContent(content) {
  if (content !== undefined && content !== "") {
    response_content += content; // Append chunk to the response content
    var new_response = DOMPurify.sanitize(marked.parse(response_content));
    messageContent.innerHTML = new_response; // Update message display
    messageContent.scrollTop = messageContent.scrollHeight;
    // console.log(currentSpeaker);
    if (currentSpeaker == "bot") {
      if (need_speaker) {
        text += content; // Append chunk to form a sentence
        // console.log("Collecting text:", text);

        // Check if this chunk completes a sentence
        if (isSentenceComplete(text)) {
          console.log("Sentence completed:", text);
          textQueue.push(text.trim()); // Queue the complete sentence
          text = ""; // Clear the buffer for the next sentence
          processQueue(); // Check the queue and start TTS if idle
        }
      }
    }
  }
}

// Function to determine if a sentence is complete
function isSentenceComplete(text) {
  return /[.?]\s*$/.test(text.trim()); // Ends in a sentence-terminating punctuation
}

function processQueue() {
  if (!isSpeaking && textQueue.length > 0) {
    const sentence = textQueue.shift(); // Get the next sentence from the queue
    cleanText(sentence); // Prepare the text and start TTS
    isSpeaking = true; // Set speaking status to true while TTS is active
  }
}

// Function to end the current message and optionally show a loading indicator
function endMessage() {
  cleanText(text);
  text = "";
  response_content = "";
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
  const modelSelected = document.getElementById("select_model_btn").value;

  if (!modelSelected) {
    alert("Please select a model");
    return;
  }

  if (userPrompt) {
    fetch("/get_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt, model_need: modelSelected }),
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
  const selectElement = document.getElementById("select_model_btn");
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  selectElement.appendChild(option);
}

// Fetch the list of models from the server and populate the dropdown
function get_list() {
  fetch("/list_request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: "list_of_llm" }),
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("list", JSON.stringify(data));
      data.list.models.forEach((model) => createModelOption(model.name));
      data.list.models.forEach((model) => createModalList(model.name));
      showNotification("List fetched successfully");
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
      text = "";
      endMessage();
      break;
    case "[|/__START__/|]":
      text = "";
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
  showNotification("Copied");
  document.body.removeChild(textArea);
  // alert("Copied to clipboard!");
}
const lastMessage = messageDiv.lastElementChild;
if (lastMessage) {
  lastMessage.scrollIntoView({ behavior: "smooth" });
}
