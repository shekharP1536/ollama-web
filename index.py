from flask import Flask, render_template, jsonify, Response, request, send_file
import ollama
import json
import time
import os
import datetime
import threading
from queue import Queue

con_path = ""
app = Flask(__name__, template_folder='templates')

conversation = []
clients = []
chat_history = []
clients_lock = threading.Lock()
stream_flow = False
date_time = datetime.datetime.now()

# Save conversation in a new file
def save_conversation():
    global con_path  # Use the global variable to store the file path across calls

    # Define the folder where logs are stored
    folder_name = 'log_data/conversation_logs'
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    
    # Get the current date (without time) to use as part of the filename
    date_str = datetime.datetime.now().strftime("%Y-%m-%d-%h-%m")
    
    # If `con_path` is None or if it doesn't match today's date, create a new file path
    if not con_path or date_str not in con_path:
        filename = f'conversation_{date_str}.json'
        con_path = os.path.join(folder_name, filename)

    # Save or update the conversation data in the JSON file
    if os.path.exists(con_path):
        # Load existing data and append new data to it
        with open(con_path, 'r+') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []
            existing_data.extend(conversation)
            f.seek(0)
            json.dump(existing_data, f, indent=4)
    else:
        # Create new file if it doesn't exist
        with open(con_path, 'w') as f:
            json.dump(conversation, f, indent=4)

    print(f"Conversation saved to {con_path}")

def client(data):
    """Send data to all connected clients."""
    with clients_lock:
        for client in clients:
            client.put(data)

# Generate LLM response
def generate_response(prompt, model):
    print(prompt, model)
    if prompt == "":
        return
    user_rep_st = "[|/__USER_START__/|]"
    client(user_rep_st)
    client(f"{prompt}")
    user_rep_end = "[|/__USER_END__/|]"
    client(user_rep_end)
    conversation.append({'role': 'user', 'content': prompt})
    chat_history.append({"role": "user", "content": prompt})
    # Start streaming response
    stream = ollama.chat(
        model=model,
        messages=[{'role': 'user', 'content': prompt}] + chat_history,
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
        response_text += message_chunk
        process(message_chunk)
        
    conversation.append({'role': 'bot', 'model': model, 'content': response_text})
    chat_history.append({'role': 'assistant', 'content': response_text})
    done_marker = "[|/__DONE__/|]"
    stream_web = False
    save_conversation()

    client(done_marker)

def process(message_chunk):
    match message_chunk:
        case _ if "\n" in message_chunk or message_chunk == "":
            message_chunk = "<br>"
        case _ if "\n\n\n" in message_chunk:
            message_chunk = "<hr><br><br>"
        case _:
            pass

    client(message_chunk)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    if request.method == 'POST':
        data = request.get_json()
        prompt = data.get('prompt')
        model = data.get('model_need')
        response = generate_response(prompt, model)
        return jsonify({'response': 'Success'})

@app.route("/get_cmd", methods=["POST"])
def exe_cmd():
    data = request.get_json()
    cmd = data.get("cmd")
    
    if cmd == "get_file":
        if con_path and os.path.exists(con_path):
            return send_file(con_path, as_attachment=True)
        else:
            return jsonify({"error": "File not found"}), 404

    return jsonify({"status": "success", "command": cmd})

@app.route('/stream_response')
def stream_response():
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

@app.route('/list_request', methods=['POST'])
def list_llm():
    if request.method == 'POST':
        list = ollama.list()
        return jsonify({"list": list})

if __name__ == '__main__':
    app.run(debug=True)
