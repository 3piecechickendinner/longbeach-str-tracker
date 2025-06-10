import { allTracts, tractStatus } from './data.js';

// --- DOM Elements ---
const tractGrid = document.getElementById('tractGrid');
const searchBox = document.getElementById('searchBox');
const statusForm = document.getElementById('statusForm');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const knownActivityBody = document.getElementById('known-activity-body');

/**
 * Creates the main grid of all census tracts and block groups.
 */
function createTractGrid() {
  tractGrid.innerHTML = '';
  allTracts.forEach(tract => {
    const box = document.createElement('div');
    box.className = 'tract-box';
    box.textContent = tract;
    box.dataset.tract = tract;

    // This simplified logic does a direct lookup, which is fast and accurate.
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
    const sortedKeys = Object.keys(tractStatus).sort((a, b) => {
        return tractStatus[a].status.localeCompare(tractStatus[b].status);
    });

    for (const key of sortedKeys) {
        const row = document.createElement('tr');
        const statusInfo = tractStatus[key];
        row.innerHTML = `
            <td>${key}</td>
            <td style="font-weight: bold;" class="${statusInfo.status}">${statusInfo.status.toUpperCase()}</td>
            <td>${statusInfo.details}</td>
        `;
        knownActivityBody.appendChild(row);
    }
}

/**
 * Displays the modal with details for a specific tract.
 */
function showTractDetails(tract) {
  const modal = document.getElementById('infoModal');
  const title = document.getElementById('modalTitle');
  const content = document.getElementById('modalContent');
  const tractInput = document.getElementById('tractNumberInput');
  
  title.textContent = `Census Tract / Block Group ${tract}`;
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
      <p>No petition has been conducted for this tract according to official city data.</p>
    `;
  }
  
  modal.style.display = 'block';
  modalOverlay.style.display = 'block';
}

/**
 * Closes the details modal.
 */
function closeModal() {
  document.getElementById('infoModal').style.display = 'none';
  document.getElementById('modalOverlay').style.display = 'none';
  statusForm.reset();
}

/**
 * Handles the search functionality.
 */
function handleSearch(e) {
  const searchValue = e.target.value.toLowerCase();
  const boxes = document.querySelectorAll('.tract-box');
  
  boxes.forEach(box => {
    box.classList.remove('highlight');
    if (searchValue && box.textContent.toLowerCase().includes(searchValue)) {
      box.classList.add('highlight');
    }
  });

  if(searchValue) {
    const firstHighlight = document.querySelector('.tract-box.highlight');
    if (firstHighlight) {
        firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * Handles the submission of the status update form.
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const tractNumber = document.getElementById('tractNumberInput').value;
    const status = document.getElementById('statusSelect').value;
    const details = document.getElementById('details').value;
    const email = document.getElementById('email').value;

    const updateData = {
        tract: tractNumber,
        status: status,
        details: details,
        submittedAt: new Date().toISOString(),
        email: email,
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
            throw new Error(`Server error: ${response.statusText}`);
        }

        alert(`Thank you! Your update for tract ${tractNumber} has been successfully submitted for review.`);
    
    } catch (error) {
        console.error("Failed to submit update:", error);
        alert("Submission failed. Please try again later.");
    
    } finally {
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
    // Update total count on the stat card
    const totalCount = allTracts.length;
    document.querySelector('.stat-card .stat-number').textContent = totalCount;
    document.querySelector('.stat-card .stat-label').textContent = `Total Tracts & Block Groups`;


    console.log("Long Beach STR Tracker initialized with official city data.");
}

// Run the app
initialize();