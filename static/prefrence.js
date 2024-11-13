function saveProfile() {
  // Get form values
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const dob = document.getElementById("dob").value;

  // Placeholder action: log the values
  console.log("Profile saved:");
  console.log("Username:", username);
  console.log("Email:", email);
  console.log("Password:", password ? "******" : "No change");
  console.log("Date of Birth:", dob);

  alert("Profile saved successfully!");
}

function cancelChanges() {
  document.getElementById("profileForm").reset();
  alert("Changes canceled.");
}
const modal_container = document.getElementById("modal_container");
function createModalList(models) {
    // Create a container for the list
    const listContainer = document.createElement("div");
    listContainer.classList.add("modal-list");
  
    // Create the row for each model
    const row = document.createElement("div");
    row.classList.add("modal-list-item");
  
    // Create model name (which is clickable)
    const modelName = document.createElement("span");
    modelName.textContent = models;  // Assuming model has a 'name' property
    modelName.classList.add("model-name");
    modelName.style.cursor = 'pointer';  // Make it clear that it's clickable
  
    // Create a container for the buttons, initially hidden
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-container");
    buttonsContainer.classList.add("none");
    // buttonsContainer.style.display = 'none'; // Hide buttons by default
  
    // Create View Info button (>)
    const viewButton = document.createElement("i");
    viewButton.classList.add("fa-solid", "fa-info");
    viewButton.onclick = () => alert(`Info about ${models}`); // Show info in alert
  
    // Create Delete button (trash icon)
    const deleteButton = document.createElement("i");
    deleteButton.classList.add("fa-solid", "fa-trash");
    deleteButton.onclick = () => {
      row.remove(); // Remove this model from the list
      console.log(`Deleted ${models}`);
    };
  
    // Create Manage button (greater-than-or-equal icon)
    const manageButton = document.createElement("i");
    manageButton.classList.add("fa-solid", "fa-greater-than-equal");
    manageButton.onclick = () => {
      // Add functionality to manage the model, e.g., open edit dialog
      alert(`Managing ${models}`);
    };
  
    // Append buttons to the buttons container
    buttonsContainer.appendChild(viewButton);
    buttonsContainer.appendChild(deleteButton);
    buttonsContainer.appendChild(manageButton);
  
    // Add event listener to model name to toggle the visibility of buttons
    modelName.onclick = () => {
      const isVisible = buttonsContainer.style.display === 'block';
      buttonsContainer.style.display = isVisible ? 'none' : 'block'; // Toggle visibility
    };
  
    // Append model name and buttons container to the row
    row.appendChild(modelName);
    row.appendChild(buttonsContainer);
  
    // Add row to the list container
    listContainer.appendChild(row);
  
    // Append the list container to the modal
    modal_container.appendChild(listContainer);
  }
