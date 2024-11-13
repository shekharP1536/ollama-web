const commands = {
    'hello': function() {
        return "Hello! How can I assist you today?";
    },
    'date': function() {
        return `Current date and time: ${new Date().toLocaleString()}`;
    },
    'time': function() {
        return `Current time: ${new Date().toLocaleTimeString()}`;
    },
    'clear': function(outputDiv) {
        // Clear the terminal output
        outputDiv.innerHTML = '';
        return;
    },
    'help': function() {
        return "Available commands:\n- hello: Greet the terminal\n- date: Show current date and time\n- time: Show current time\n- clear: Clear the terminal screen\n- history: Show command history";
    },
    'history': function() {
        return `Command History:\n- hello\n- date\n- time\n- clear\n- help\n`; // You can dynamically generate this from the input history
    },
    'unknown': function(input) {
        return `Command not found: ${input}`;
    }
};