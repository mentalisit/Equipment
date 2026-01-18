const API_URL = "https://script.google.com/macros/s/AKfycbyyKO9XcvHamL2CJOBwU3pe97fiRpbmLUokZkmcJ8QVUPsNntFvezRjgInlNebxQ1GUsA/exec"; // поменяй

function toggleForm() {
  const form = document.getElementById("form");
  const btn = document.querySelector(".add-btn");
  const visible = form.style.display === "block";

  form.style.display = visible ? "none" : "block";
  btn.textContent = visible ? "Add" : "Cancel";
}

function loadRCO() {
  const loader = document.getElementById("loader");
  const list = document.getElementById("rcoList");

  loader.style.display = "block";
  list.style.display = "none";

  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      renderRCO(data);
    })
    .catch(() => {
      loader.textContent = "Failed to load data";
    })
    .finally(() => {
      loader.style.display = "none";
      list.style.display = "flex";
    });
}

/* Mini RCO modal */
const miniModal = document.getElementById("miniModal");
const miniBtn = document.getElementById("miniListBtn");
const miniClose = document.getElementById("miniModalClose");

function openMiniModal() {
  if (!miniModal) return;
  miniModal.classList.add("open");
  miniModal.style.display = "flex";
  miniModal.setAttribute("aria-hidden", "false");
}

function closeMiniModal() {
  if (!miniModal) return;
  miniModal.classList.remove("open");
  miniModal.style.display = "none";
  miniModal.setAttribute("aria-hidden", "true");
}

miniBtn?.addEventListener("click", openMiniModal);
miniClose?.addEventListener("click", closeMiniModal);
miniModal?.addEventListener("click", e => {
  if (e.target === miniModal) closeMiniModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && miniModal?.classList.contains("open")) {
    closeMiniModal();
  }
});

function renderRCO(list) {
  const container = document.getElementById("rcoList");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = "<div style='color:#6b7280;text-align:center'>No RCO</div>";
    return;
  }

  list.forEach(rco => {
    const item = document.createElement("div");
    item.className = "rco-item";

    item.onclick = () => {
      const [lat, lng] = rco.coords.split(",").map(v => v.trim());
      const url = `https://www.google.com/maps?q=${lat},${lng} (${encodeURIComponent(rco.name)})`;
      window.open(url, "_blank");
    };

    item.innerHTML = `
      <div>
        <div class="rco-name">${rco.name}</div>
        <div class="rco-type">${rco.type}</div>
      </div>
      📍
    `;

    container.appendChild(item);
  });
}

let selectedType = null;

function selectType(type) {
  selectedType = type;

  document.querySelectorAll(".toggle-option")
    .forEach(el => el.classList.remove("active"));

  if (type === "RCO") {
    document.querySelector(".toggle-option:nth-child(1)").classList.add("active");
    document.getElementById("typeRCO").checked = true;
  } else {
    document.querySelector(".toggle-option:nth-child(2)").classList.add("active");
    document.getElementById("typeMini").checked = true;
  }
}


function saveRCO() {
  const name = document.getElementById("name").value.trim();
  const coords = document.getElementById("coords").value.trim();

  if (!selectedType) {
    return alert("Please select RCO type");
  }

  if (!name || !coords) {
    return alert("Fill all fields");
  }

  if (!/^[-\d.]+,\s*[-\d.]+$/.test(coords)) {
    return alert("Coordinates must be in format: lat,lng");
  }

  const type = selectedType;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ name, coords, type })
  })
    .then(async res => {
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      // успех
      document.getElementById("form").style.display = "none";
      document.querySelector(".add-btn").textContent = "Add";

      document.getElementById("name").value = "";
      document.getElementById("coords").value = "";
      selectedType = null;

      document
        .querySelectorAll(".toggle-option")
        .forEach(el => el.classList.remove("active"));

      loadRCO();
    })
    .catch(err => {
      alert(err.message || "Network error");
    });
}


loadRCO();

function copyPassword() {
  const pw = document.getElementById("pwText").innerText;
  navigator.clipboard.writeText(pw).then(() => {
    // Simple visual feedback
    const icon = document.querySelector(".copy-icon");
    const original = icon.innerText;
    icon.innerText = "✅";
    setTimeout(() => icon.innerText = original, 1500);
  });
}
