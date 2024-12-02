const messageDiv = document.getElementById("new_msg");
let currentSpeaker = null;
let messageContent = "";
let loadingIndicator;
let code_block = true;
let flow = false;
const sentences = [];
let currentSentence = "";
let new_chat = false
const callButton = document.getElementById('CallButton');
const speechContent = document.getElementById('speech_content');
var continaer_of_all = document.getElementById('section_a_chats_holder');

// Add click event listener to the button
callButton.addEventListener('click', () => {
  // Toggle the 'none' class
  speechContent.classList.toggle('none');

});
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("section_a_chats_holder");

  if (container) {
    container.addEventListener("click", (event) => {
      // Check if a clicked element has the class 'section_a_chats'
      const clickedElement = event.target.closest(".section_a_chats");

      if (clickedElement && container.contains(clickedElement)) {
        // Remove 'active_div' class from all elements with the class 'section_a_chats'
        const chatElements = container.querySelectorAll(".section_a_chats");
        chatElements.forEach((element) => {
          element.classList.remove("active_div");
        });

        // Add 'active_div' class to the clicked element
        clickedElement.classList.add("active_div");

        // Log the id of the clicked element
        const elementId = clickedElement.id;
        console.log("Clicked element ID:", elementId);
        load_chat(elementId)
      }
    });
  }
});
// Initialize the page and populate model list on load
document.addEventListener("DOMContentLoaded", get_chats);
document.addEventListener("DOMContentLoaded", get_list);
const selectElement = document.getElementById("select_model_btn");
selectElement.addEventListener("change", (event) => {
  console.log('Change detected!');
  localStorage.setItem("selectedModel", event.target.value);
}); 
function load_chat(id){
  fetch('/load_chat',{
    method : "POST",
    headers: {"Content-Type": "application/json"},
    body : JSON.stringify({"Id" : id})
  })
  .then((response) => response.json())
  .then((data) =>{
    messageDiv.innerHTML = "";
    console.log(data);
    data.response.forEach((response) => {
      var speaker = response.role;
      var content = response.content;
      if(speaker == "user"){
        startMessage("user");
        text = "";
        endMessage();
        addContent(content);
      }else{
        action(true);
        startMessage("bot");
        addContent(content);
        endMessage();
        action(false);
      }
    }) 
  })
}
function new_chat_re(){
  console.log("ssdsd");
  messageDiv.innerHTML = "";
  get_chats()
  showNotification("starting New Chat");
  new_chat = true
}
function setModel() {
  const selectElement = document.getElementById("select_model_btn");
  if (!selectElement) {
    console.error('Select element not found in DOM!');
    return;
  }
  const savedModel = localStorage.getItem("selectedModel");
  if (savedModel) {
    console.log('Using saved model');
    selectElement.value = savedModel;
    localStorage.setItem("selectedModel", savedModel);
  } else {
    console.log('No saved model found');
    const currentModel = selectElement.value;
    console.log(`Current select element value: ${currentModel}`);
    localStorage.setItem("selectedModel", currentModel);
  }
  console.log('Adding event listener for changes...');
  const originalChangeHandler = selectElement.addEventListener("change", (event) => {
    console.log(`Change detected!`);
    console.log(`Event target value: ${event.target.value}`);
    localStorage.setItem("selectedModel", event.target.value);
  });
}
// Function to start a new message
function startMessage(speaker) {
  const modelName = document.getElementById("select_model_btn").value || "Model";
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

  if (speaker === "bot") {
    // Add an icon for the bot
    const botIcon = document.createElement("img");
    botIcon.src = "/static/resource/logo_icon.png";
    botIcon.alt = "Bot Icon";
    botIcon.classList.add("bot-icon"); // Add a CSS class for styling
    botIcon.style.width = "16px"; // Adjust size as needed
    botIcon.style.height = "16px";
    botIcon.style.marginRight = "15px"; // Add spacing between icon and text
    speakerNameContainer.appendChild(botIcon);
  }

  speakerNameContainer.innerHTML += `<strong>${speaker === "user" ? "You" : modelName}:</strong>`;
  messageContainer.appendChild(speakerNameContainer);

  // Create a container for the response content
  const messageContentContainer = document.createElement("div");
  messageContentContainer.classList.add("message-content");
  messageContainer.appendChild(messageContentContainer);

  // Add a hover effect to show the copy button
  var copyButton_container = document.createElement("p");
  copyButton_container.classList.add("copy");
  copyButton_container.style.display = "none"; // Correct capitalization of "display"
  var copyButton = document.createElement("i");
  copyButton.classList.add("fa-regular", "fa-copy");
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
    console.log("loading removed");
  }
}

// Function to add content to the current message
function addContent(content) {
  if (content !== undefined && content !== "") {
    response_content += content; // Append chunk to the response content
    var new_response = DOMPurify.sanitize(convertMarkdownToHTML(response_content));
    messageContent.innerHTML = new_response; // Update message display
    messageDiv.scrollHeight;
    if (currentSpeaker == "bot") {
      if (need_speaker) {
        text += content; // Buffer the content to form a sentence
        // Check if the sentence is complete
        if (isSentenceComplete(text)) {
          console.log("Sentence completed:", text);
          textQueue.push(text.trim()); // Add complete sentence to the queue
          text = "";  // Clear the buffer for the next sentence
          processQueue();  // Check and process the queue
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
    sentence = textQueue.shift(); // Get the next sentence from the queue
    cleanText(sentence); // Prepare the text and start TTS
    isSpeaking = true; // Set speaking status to true while TTS is active
  }
}
function endMessage() {
  highlightAll();
  cleanText(text);
  text = "";
  response_content = "";
  flow = false;
  if (currentSpeaker === "user") {
    console.log("user");
    showLoadingIndicator("Thinking...")
  }
  currentSpeaker = null;
}
function showLoadingIndicator(text) {
  // Create the loading indicator element
  loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading";
  loadingIndicator.innerHTML = text;
  // Ensure messageContent is defined and append the loading indicator
  if (messageContent) {
    messageDiv.appendChild(loadingIndicator);
    console.log(messageDiv, loadingIndicator);

  } else {
    console.error("messageContent is not defined");
  }
}

function set_model() {
  const modelSelected = document.getElementById("select_model_btn").value;

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
    highlightAll();
    cleanText(text);
    text = "";
    response_content = "";
    flow = false;
    if (currentSpeaker === "user") {
      console.log("user");
      showLoadingIndicator("Thinking...")
    }
    currentSpeaker = null;
  }

  // Function to show a loading indicator
  function showLoadingIndicator(text) {
    // Create the loading indicator element
    loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading";
    loadingIndicator.innerHTML = text;
    // Ensure messageContent is defined and append the loading indicator
    if (messageContent) {
        messageDiv.appendChild(loadingIndicator);
        console.log(messageDiv, loadingIndicator);
        
    } else {
        console.error("messageContent is not defined");
    }
}


  // Function to handle user input and send it to the server
  function sendUserInput() {
    const inputField = document.getElementById("userInput");
    const userPrompt = inputField.innerText.trim();
    const modelSelected = localStorage.getItem("selectedModel");
    if (!modelSelected) {
      alert("Please select a model");
      return;
    }

    if (userPrompt) {
      fetch("/get_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, model_need: modelSelected,new_chat }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response received:", data.response);
        })
        .catch((error) => console.error("Error:", error));

      inputField.innerText = ""; // Clear input field
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
      body: JSON.stringify({ prompt: userPrompt, model_need: modelSelected, new_chat: new_chat }),
    })
      .then((response) => response.json())
      .then((data) => {
        localStorage.setItem("list", JSON.stringify(data));
        data.list.models.forEach((model) => createModelOption(model.name));
        data.list.models.forEach((model) => createModalList(model.name));
        showNotification("List fetched successfully");
        save_log("List fetched successfully");
      })
      .catch((error) => console.error("Error:", error));

    inputField.value = ""; // Clear input field
    new_chat = false;
  }

  // Event listeners for submitting input
  document.getElementById("submitButton").onclick = sendUserInput;
  document.getElementById("userInput").addEventListener("keypress", (event) => {
    if (!flow && event.key === "Enter"){
      event.preventDefault();
      sendUserInput();
    } 
  });

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
      data.list.models.forEach((model) => createModalList(model.name, model.model, model.size, model.details.parameter_size, model.details.family, model.details.format, model.details.quantization_level));
      showNotification("List fetched successfully");
      save_log("List fetched successfully");
      setModel()
    })
    .catch((error) => console.error("Fetch error:", error));
}
function get_chats() {
  continaer_of_all.innerHTML = ""
  fetch("/get_chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: "list_of_llm" }),
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("chats", JSON.stringify(data));
      console.log(data);
      data.response.forEach(chat => {
        model_chat_list(chat.title ,chat.id );
      });


    })
    .catch((error) => console.error("Fetch error:", error));
}

// Event listeners for submitting input
document.getElementById("submitButton").onclick = sendUserInput;
document.getElementById("userInput").addEventListener("keypress", (event) => {
  if (!flow && event.key === "Enter") sendUserInput();
});

function model_chat_list(modal_name,id) {
  // continaer_of_all.innerHTML = ""
  var div = document.createElement("div");
  var div1 = document.createElement("div");
  var span = document.createElement("span");
  var span1 = document.createElement("span");
  var div2 = document.createElement("div");
  var span2 = document.createElement("span");

  div.className = "section_a_chats";
  div.id = id
  div1.className = "chat_title";
  div2.className = "chat_option";

  span.className = "chat_model_title";
  span1.className = "time_of-active";
  span2.className = "status_icons";

  span.innerText = modal_name;
  span2.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';


  div1.appendChild(span);
  div1.appendChild(span1);
  div2.appendChild(span2);
  div.appendChild(div1);
  div.appendChild(div2);
  continaer_of_all.append(div);

}
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
}
// Function to copy text to clipboard
function copyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  showNotification("Copied");
  save_log("coppied : " + text)
  document.body.removeChild(textArea);
  // alert("Copied to clipboard!");
}
function chat_chat(prompt) {
  console.log(`Running chat with prompt: ${prompt}`);
  var input = document.getElementById("userInput");
  input.innerText = prompt;
  // Implement chat functionality here
}