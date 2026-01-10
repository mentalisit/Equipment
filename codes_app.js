const UI_TEXT = {
  selectLetter: "-- Select letter --",
  selectBrand: "-- Select brand --",
  codes: "Codes",
  codesFor: "Codes for",
  loading: "Loading...",
  error: "Error loading codes.json",
  noData: "No data available",
  noCodes: "No codes found",
  source: "Source: Buckeye's Kaon Document"
};

let currentSection = "tv";
let currentLetter = "";
let currentBrand = "";
let codesData = null;
let triedCodes = new Set();

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  setStaticText();
  setupUI();
  setupModals();
  loadCodes();
});

function setStaticText() {
  document.getElementById("title").textContent = "Buckeye Kaon Remote Codes";
  document.getElementById("subtitle").textContent = "Select section, letter and brand";
  document.getElementById("tvToggle").textContent = "TV";
  document.getElementById("audioToggle").textContent = "Audio";
  document.getElementById("codesTitle").textContent = UI_TEXT.codes;
  const source = document.getElementById("source");
  if (source) source.textContent = UI_TEXT.source;
}

/* UI */
function setupUI() {
  document.getElementById("tvToggle").onclick = () => switchSection("tv");
  document.getElementById("audioToggle").onclick = () => switchSection("audio");

  document.getElementById("letterSelect").onchange = e => {
    currentLetter = e.target.value;
    populateBrands();
  };

  document.getElementById("brandSelect").onchange = e => {
    currentBrand = e.target.value;
    showCodes();
  };
}

/* DATA */
function loadCodes() {
  show("loading");
  fetch("codes.json")
    .then(r => r.json())
    .then(data => {
      codesData = data;
      hideAll();
      renderAll();
    })
    .catch(() => show("error"));
}

function setupModals() {
  document.querySelectorAll(".info-btn").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal));
  });

  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.modal));
  });

  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.open").forEach(m => closeModal(m.id));
    }
  });
}

/* RENDER */
function renderAll() {
  populateLetters();
  populateBrands();
  showCodes();
}

function switchSection(sec) {
	document.getElementById("allTriedHint").style.display = "none";

  currentSection = sec;
  currentLetter = "";
  currentBrand = "";

  document.getElementById("tvToggle").classList.toggle("active", sec === "tv");
  document.getElementById("audioToggle").classList.toggle("active", sec === "audio");

  renderAll();
}

function populateLetters() {
  const select = document.getElementById("letterSelect");
  select.innerHTML = `<option value="">${UI_TEXT.selectLetter}</option>`;

  if (!codesData) return;

  const letters = new Set(
    Object.keys(codesData[currentSection]).map(b => b[0].toUpperCase())
  );

  [...letters].sort().forEach(l => {
    const o = document.createElement("option");
    o.value = l;
    o.textContent = l;
    if (l === currentLetter) o.selected = true;
    select.appendChild(o);
  });
}

function populateBrands() {
  const select = document.getElementById("brandSelect");
  select.innerHTML = `<option value="">${UI_TEXT.selectBrand}</option>`;

  if (!currentLetter || !codesData) return;

  Object.keys(codesData[currentSection])
    .filter(b => b.startsWith(currentLetter))
    .sort()
    .forEach(b => {
      const o = document.createElement("option");
      o.value = b;
      o.textContent = b;
      if (b === currentBrand) o.selected = true;
      select.appendChild(o);
    });
}

function showCodes() {
	document.getElementById("allTriedHint").style.display = "none";

  const list = document.getElementById("codesList");
  list.innerHTML = "";

  if (!currentBrand || !codesData) return;

  document.getElementById("codesTitle").textContent =
    `${UI_TEXT.codesFor} ${currentBrand}`;

  const codes = codesData[currentSection][currentBrand] || [];
  if (!codes.length) {
    list.innerHTML = `<div class="code-item">${UI_TEXT.noCodes}</div>`;
    return;
  }

  codes.forEach(code => {
    const div = document.createElement("div");
    div.className = "code-item";
    div.textContent = code;

    const key = `${currentSection}_${currentBrand}_${code}`;
    if (triedCodes.has(key)) div.classList.add("tried");

    div.onclick = () => {
  div.classList.toggle("tried");

  const key = `${currentSection}_${currentBrand}_${code}`;
  if (div.classList.contains("tried")) {
    triedCodes.add(key);
  } else {
    triedCodes.delete(key);
  }

  const hint = document.getElementById("allTriedHint");
  if (checkAllCodesTried(codes)) {
    hint.style.display = "block";
    const modal = document.getElementById("code-search-modal");
    if (modal && !modal.classList.contains("open")) {
      openModal("code-search-modal");
    }
  } else {
    hint.style.display = "none";
  }
};

    list.appendChild(div);
  });
}

/* HELPERS */
function show(id) {
  hideAll();
  const el = document.getElementById(id);
  if (!el) return;
  if (id === "loading") el.textContent = UI_TEXT.loading;
  if (id === "error") el.textContent = UI_TEXT.error;
  if (id === "noData") el.textContent = UI_TEXT.noData;
  el.style.display = "block";
}

function hideAll() {
  ["loading", "error", "noData"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function checkAllCodesTried(codes) {
  if (!codes || !codes.length) return false;

  return codes.every(code => {
    const key = `${currentSection}_${currentBrand}_${code}`;
    return triedCodes.has(key);
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".modal.open")) {
    document.body.classList.remove("modal-open");
  }
}
