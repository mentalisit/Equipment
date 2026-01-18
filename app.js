const API_URL = "https://script.google.com/macros/s/AKfycby3Cub0ypbHD_r773MmuK1SPm0cDekR7vKIr2i5ex3kro_r9iKMfRvyP6bdjHDIK_4gPg/exec";
const TOP_MATERIALS_API_URL = "https://script.google.com/macros/s/AKfycby3Cub0ypbHD_r773MmuK1SPm0cDekR7vKIr2i5ex3kro_r9iKMfRvyP6bdjHDIK_4gPg/exec"; // URL для топ материалов
const result = {};
const idToNameMap = {};

let currentId = null;
let currentItemEl = null;
let currentCategory = null;
let topMaterials = []; // Массив для хранения топ материалов

/* Load equipment.json */
fetch("equipment.json")
  .then(r => r.json())
  .then(buildUI)
  .catch(() => alert("Failed to load equipment.json"));

/* Load top materials */
fetch(TOP_MATERIALS_API_URL)
  .then(r => r.json())
  .then(data => {
    topMaterials = data;
    addTopMaterialsSection();
  })
  .catch(() => console.log("Failed to load top materials"));

// --- Persistent Sender Name & Layout Logic ---
function updateControlsLayout() {
  const container = document.getElementById('name-or-history');
  if (!container) return;

  const savedName = localStorage.getItem('senderName');

  if (savedName) {
    // Show History Button
    container.innerHTML = `
            <button class="history-btn" onclick="openHistoryModal()">
                <span>📜 History</span>
            </button>
        `;
  } else {
    // Show Name Input
    container.innerHTML = `
            <div class="form-group main-name-group" style="margin-bottom: 0;">
                <input type="text" id="mainSenderName" placeholder="Enter Your Name" autocomplete="off">
            </div>
        `;

    const input = document.getElementById('mainSenderName');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        localStorage.setItem('senderName', input.value.trim());
        updateControlsLayout();
      }
    });

    // Also save on blur if not empty
    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        localStorage.setItem('senderName', input.value.trim());
        updateControlsLayout();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateControlsLayout();
});

function addToHistory(record) {
  let history = JSON.parse(localStorage.getItem('submitHistory') || '[]');
  history.unshift({
    date: new Date().toLocaleString(),
    content: record
  });
  // Keep last 20 records
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem('submitHistory', JSON.stringify(history));
}

function openHistoryModal() {
  const historyList = document.getElementById('historyList');
  const history = JSON.parse(localStorage.getItem('submitHistory') || '[]');

  if (history.length === 0) {
    historyList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No history records found.</p>';
  } else {
    historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${item.date}</div>
                <div class="history-content">${item.content}</div>
            </div>
        `).join('');
  }

  document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

function overlayCloseHistory(e) {
  if (e.target.id === "historyModal") closeHistoryModal();
}

function toggleEditName() {
  const container = document.getElementById('editNameContainer');
  const input = document.getElementById('editSenderName');
  const isHidden = container.style.display === 'none';

  if (isHidden) {
    container.style.display = 'block';
    input.value = localStorage.getItem('senderName') || '';
    input.focus();

    // Keydown for enter
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        saveEditedName(input.value);
      }
    };

    // Blur to save/cancel
    input.onblur = () => {
      setTimeout(() => { // Small delay to allow clicking save if we add one
        if (container.style.display === 'block') {
          saveEditedName(input.value);
        }
      }, 200);
    };
  } else {
    container.style.display = 'none';
  }
}

function saveEditedName(newName) {
  const trimmed = newName.trim();
  if (trimmed) {
    localStorage.setItem('senderName', trimmed);
    updateControlsLayout();
  }
  document.getElementById('editNameContainer').style.display = 'none';
}
// ------------------------------------

function buildUI(data) {
  const app = document.getElementById("app");

  for (const category in data) {
    const cat = document.createElement("div");
    cat.className = "category";
    cat.dataset.category = category;

    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span>${category}</span>
      <div class="header-right">
        <span class="cat-badge"></span>
        <span>▾</span>
      </div>
    `;

    const items = document.createElement("div");
    items.className = "items";

    header.onclick = () => {
      // Close all other categories first
      closeAllCategoriesExcept(category);

      // Then toggle current category
      items.style.display = items.style.display === "block" ? "none" : "block";
    };

    // Check if category has nested categories (object) or direct items (array)
    if (Array.isArray(data[category])) {
      // Direct items array
      data[category].forEach(item => {
        addItemToCategory(items, item, category);
      });
    } else {
      // Nested categories object
      for (const subCategory in data[category]) {
        // Create subcategory header
        const subHeader = document.createElement("div");
        subHeader.className = "subcategory-header";
        subHeader.innerHTML = `
          <span>${subCategory}</span>
          <span>▸</span>
        `;

        const subItems = document.createElement("div");
        subItems.className = "subcategory-items";
        subItems.style.display = "none";

        subHeader.onclick = (e) => {
          e.stopPropagation();
          subItems.style.display = subItems.style.display === "block" ? "none" : "block";
          const arrow = subHeader.querySelector("span:last-child");
          arrow.textContent = subItems.style.display === "block" ? "▾" : "▸";
        };

        // Add items to subcategory
        data[category][subCategory].forEach(item => {
          addItemToCategory(subItems, item, category);
        });

        items.appendChild(subHeader);
        items.appendChild(subItems);
      }
    }

    cat.appendChild(header);
    cat.appendChild(items);
    app.appendChild(cat);
  }
}

function addItemToCategory(container, item, category) {
  idToNameMap[item.id] = item.name;
  const el = document.createElement("div");
  el.className = "item";

  const name = document.createElement("span");
  name.textContent = item.name;

  const badge = document.createElement("span");
  badge.className = "qty-badge";

  el.appendChild(name);
  el.appendChild(badge);

  el.onclick = () => {
    currentItemEl = el;
    currentCategory = category;
    openModal(item, badge);
  };

  container.appendChild(el);
}

function closeAllCategoriesExcept(exceptCategory) {
  document.querySelectorAll(".category").forEach(cat => {
    if (cat.dataset.category !== exceptCategory) {
      const items = cat.querySelector(".items");
      if (items) {
        items.style.display = "none";
      }
    }
  });
}

function addTopMaterialsSection() {
  if (topMaterials.length === 0) return;

  const app = document.getElementById("app");

  // Create top materials section
  const topSection = document.createElement("div");
  topSection.className = "category top-materials";
  topSection.dataset.category = "top-materials";

  const header = document.createElement("div");
  header.className = "category-header";
  header.innerHTML = `
    <span>🔥 Top Materials</span>
    <div class="header-right">
      <span class="cat-badge"></span>
      <span>▾</span>
    </div>
  `;

  const items = document.createElement("div");
  items.className = "items";

  header.onclick = () => {
    // Close all other categories first
    closeAllCategoriesExcept("top-materials");

    // Then toggle current category
    items.style.display = items.style.display === "block" ? "none" : "block";
  };

  // Add top materials items
  topMaterials.forEach(item => {
    const el = document.createElement("div");
    el.className = "item top-item";

    const name = document.createElement("span");
    name.textContent = item.name;

    const badge = document.createElement("span");
    badge.className = "qty-badge";

    idToNameMap[item.id] = item.name;

    el.appendChild(name);
    el.appendChild(badge);

    el.onclick = () => {
      currentItemEl = el;
      currentCategory = "top-materials";
      openModal(item, badge);
    };

    items.appendChild(el);
  });

  topSection.appendChild(header);
  topSection.appendChild(items);

  // Insert at the beginning of the app container
  app.insertBefore(topSection, app.firstChild);
}

/* Modal logic */

function openModal(item, badge) {
  currentId = item.id;
  currentItemEl.badge = badge;

  document.getElementById("modalTitle").innerText = item.name;
  document.getElementById("qty").value = result[item.id] || 0;
  document.getElementById("modal").style.display = "flex";
  disableSubmit();
}

function overlayClose(e) {
  if (e.target.id === "modal") closeModal();
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  enableSubmitIfNeeded();
}

/* Quantity controls */

function changeQty(delta) {
  let v = Number(document.getElementById("qty").value || 0);
  v = Math.max(0, v + delta);
  updateQty(v);
}

document.querySelectorAll(".preset").forEach(preset => {
  preset.addEventListener("click", () => {
    updateQty(Number(preset.innerText));
  });
});

document.getElementById("qty").addEventListener("input", e => {
  updateQty(Number(e.target.value));
});

function updateQty(value) {
  if (!currentId) return;

  // защита от NaN
  if (isNaN(value)) value = 0;

  // лимиты
  value = Math.max(0, Math.min(99999, value));

  if (value > 0) {
    result[currentId] = value;
    currentItemEl.classList.add("selected");
    currentItemEl.badge.style.display = "inline-block";
    currentItemEl.badge.innerText = value;
  } else {
    delete result[currentId];
    currentItemEl.classList.remove("selected");
    currentItemEl.badge.style.display = "none";
  }

  document.getElementById("qty").value = value;
  updateCategoryBadge(currentCategory);
  updateSubmitButton();
}


/* Category badge */

function updateCategoryBadge(category) {
  const catEl = document.querySelector(`.category[data-category="${category}"]`);
  const badge = catEl.querySelector(".cat-badge");

  let sum = 0;
  catEl.querySelectorAll(".qty-badge").forEach(b => {
    if (b.style.display !== "none") sum += Number(b.innerText);
  });

  if (sum > 0) {
    badge.style.display = "inline-block";
    badge.innerText = sum;
  } else {
    badge.style.display = "none";
  }
}

/* Submit button visibility */

function updateSubmitButton() {
  const btn = document.getElementById("submitBtn");
  btn.style.display = Object.keys(result).length > 0 ? "block" : "none";
}

function submitAll() {
  if (Object.keys(result).length === 0) return;

  const senderName = document.getElementById('mainSenderName')?.value.trim() || localStorage.getItem('senderName');

  if (!senderName) {
    showToast("Please enter your name first!");
    const input = document.getElementById('mainSenderName');
    if (input) {
      input.focus();
      input.style.borderColor = "#ef4444"; // Red border to highlight
      setTimeout(() => input.style.borderColor = "", 2000);
    }
    return;
  }

  setSubmitLoading(true);

  // Prepare request data with kit expansion
  let requestData = {
    senderName: senderName,
    timestamp: new Date().toISOString()
  };

  // Expand any kits in the result
  for (const [itemId, quantity] of Object.entries(result)) {
    // Check if this is a kit ID
    if (itemId.startsWith("KIT-")) {
      const kitComponents = expandKitForSubmit(itemId);
      if (kitComponents) {
        // Add each component with the kit's quantity
        kitComponents.forEach(componentId => {
          requestData[componentId] = (requestData[componentId] || 0) + quantity;
        });
        console.log("Expanded kit:", itemId, "to components:", kitComponents, "quantity:", quantity);
      } else {
        // Fallback: add the kit itself if expansion fails
        requestData[itemId] = quantity;
      }
    } else {
      // Regular item, add as-is
      requestData[itemId] = quantity;
    }
  }

  console.log("Final request data:", requestData);

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(requestData)
  })
    .then(r => {
      if (!r.ok) throw new Error("Network error");
      return r.json();
    })
    .then(() => {
      showToast("Equipment submitted");

      // Save to history
      const itemsList = Object.entries(result)
        .map(([id, qty]) => `${qty} ${idToNameMap[id] || id}`)
        .join(', ');
      addToHistory(itemsList);

      clearForm();
    })
    .catch(() => {
      showToast("Failed to send data");
    })
    .finally(() => {
      setSubmitLoading(false);
    });
}

function expandKitForSubmit(kitId) {
  // Kit definitions with their component IDs
  const kits = {
    "KIT-6+": ["3001204", "3001000", "3000150"],
    "KIT-Pro": ["3001205", "3001008", "3000163", "3000162", "2000002", "2000002", "2000903", "2000903"]
  };

  return kits[kitId] || null;
}

/* Equipment/Materials requests */

function submitEquipmentRequests() {
  // Open the requests modal without checking selected items
  openRequestsModal();
}

function openRequestsModal() {
  document.getElementById("materialInput").value = "";
  document.getElementById("materialSelect").value = "";

  // Hide custom material input initially
  document.getElementById("customMaterialGroup").style.display = "none";

  // Populate material select with all equipment from JSON
  populateAllEquipmentSelect();

  // Add event listeners for auto-clear functionality
  setupAutoClearListeners();

  // Show modal
  document.getElementById("requestsModal").style.display = "flex";
}

function setupAutoClearListeners() {
  const materialSelect = document.getElementById("materialSelect");
  const materialInput = document.getElementById("materialInput");
  const customMaterialGroup = document.getElementById("customMaterialGroup");

  // Handle select change
  materialSelect.onchange = () => {
    if (materialSelect.value === "custom") {
      // Show custom input field
      customMaterialGroup.style.display = "block";
      materialInput.value = "";
      // Focus on input field
      setTimeout(() => materialInput.focus(), 100);
    } else {
      // Hide custom input field and clear it
      customMaterialGroup.style.display = "none";
      materialInput.value = "";
    }
  };

  // Clear select when user starts typing in input
  materialInput.oninput = () => {
    if (materialInput.value.trim()) {
      materialSelect.value = "custom";
    }
  };
}

function closeRequestsModal() {
  document.getElementById("requestsModal").style.display = "none";
}

function overlayCloseRequests(e) {
  if (e.target.id === "requestsModal") closeRequestsModal();
}

function populateAllEquipmentSelect() {
  const select = document.getElementById("materialSelect");

  // Clear existing options except the first two (placeholder and custom option)
  while (select.children.length > 2) {
    select.removeChild(select.lastChild);
  }

  // Fetch equipment data and populate select
  fetch("equipment.json")
    .then(r => r.json())
    .then(data => {
      // Add all items from all categories
      for (const category in data) {
        // Check if category has nested categories (object) or direct items (array)
        if (Array.isArray(data[category])) {
          // Direct items array - create single optgroup
          const optgroup = document.createElement("optgroup");
          optgroup.label = category;

          data[category].forEach(item => {
            const option = document.createElement("option");
            option.value = `${item.id} - ${item.name}`;
            option.textContent = `${item.id} - ${item.name}`;
            optgroup.appendChild(option);
          });

          select.appendChild(optgroup);
        } else {
          // Nested categories object - create separate optgroups for each subcategory
          for (const subCategory in data[category]) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = `${category} → ${subCategory}`;

            data[category][subCategory].forEach(item => {
              const option = document.createElement("option");
              option.value = `${item.id} - ${item.name}`;
              option.textContent = `${item.id} - ${item.name}`;
              optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
          }
        }
      }
    })
    .catch(() => {
      console.error("Failed to load equipment list");
    });
}

function sendRequestWithDetails() {
  const name = document.getElementById("mainSenderName")?.value.trim() || localStorage.getItem('senderName') || "";
  const materialSelect = document.getElementById("materialSelect").value;
  const materialInput = document.getElementById("materialInput").value.trim();

  // Validation
  if (!name) {
    showToast("Please enter your name on the main page!");
    const input = document.getElementById('mainSenderName');
    if (input) {
      input.focus();
      input.style.borderColor = "#ef4444";
      setTimeout(() => input.style.borderColor = "", 2000);
    }
    closeRequestsModal(); // Close modal so user can see the name field
    return;
  }

  // Check if material is selected or custom input is filled
  if (!materialSelect && !materialInput) {
    showToast("Please select a material or enter custom material");
    return;
  }

  // Determine which material to use
  let selectedMaterial;
  if (materialSelect === "custom") {
    if (!materialInput.trim()) {
      showToast("Please enter custom material");
      return;
    }
    selectedMaterial = materialInput.trim();
  } else if (materialSelect) {
    selectedMaterial = materialSelect;
  } else {
    showToast("Please select a material");
    return;
  }

  // Debug: show the selected material
  console.log("Selected material:", selectedMaterial);
  console.log("Material select value:", materialSelect);
  console.log("Material input value:", materialInput);

  const sendBtn = document.getElementById("sendRequestsBtn");
  const originalText = sendBtn.innerText;

  // Disable button and show loading state
  sendBtn.disabled = true;
  sendBtn.innerText = "Sending…";

  // Prepare request data - NO kit expansion for requests modal
  const requestData = {
    senderName: name,
    material: selectedMaterial,
    timestamp: new Date().toISOString(),
    type: "equipment_request"
  };

  // Debug: show what we're sending
  console.log("Sending request material:", selectedMaterial);

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(requestData)
  })
    .then(r => {
      if (!r.ok) throw new Error("Network error");
      return r.json();
    })
    .then(() => {
      showToast("Equipment/Materials request sent");
      addToHistory(`Request: ${selectedMaterial}`);
      closeRequestsModal();
    })
    .catch(() => {
      showToast("Failed to send request");
    })
    .finally(() => {
      // Restore button state
      sendBtn.disabled = false;
      sendBtn.innerText = originalText;
    });
}

function expandKitIfSelected(selectedMaterial) {
  // Debug: show what we received
  console.log("expandKitIfSelected received:", selectedMaterial);

  // Kit definitions with their component IDs
  const kits = {
    "KIT-6+": ["3001204", "3001000", "3000150"],
    "KIT-Pro": ["3001205", "3001008", "3000163", "3000162", "2000002", "2000002", "2000903", "2000903"]
  };

  // Extract kit ID from selected material - try multiple patterns
  let kitId = null;

  // Pattern 1: Extract from "KIT-6+ - Kit: Eero 6+, MC, Transceiver (blue)"
  const kitIdMatch1 = selectedMaterial.match(/^(\w+-\w+)/);
  if (kitIdMatch1) {
    kitId = kitIdMatch1[1];
    console.log("Pattern 1 matched, kitId:", kitId);
  }

  // Pattern 2: Extract from "KIT-6+" directly
  const kitIdMatch2 = selectedMaterial.match(/^(KIT-\w+)/);
  if (kitIdMatch2 && !kitId) {
    kitId = kitIdMatch2[1];
    console.log("Pattern 2 matched, kitId:", kitId);
  }

  if (kitId && kits[kitId]) {
    console.log("Found kit components:", kits[kitId]);
    return kits[kitId];
  }

  console.log("No kit found, returning null");
  return null;
}



function clearForm() {
  // очистить данные
  for (const key in result) {
    delete result[key];
  }

  // очистить items
  document.querySelectorAll(".item").forEach(item => {
    item.classList.remove("selected");
  });

  document.querySelectorAll(".qty-badge").forEach(badge => {
    badge.style.display = "none";
    badge.innerText = "";
  });

  // очистить категории
  document.querySelectorAll(".cat-badge").forEach(badge => {
    badge.style.display = "none";
    badge.innerText = "";
  });

  // очистить поле ввода
  const qtyInput = document.getElementById("qty");
  if (qtyInput) qtyInput.value = 0;

  // 🔽 НОВОЕ: свернуть все категории
  collapseAllCategories();

  // скрыть кнопку Submit
  updateSubmitButton();
}


function collapseAllCategories() {
  document.querySelectorAll(".category .items").forEach(items => {
    items.style.display = "none";
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function disableSubmit() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.style.opacity = "0.5";
}

function enableSubmitIfNeeded() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = false;
  btn.style.opacity = "1";
  updateSubmitButton(); // проверка: есть ли данные
}

function setSubmitLoading(isLoading) {
  const btn = document.getElementById("submitBtn");
  const text = btn.querySelector(".btn-text");

  if (isLoading) {
    btn.classList.add("loading");
    btn.disabled = true;
    text.innerText = "Sending…";
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
    text.innerText = "Submit";
  }
}

