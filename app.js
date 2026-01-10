const API_URL = "https://script.google.com/macros/s/AKfycby3Cub0ypbHD_r773MmuK1SPm0cDekR7vKIr2i5ex3kro_r9iKMfRvyP6bdjHDIK_4gPg/exec"; 
const result = {};

let currentId = null;
let currentItemEl = null;
let currentCategory = null;

/* Load equipment.json */
fetch("equipment.json")
  .then(r => r.json())
  .then(buildUI)
  .catch(() => alert("Failed to load equipment.json"));

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
      items.style.display = items.style.display === "block" ? "none" : "block";
    };

    data[category].forEach(item => {
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

      items.appendChild(el);
    });

    cat.appendChild(header);
    cat.appendChild(items);
    app.appendChild(cat);
  }
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

/* Submit */

function submitAll() {
  if (Object.keys(result).length === 0) return;

  setSubmitLoading(true);

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(result)
  })
    .then(r => {
      if (!r.ok) throw new Error("Network error");
      return r.json();
    })
    .then(() => {
      showToast("Equipment submitted");
      clearForm();
    })
    .catch(() => {
      showToast("Failed to send data");
    })
    .finally(() => {
      setSubmitLoading(false);
    });
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

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;

    // nav buttons
    document.querySelectorAll(".nav-item").forEach(b =>
      b.classList.remove("active")
    );
    btn.classList.add("active");

    // pages
    document.querySelectorAll(".page").forEach(p =>
      p.classList.remove("active")
    );
    document.getElementById(`page-${page}`).classList.add("active");
  });
});
