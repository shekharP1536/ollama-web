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
} const modal_container = document.getElementById("modal_container");

function createModalList(models, model, size, parameter_size, family, format, quantization_level) {

  const sizeInGB = (size / 1e9).toFixed(2) + " GB"; // Decimal
  // const sizeInGiB = (size / 1024 / 1024 / 1024).toFixed(2) + " GiB"; // Binary
  const listContainer = document.createElement("div");
  listContainer.classList.add("modal-list");

  // Create the row for the model
  const row = document.createElement("div");
  row.classList.add("modal-list-item");

  // Create a clickable container for the model name and toggle icon
  const modelNameContainer = document.createElement("div");
  modelNameContainer.classList.add("model-name-container");
  modelNameContainer.style.display = "flex";
  modelNameContainer.style.alignItems = "center";
  modelNameContainer.style.cursor = "pointer";

  const modelName = document.createElement("span");
  modelName.textContent = models;
  modelName.classList.add("model-name");

  // Create the toggle icon
  const toggleIcon = document.createElement("i");
  toggleIcon.classList.add("fa-solid", "fa-chevron-down"); // Default icon
  toggleIcon.style.marginLeft = "10px";

  // Create a dropdown div for detailed info, initially hidden
  const detailsContainer = document.createElement("div");
  detailsContainer.classList.add("details-container");
  detailsContainer.style.display = "none"; // Hidden by default
  detailsContainer.style.paddingLeft = "20px"; // Indent for better visibility
  // Add buttons below the details
  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("buttons-container");
  buttonsContainer.style.marginTop = "10px";

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.onclick = () => {
    row.remove(); // Remove the row from the list
    console.log(`Deleted model: ${model}`);
  };

  const manageButton = document.createElement("button");
  manageButton.textContent = "Manage";
  manageButton.onclick = () => alert(`Managing model: ${model}`);

  // Append buttons to the container
  buttonsContainer.appendChild(deleteButton);
  buttonsContainer.appendChild(manageButton);
  // Add detailed information about the model
  const details = `
  <table class="model-details-table">
      <tr>
          <td class="details-label">Model:</td>
          <td class="details-value">${model}</td>
      </tr>
      <tr>
          <td class="details-label">Size (Decimal):</td>
          <td class="details-value">${sizeInGB}</td>
      </tr>
      <tr>
          <td class="details-label">Parameter Size:</td>
          <td class="details-value">${parameter_size}</td>
      </tr>
      <tr>
          <td class="details-label">Family:</td>
          <td class="details-value">${family}</td>
      </tr>
      <tr>
          <td class="details-label">Format:</td>
          <td class="details-value">${format}</td>
      </tr>
      <tr>
          <td class="details-label">Quantization Level:</td>
          <td class="details-value">${quantization_level}</td>
      </tr>
  </table>
`;
  detailsContainer.innerHTML = details;


  // Add event listener to toggle details visibility
  modelNameContainer.onclick = () => {
    const isVisible = detailsContainer.style.display === "block";
    detailsContainer.style.display = isVisible ? "none" : "block"; // Toggle visibility
    toggleIcon.className = isVisible
      ? "fa-solid fa-chevron-down"
      : "fa-solid fa-angle-up"; // Change icon dynamically
  };

  // Append model name and toggle icon to the container
  modelNameContainer.appendChild(modelName);
  modelNameContainer.appendChild(toggleIcon);

  // Append model name container and details container to the row
  row.appendChild(modelNameContainer);
  row.appendChild(detailsContainer);
  detailsContainer.appendChild(buttonsContainer);
  // Add row to the list container
  listContainer.appendChild(row);

  // Append the list container to the modal
  modal_container.appendChild(listContainer);
}

// Placeholder functions for button actions
function viewInfo(model) {
  alert(`Viewing info about ${model}`);
}

function deleteModel(model) {
  console.log(`Deleted ${model}`);
}

function manageModel(model) {
  alert(`Managing ${model}`);
}
