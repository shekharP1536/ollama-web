const synth = window.speechSynthesis;
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const stopButton_voice = document.getElementById("stopButton_voice");
const voiceSelect = document.getElementById("voiceSelect");
const pitchInput = document.getElementById("pitchInput");
const rateInput = document.getElementById("rateInput");
const speech_div = document.getElementById("speaker_div");
let voices = [];
var text = [];
let response_content = ""; // Stores incoming content
let textQueue = []; // Queue for complete sentences
let isSpeaking = false;
if (!synth) {
  console.error("Speech synthesis not supported in this browser.");
}
// Get voices when the API is ready
function populateVoices() {
  voices = synth.getVoices();
  voiceSelect.innerHTML = ""; // Clear existing voices

  // Filter voices to only include English and Hindi
  const filteredVoices = voices.filter(
    (voice) => voice.lang.includes("en-AU") || voice.lang.includes("en-IN")
  );

  // Populate voiceSelect with filtered voices
  filteredVoices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  // Select the first available voice by default
  if (filteredVoices.length > 0) {
    voiceSelect.value = filteredVoices[0].name;
  }
}

// Function to start speech with custom options
function startSpeech(text) {
  console.log(text);
  console.log("Speech-started");
  if (text === "") {
    console.log("We got emplty text which can't be synthesis")
  }
  if (text !== "") {
    const speech = new SpeechSynthesisUtterance(text);
    const selectedVoice = voiceSelect.value;
    speech.voice = voices.find((voice) => voice.name === selectedVoice);
    speech.pitch = parseFloat(pitchInput.value); // Set pitch
    speech.rate = parseFloat(rateInput.value); // Set rate

    // Show the speaker icon when speech starts
    // Show the speaker icon with fade-in animation
    speech.onstart = () => {
      isSpeaking = true;
      speech_div.classList.remove("fadeOut"); // Remove fade-out if it's still there
      speech_div.classList.add("speaker_vis");
      console.log("speech_start");
    };

    // Hide the speaker icon with fade-out animation
    speech.onend = () => {
      isSpeaking = false;
      processQueue();
    //   need_speaker = true; //temp
      need_speaker = false;
      speech_div.classList.add("fadeOut");
      console.log("end_speech"); // Add fade-out animation

      // Remove .speaker_vis after fade-out animation completes (0.5s)
      //   setTimeout(() => {
      //     speech_div.classList.remove("speaker_vis", "fadeOut");
      //   }, 500);
    };

    synth.speak(speech);
  }
}

// Function to stop speech
function stopSpeech() {
  synth.pause(); // Cancels the ongoing speech
//   need_speaker = true; //temp
  need_speaker = false;
  speech_div.classList.add("fadeOut");
  console.log("end_speech");
}

// Populate voice list when voices are loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoices;
}

// Event listeners for start and stop buttons
startButton.addEventListener("click", () =>
  startSpeech("Hey, there how are you?")
);
stopButton.addEventListener("click", stopSpeech);

function cleanText(inputText) {
  if (inputText != "") {
    let text = inputText.toString();

    // Step 1: Remove HTML tags
    text = text.replace(/<\/?[^>]+(>|$)/g, "");

    // Step 2: Remove specific special characters (example: #, *, @, etc.)
    const specialCharacters = /[#@*]/g; // Add any specific special characters you want to remove
    text = text.replace(specialCharacters, "");

    // Step 3: Remove emojis
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    text = text.replace(emojiRegex, "");

    // Trim whitespace
    text = text.trim();

    console.log(text, "filter");
    startSpeech(text);
  } else {
    console.log("input_is_empty");
  }
}

// Usage example
// Output: "Hello ! Welcome to JavaScript programming."
stopButton_voice.addEventListener("click", stopSpeech);