import { allTracts, tractStatus } from './data.js';

// --- DOM Elements ---
const tractGrid = document.getElementById('tractGrid');
const searchBox = document.getElementById('searchBox');
const statusForm = document.getElementById('statusForm');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const knownActivityBody = document.getElementById('known-activity-body');

// --- State ---
let activeTract = null;

// --- Functions ---

/**
 * Creates the main grid of all census tracts.
 */
function createTractGrid() {
  tractGrid.innerHTML = '';
  allTracts.forEach(tract => {
    const box = document.createElement('div');
    box.className = 'tract-box';
    box.textContent = tract;
    box.dataset.tract = tract; // Use data attribute for easier selection

    const statusInfo = tractStatus[tract];
    const statusClass = statusInfo ? statusInfo.status : 'no-data';
    box.classList.add(statusClass);
    
    box.addEventListener('click', () => showTractDetails(tract));
    tractGrid.appendChild(box);
  });
}

/**
 * Populates the table with tracts that have a known status.
 */
function populateKnownActivityTable() {
    knownActivityBody.innerHTML = '';
    for (const tract in tractStatus) {
        const row = document.createElement('tr');
        const statusInfo = tractStatus[tract];
        row.innerHTML = `
            <td>${tract}</td>
            <td style="font-weight: bold;" class="${statusInfo.status}">${statusInfo.status.toUpperCase()}</td>
            <td>${statusInfo.details}</td>
        `;
        knownActivityBody.appendChild(row);
    }
}

/**
 * Displays the modal with details for a specific tract.
 * @param {string} tract - The census tract number.
 */
function showTractDetails(tract) {
  activeTract = tract;
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('modalTitle');
  const content = document.getElementById('modalContent');
  const tractInput = document.getElementById('tractNumberInput');
  
  title.textContent = `Census Tract ${tract}`;
  tractInput.value = tract;
  
  const statusInfo = tractStatus[tract];
  
  if (statusInfo) {
    content.innerHTML = `
      <p><strong>Status:</strong> <span class="${statusInfo.status}" style="font-weight:bold; text-transform: uppercase;">${statusInfo.status}</span></p>
      <p><strong>Details:</strong> ${statusInfo.details}</p>
    `;
  } else {
    content.innerHTML = `
      <p><strong>Status:</strong> No Known Activity</p>
      <p>No current STR petition information is publicly available for this tract.</p>
    `;
  }
  
  modal.style.display = 'block';
  modalOverlay.style.display = 'block';
}

/**
 * Closes the details modal.
 */
function closeModal() {
  const modal = document.getElementById('infoModal');
  modal.style.display = 'none';
  modalOverlay.style.display = 'none';
  statusForm.reset(); // Reset form fields
}

/**
 * Handles the search functionality.
 * @param {Event} e - The input event.
 */
function handleSearch(e) {
  const searchValue = e.target.value.toLowerCase();
  const boxes = document.querySelectorAll('.tract-box');
  
  boxes.forEach(box => {
    // Clear previous highlights
    box.classList.remove('highlight');

    if (searchValue && box.textContent.toLowerCase().includes(searchValue)) {
      box.classList.add('highlight');
    }
  });

  // If there's a search value, scroll the first highlighted box into view
  if(searchValue) {
    const firstHighlight = document.querySelector('.tract-box.highlight');
    if (firstHighlight) {
        firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * Handles the submission of the status update form.
 * @param {Event} e - The form submission event.
 */
async function handleFormSubmit(e) {
  e.preventDefault(); // Prevent page reload
  const submitBtn = e.target.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const tractNumber = document.getElementById('tractNumberInput').value;
  const status = document.getElementById('statusSelect').value;
  const details = document.getElementById('details').value;

  const updateData = {
      tract: tractNumber,
      status: status,
      details: details,
      submittedAt: new Date().toISOString()
  };

  try {
      const response = await fetch('https://str-tracker-api.onrender.com', { 
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
      });

      if (!response.ok) {
          // If server responds with an error, throw it to the catch block
          throw new Error(`Server error: ${response.statusText}`);
      }

      alert(`Thank you! Your update for tract ${tractNumber} has been successfully submitted for review.`);
  
  } catch (error) {
      console.error("Failed to submit update:", error);
      alert("Submission failed. Please try again later.");
  
  } finally {
      // Whether it succeeds or fails, re-enable the button and close the modal
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Update';
      closeModal();
  }
}
// --- Event Listeners ---
searchBox.addEventListener('input', handleSearch);
statusForm.addEventListener('submit', handleFormSubmit);
modalOverlay.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);

// --- Initial App Load ---
function initialize() {
    createTractGrid();
    populateKnownActivityTable();
    console.log("Long Beach STR Tracker initialized.");
}

// Run the app
initialize();