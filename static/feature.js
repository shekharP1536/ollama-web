mic_button = document.getElementById("micButton");
sst_content = document.getElementById("gen_txt_con");
var mic_on_not = new Audio('static/resource/mic_on_effect.mp3');
var mic_off_not = new Audio('static/resource/mic_off_effect.mp3');
var outlines = document.getElementsByClassName("outline");  // Changed outline to outlines
var prompt = "";
mic_button.addEventListener("click", () => {
    if (mic_button.checked) {
        console.log("Checked");
        mic_on_not.play();
        sst_content.innerHTML = "";
        prompt = "";
        send_cmd("mic_on"); 
        for (let outline of outlines) {  // Loop through outlines correctly
            outline.classList.add("animate-pulse");
        }
    } else {
        console.log("not");
        mic_off_not.play();
        send_cmd("mic_off");
        console.log(prompt);
        send_mic_input(prompt);
        for (let outline of outlines) {  // Loop through outlines correctly
            outline.classList.remove("animate-pulse");
        }
    }
});

function send_cmd(cmd){
    fetch("/get_cmd" ,{
        method : "POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({cmd : cmd})
    }).then((response) => response.json())
    .then((data) =>{
        console.log("received:" ,data)
    })
    .catch((error) => console.error("Error:", error));
}

function send_mic_input(userPrompt) {
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
      .catch((error) => console.error("Error:", error)); // Clear input field
  }
}

const STT_source = new EventSource("/sst_event");
STT_source.onmessage = function (event){
    const resp = event.data
    console.log(resp)
    prompt += resp;
    sst_content.innerHTML += resp;
}
function openCity(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }
  
  // Get the element with id="defaultOpen" and click on it
  document.getElementById("defaultOpen").click();