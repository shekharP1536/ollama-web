from flask import Flask, render_template, jsonify, Response, request, send_file
import ollama
import json
import time
import os
import datetime
import threading
from queue import Queue
import uuid
con_path = ""
date_str = ""
conversation = []
clients = []
chat_history = []
clients_lock = threading.Lock()
stream_flow = False
chat_title = "Starting New chat"
app = Flask(__name__, template_folder='templates')

def getId():
    global date_str
    current_time = datetime.datetime.now()
    formatted_time = current_time.strftime("%Y%m%d_%H%M%S")
    date_str = formatted_time
    print(date_str)
getId()
def save_conversation(create_new_file=False):
    global con_path, date_str,chat_title # Use the global variables to store the file path and date_str across calls
    # Define the folder where logs are stored
    folder_name = 'log_data/conversation_logs'
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    if create_new_file or not con_path or date_str not in con_path:
        filename = f'conversation_{date_str}.json'
        con_path = os.path.join(folder_name, filename)
    elif not create_new_file and con_path:
        pass 
    if not date_str:
        date_str = str(uuid.uuid4())  # Generate a unique date_str for the conversation

    # Prepare the data structure with only the conversation array for subsequent saves
    conversation_data = {
        "chat_title" : chat_title,
        "chat_id": date_str,
        "conversation": conversation  # Assume `conversation` is a list holding conversation data
    }

    # Save or update the conversation data in the JSON file
    if os.path.exists(con_path):
        # Load existing data
        with open(con_path, 'r+') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = []

            # Check if the file already contains the conversation with the same chat_id
            existing_chat_ids = [entry["chat_id"] for entry in existing_data]
            if date_str in existing_chat_ids:
                # If the chat_id already exists, just update the existing conversation array
                for entry in existing_data:
                    if entry["chat_id"] == date_str:
                        entry["conversation"] = conversation  # Overwrite the conversation data
                        break
            else:
                # Add new conversation if chat_id doesn't exist
                existing_data.append(conversation_data)

            # Save the updated conversation data back to the file
            f.seek(0)
            json.dump(existing_data, f, indent=4)

    else:
        # Create new file if it doesn't exist
        with open(con_path, 'w') as f:
            json.dump([conversation_data], f, indent=4)  # Wrap in a list to store multiple conversations

    print(f"Conversation saved to {con_path}")

def new_chat(title,create_new_file=False):
    print("Request for new chat.")
    global conversation, con_path, chat_title
    conversation = []
    con_path = "" 
    chat_title = title
    getId()
    save_conversation(create_new_file=True)

def client(data):
    """Send data to all connected clients."""
    with clients_lock:
        for client in clients:
            client.put(data)

# Generate LLM response
def generate_response(prompt, model,chat_request):
    print(prompt, model,chat_request)
    if prompt == "":
        return
    if chat_request == True:
        print("true")
        new_chat(prompt[:20])
    
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
    # Replace patterns in the correct order
    if "\n\n\n" in message_chunk:  # Triple line breaks
        message_chunk = message_chunk.replace("\n\n\n", "<hr><br><br>")
    if "\n\n" in message_chunk:  # Double line breaks
        message_chunk = message_chunk.replace("\n\n", "<br><br>")
    if "\n" in message_chunk:  # Single line breaks
        message_chunk = message_chunk.replace("\n", "<br>")
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
        chat_request = data.get("new_chat")
        response = generate_response(prompt, model,chat_request)
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
@app.route('/get_chats', methods=['POST'])
def get_chats():
    folder_name = 'log_data/conversation_logs'
    if not os.path.exists(folder_name):
        return jsonify({"cat": "empty", "response": "Start chat"})
    files = os.listdir(folder_name)

    json_files = [file for file in files if file.endswith('.json')]

    if not json_files:
        return jsonify({"cat": "empty", "response": "No chats found"})
    
    chat_titles = []
    
    # Iterate through each .json file and extract the chat_title
    for json_file in json_files:
        file_path = os.path.join(folder_name, json_file)
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
                # Check if data is a list (list of chats)
                if isinstance(data, list):
                    for chat in data:
                        # Ensure 'chat_title' exists in each chat
                        if "chat_title" in chat:
                            chat_titles.append(chat["chat_title"])
        except json.JSONDecodeError:
            continue  
    if not chat_titles:
        return jsonify({"cat": "empty", "response": "No valid chat titles found"})
    
    # Return the list of chat titles
    return jsonify({"cat": "success", "response": chat_titles})
if __name__ == '__main__':
    app.run(debug=True)
