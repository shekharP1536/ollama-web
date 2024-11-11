from http import client
from urllib import response
from flask import Flask, render_template, jsonify, Response , request
import ollama
import json
from RealtimeSTT import AudioToTextRecorder
import time
import os
import datetime
import threading
from queue import Queue
mic_event = threading.Event()

app = Flask(__name__ , template_folder='templates')

conversation = []
clients = []
sst_client = []
clients_lock = threading.Lock()
stream_flow = False
date_time = datetime.datetime.now()

# save converstion_in new_file

def save_conversation():
    folder_name = 'log_data/conversation'
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    
    # Format current date and time to be compatible with file names
    date_time = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f'conversation_{date_time}.json'
    file_path = os.path.join(folder_name, filename)
    
    # Save the conversation data to the JSON file
    with open(file_path, 'w') as f:
        json.dump(conversation, f)


def process_text(text):
    print(text)
    # Send the text to the client through SSE or some other method
    send_to_client(text)

def record_audio():
    print("Microphone ready. Waiting for 'mic_on' command...")
    recorder = AudioToTextRecorder()
    while True:
        # Wait until mic_event is set to start recording
        mic_event.wait()
        print("Recording started. Speak now...")
        # Start recording and process the text until `mic_event` is cleared
        while mic_event.is_set():
            recorder.text(process_text)
        print("Recording stopped.")

record_audio_thread = threading.Thread(target=record_audio)
record_audio_thread.daemon = True
record_audio_thread.start()

def client(data):
    """Send data to all connected clients."""
    with clients_lock:
        for client in clients:
            client.put(data)

# generate_llm response
def generate_reponse(prompt ,model):
    print(prompt, model)
    if prompt == "":
        exit
    user_rep_st = "[|/__USER_START__/|]"
    client(user_rep_st)
    client(f"{prompt}")
    user_rep_end = "[|/__USER_END__/|]"
    client(user_rep_end)
    conversation.append({'role': 'user', 'content': prompt})

    #start streaming reponse 
    stream = ollama.chat(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        stream=True,
    )
    response_text = ""
    global stream_web
    stream_web = True

    start_marker = "[|/__START__/|]"
    save_conversation()
    client(start_marker)

    for chunk in stream:
        if not stream_web:
            break
        message_chunk = chunk['message']['content']
        response_text += message_chunk +"#"
        process(message_chunk)
        
    conversation.append({'role': 'bot','model': model, 'content': response_text})
    done_marker = "[|/__DONE__/|]"
    stream_web = False
    save_conversation()

    client(done_marker)

def process(message_chunk):
    match message_chunk:
        case _ if "\n" in message_chunk or message_chunk == "":  # Check if it contains '\n', '*' or is empty
            message_chunk = "<br>"
        case _ if "\n\n\n" in message_chunk:  # Check if it contains three newlines
            message_chunk = "<hr><br><br>"
        case _:  # Default case if none of the above match
            pass

    # message_chunk.replace("*" , "<br>")
    # message_chunk.replace("\n" , "<br>")
    client(message_chunk)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_response' , methods=['POST'])
def get_response():
    if request.method == 'POST':
        data = request.get_json()
        prompt = data.get('prompt')
        model = data.get('model_need')
        response = generate_reponse(prompt, model)
        return jsonify({'response' : 'Success'})

def send_to_client(data):
    # You will send the text to the client via SSE
    with app.app_context():
        for client in sst_client:
            client.put(data)

@app.route("/get_cmd", methods=["POST"])
def exe_cmd():
    data = request.get_json()
    cmd = data.get("cmd")
    
    if cmd == "mic_on":
        print("Received 'mic_on' command.")
        mic_event.set()  # Start recording

    elif cmd == "mic_off":
        print("Received 'mic_off' command.")
        mic_event.clear()  # Stop recording

    return jsonify({"status": "success", "command": cmd})
    
# Event to streame response
@app.route('/sst_event')
def stream():
    def event_stream():
        queue = Queue()
        sst_client.append(queue)

        try:
            while True:
                # This will yield data from the server to the client when new data is available
                data = queue.get()  # Blocking call until new data is available
                yield f"data: {data}\n\n"  # Send the data as an SSE
        except GeneratorExit:
            sst_client.remove(queue)

    return Response(event_stream(), content_type='text/event-stream')

@app.route('/list_request' , methods=['POST'])
def list_llm():
    if request.method == 'POST':
        list = ollama.list()
        return jsonify({"list": list})
@app.route('/stream_response')
def stream_response():
    def generate():
        """Handle server-sent events for real-time streaming."""
    def generate():
        client_queue = Queue()
        with clients_lock:
            clients.append(client_queue)

        try:
            while True:
                message = client_queue.get()
                yield f"data: {message}\n\n"
        except GeneratorExit:
            with clients_lock:
                clients.remove(client_queue)

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True)