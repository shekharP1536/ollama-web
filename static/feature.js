mic_button = document.getElementById("micButton");
sst_content = document.getElementById("gen_txt_con");
var mic_on_not = new Audio("static/resource/mic_on_effect.mp3");
var mic_off_not = new Audio("static/resource/mic_off_effect.mp3");
var outlines = document.getElementsByClassName("outline"); // Changed outline to outlines
var prompt = "";
let need_speaker = false;
mic_button.addEventListener("click", () => {
  if (mic_button.checked) {
    console.log("Checked");
    mic_on_not.play();
    sst_content.innerHTML = "";
    prompt = "";
    send_cmd("mic_on");
    need_speaker = true;
    for (let outline of outlines) {
      // Loop through outlines correctly
      outline.classList.add("animate-pulse");
    }
  } else {
    console.log("not");
    mic_off_not.play();
    send_cmd("mic_off");

    console.log(prompt);
    send_mic_input(prompt);
    for (let outline of outlines) {
      // Loop through outlines correctly
      outline.classList.remove("animate-pulse");
    }
  }
});

function send_cmd(cmd) {
  fetch("/get_cmd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cmd: cmd }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("received:", data);
    })
    .catch((error) => console.error("Error:", error));
}

function send_mic_input(userPrompt) {
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
      .catch((error) => console.error("Error:", error)); // Clear input field
  }
}

const STT_source = new EventSource("/sst_event");
STT_source.onmessage = function (event) {
  const resp = event.data;
  console.log(resp);
  prompt += resp;
  sst_content.innerHTML += resp;
};
// Handeling tab is setting modal
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;

  // Hide all tab contents
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  // Remove "active" class from all tab links
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab and add "active" class
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Set the default tab to open on page load
document.getElementById("defaultOpen").click();

// Set up terminal input and output interaction
// Set up terminal input and output interaction
document
  .getElementById("terminal-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();

      const input = event.target.value;
      const outputDiv = document.getElementById("terminal-output");

      // Display input as a new command line
      const commandLine = document.createElement("div");
      commandLine.textContent = `user@localhost:~$ ${input}`;
      outputDiv.appendChild(commandLine);

      // Process the command using the command dictionary
      processCommand(input, outputDiv);

      // Scroll to bottom of terminal
      outputDiv.scrollTop = outputDiv.scrollHeight;

      // Clear input field
      event.target.value = "";
    }
  });

// Function to process commands
// Function to process commands
function processCommand(input, outputDiv) {
  // Add the current command to history
  commandHistory.push(input);

  const commandKey = input.toLowerCase();

  // Check if the command exists in the dictionary
  if (commands[commandKey]) {
    // If the command is a function, call it and get the response
    const response = commands[commandKey](outputDiv);

    // Display the response for the command
    if (response) {
      const outputResponse = document.createElement("div");
      outputResponse.innerHTML = formatResponse(response); // Format response with line breaks
      outputDiv.appendChild(outputResponse);
    }
  } else {
    // If the command is not found, show the 'unknown' response
    const outputResponse = document.createElement("div");
    outputResponse.innerHTML = formatResponse(commands["unknown"](input)); // Format response with line breaks
    outputDiv.appendChild(outputResponse);
  }
}
let commandHistory = [];

// Function to process commands
function processCommand(input, outputDiv) {
  // Add the current command to history
  commandHistory.push(input);

  const commandKey = input.toLowerCase();

  // Check if the command exists in the dictionary
  if (commands[commandKey]) {
    // If the command is a function, call it and get the response
    const response = commands[commandKey](outputDiv);

    // Display the response for the command
    if (response) {
      const outputResponse = document.createElement("div");
      outputResponse.innerHTML = formatResponse(response); // Format response with line breaks
      outputDiv.appendChild(outputResponse);
    }
  } else {
    // If the command is not found, show the 'unknown' response
    const outputResponse = document.createElement("div");
    outputResponse.innerHTML = formatResponse(commands["unknown"](input)); // Format response with line breaks
    outputDiv.appendChild(outputResponse);
  }
}

// Function to format response with line breaks
function formatResponse(response) {
  return response.replace(/\n/g, "<br>"); // Replace '\n' with <br> for line breaks
}
var save_con_btn = document.getElementById("save_con");
save_con_btn.addEventListener("click", () => {
  fetch("/get_cmd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cmd: "get_file" }),
  })
    .then((response) => {
      if (response.ok) {
        return response.blob();
      } else {
        throw new Error("File download failed");
      }
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get the value of the input element with id 'file_name'
      const fileNameInput = document.getElementById("file_name").value.trim();

      // If the input is empty, use the default file name
      a.download = fileNameInput
        ? `${fileNameInput}.json`
        : "conversation_log.json";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("File downloaded.")
    })
    .catch((error) => console.error(error));
});

var messageElement = document.getElementById('notification_pannel');
function showNotification(message) {
  messageElement.innerHTML = message;
  messageElement.style.display = "block";
  setTimeout(function () {
    messageElement.innerHTML = '';
    messageElement.style.display = "none";
  }, 5000);
}
messageElement.addEventListener("click", function () {
  messageElement.style.display = "none";
});