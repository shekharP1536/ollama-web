from http import client
from flask import Flask, render_template, jsonify, Response , request
import ollama
import json
import time
import os
import datetime
import threading
from queue import Queue

app = Flask(__name__ , template_folder='templates')

conversation = []
clients = []
clients_lock = threading.Lock()
stream_flow = False
date_time = datetime.datetime.now()

# save converstion_in new_file
def save_conversation():
    
    folder_name = 'log_data/conversation'
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    filename = f'conversation_{date_time}.json'
    file_path = os.path.join(folder_name, filename)
    with open(file_path , 'w') as f:
        json.dump(conversation, f)

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
    t = time.time()
    crt = time.ctime(t)
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


    message_chunk.replace("*" , "<br>")
    message_chunk.replace("\n" , "<br>")
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