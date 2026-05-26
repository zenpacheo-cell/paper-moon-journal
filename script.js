const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const pageObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("turning", entry.isIntersecting);
    });
  },
  { threshold: 0.45 }
);

document.querySelectorAll("[data-page]").forEach((page) => pageObserver.observe(page));

const scrapbookPage = document.querySelector("#scrapbookPage");
const pageTitle = document.querySelector("#pageTitle");
const journalText = document.querySelector("#journalText");
const liveTitle = document.querySelector("#liveTitle");
const liveText = document.querySelector("#liveText");
const supplyStatus = document.querySelector("#supplyStatus");
const bookStage = document.querySelector("#bookStage");
const pageIndicator = document.querySelector("#pageIndicator");
const memoryDialog = document.querySelector("#memoryDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogCopy = document.querySelector("#dialogCopy");
const pageTotal = 3;
let currentPage = Number(localStorage.getItem("paperMoonCurrentPage") || 0);
let selectedMemory = null;

function toast(message) {
  const note = document.createElement("div");
  note.className = "toast";
  note.textContent = message;
  document.body.append(note);
  requestAnimationFrame(() => note.classList.add("show"));
  setTimeout(() => {
    note.classList.remove("show");
    setTimeout(() => note.remove(), 260);
  }, 1800);
}

function scrollToStudio() {
  document.querySelector("#studio").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openBook() {
  bookStage.classList.remove("is-closed");
  bookStage.classList.add("is-open");
  localStorage.setItem("paperMoonBookOpen", "true");
}

function closeBook() {
  bookStage.classList.add("is-closed");
  bookStage.classList.remove("is-open");
  localStorage.setItem("paperMoonBookOpen", "false");
}

function getAllPages() {
  const saved = localStorage.getItem("paperMoonPages");
  if (saved) return JSON.parse(saved);
  const legacy = localStorage.getItem("paperMoonPage");
  if (legacy) return [JSON.parse(legacy)];
  return [];
}

function saveCurrentPage() {
  const pages = getAllPages();
  pages[currentPage] = serializePage();
  localStorage.setItem("paperMoonPages", JSON.stringify(pages));
  localStorage.setItem("paperMoonCurrentPage", String(currentPage));
}

function serializePage() {
  const elements = [...scrapbookPage.querySelectorAll(".scrap-element")].map((element) => ({
    type: element.dataset.type,
    html: element.innerHTML,
    text: element.textContent,
    className: element.className,
    left: element.style.left,
    top: element.style.top,
    rotate: element.style.rotate
  }));

  return {
    title: pageTitle.value,
    text: journalText.value,
    paper: scrapbookPage.style.getPropertyValue("--paper"),
    elements
  };
}

function defaultPage(pageNumber) {
  return {
    title: pageNumber === 0 ? "today's soft archive" : `scrapbook page ${pageNumber + 1}`,
    text: "Dear diary, today I want to remember...",
    paper: "",
    elements: pageNumber === 0 ? null : []
  };
}

function syncEditor() {
  liveTitle.textContent = pageTitle.value || "untitled memory";
  liveText.textContent = journalText.value || "Start writing here...";
  savePage();
}

pageTitle.addEventListener("input", syncEditor);
journalText.addEventListener("input", syncEditor);
liveTitle.addEventListener("input", () => {
  pageTitle.value = liveTitle.textContent.trim();
  savePage();
});
liveText.addEventListener("input", () => {
  journalText.value = liveText.textContent.trim();
  savePage();
});

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("pointermove", (event) => {
    const rect = swatch.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    swatch.style.transform = `translate(${x * 0.04}px, ${y * 0.04}px) rotate(${x * 0.035}deg)`;
  });

  swatch.addEventListener("pointerleave", () => {
    swatch.style.transform = "";
  });
});

document.querySelectorAll(".js-paper-color").forEach((button) => {
  button.addEventListener("click", () => {
    scrapbookPage.style.setProperty("--paper", button.dataset.color);
    openBook();
    scrollToStudio();
    toast(`${button.textContent} paper pasted`);
    savePage();
  });
});

document.querySelectorAll(".js-prompt").forEach((card) => {
  const usePrompt = () => {
    journalText.value = card.dataset.prompt;
    syncEditor();
    openBook();
    scrollToStudio();
    toast("prompt added to your page");
  };
  card.addEventListener("click", usePrompt);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") usePrompt();
  });
});

document.querySelector(".js-fill-note").addEventListener("click", () => {
  journalText.value = "things to save:\nsunny receipts\ntea tags\nticket stubs";
  syncEditor();
  openBook();
  scrollToStudio();
  toast("note copied into your journal");
});

document.querySelectorAll(".js-add-sticker").forEach((sticker) => {
  sticker.addEventListener("click", () => {
    addElement(sticker.dataset.sticker === "wish" ? "star" : "flower");
    openBook();
    scrollToStudio();
  });
});

document.querySelectorAll(".js-supply").forEach((item) => {
  const useSupply = () => {
    addElement(item.dataset.supply);
    supplyStatus.textContent = `${item.dataset.item} pasted onto your page`;
    openBook();
    scrollToStudio();
  };
  item.addEventListener("click", useSupply);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") useSupply();
  });
});

document.querySelectorAll(".js-memory").forEach((page) => {
  const openMemory = () => {
    selectedMemory = page.dataset;
    dialogTitle.textContent = selectedMemory.title;
    dialogCopy.textContent = selectedMemory.copy;
    memoryDialog.showModal();
  };
  page.addEventListener("click", openMemory);
  page.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") openMemory();
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => memoryDialog.close());
document.querySelector("#useMemory").addEventListener("click", () => {
  if (!selectedMemory) return;
  pageTitle.value = selectedMemory.title;
  journalText.value = selectedMemory.copy;
  syncEditor();
  memoryDialog.close();
  openBook();
  scrollToStudio();
  toast("featured page idea added");
});

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => {
    openBook();
    addElement(button.dataset.tool);
  });
});

document.querySelectorAll("[data-page-paper]").forEach((button) => {
  button.addEventListener("click", () => {
    scrapbookPage.style.setProperty("--paper", button.dataset.pagePaper);
    openBook();
    savePage();
    toast(`${button.textContent} page selected`);
  });
});

document.querySelector("#photoUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    openBook();
    addElement("photo", reader.result);
    event.target.value = "";
  });
  reader.readAsDataURL(file);
});

document.querySelector("#savePage").addEventListener("click", () => {
  savePage();
  toast("page saved in this browser");
});

document.querySelector("#openBook").addEventListener("click", openBook);
document.querySelector("#bookCover").addEventListener("click", () => {
  openBook();
  toast("scrapbook opened");
});
document.querySelector("#closeBook").addEventListener("click", closeBook);
document.querySelector("#prevPage").addEventListener("click", () => goToPage(currentPage - 1));
document.querySelector("#nextPage").addEventListener("click", () => goToPage(currentPage + 1));

document.querySelector("#clearPage").addEventListener("click", () => {
  scrapbookPage.querySelectorAll(".scrap-element").forEach((element) => element.remove());
  pageTitle.value = "fresh blank page";
  journalText.value = "Dear diary, today I want to remember...";
  scrapbookPage.style.removeProperty("--paper");
  syncEditor();
  openBook();
  toast("fresh page ready");
});

function addElement(type, src = "") {
  const element = document.createElement(type === "note" ? "div" : "div");
  element.className = `scrap-element ${classForType(type)}`;
  element.dataset.type = type;
  element.tabIndex = 0;
  element.style.left = `${20 + Math.random() * 52}%`;
  element.style.top = `${24 + Math.random() * 48}%`;
  element.style.rotate = `${Math.round(-10 + Math.random() * 20)}deg`;

  if (type === "photo") {
    element.innerHTML = `<img src="${src}" alt="Uploaded scrapbook memory" />`;
  } else if (type === "cat" || type === "dog") {
    element.innerHTML = "<span></span>";
    element.setAttribute("aria-label", `${type} sticker`);
  } else if (type === "note") {
    element.contentEditable = "true";
    element.textContent = "write a tiny note";
  } else if (type === "tape") {
    element.setAttribute("aria-label", "draggable washi tape");
  } else if (isEditableScrap(type)) {
    element.contentEditable = "true";
    element.textContent = labelForType(type);
  } else {
    element.textContent = labelForType(type);
  }

  scrapbookPage.append(element);
  enableDrag(element);
  savePage();
  toast(`${labelForType(type)} pasted`);
}

function classForType(type) {
  return {
    note: "note-piece",
    tape: "tape-piece",
    heart: "studio-sticker heart-piece",
    star: "studio-sticker star-piece",
    flower: "studio-sticker flower-piece",
    sparkle: "studio-sticker sparkle-piece",
    moon: "studio-sticker moon-piece",
    bow: "studio-sticker bow-piece",
    cat: "studio-sticker cat-piece",
    dog: "studio-sticker dog-piece",
    ticket: "ticket-piece",
    label: "label-piece",
    receipt: "receipt-piece",
    kraft: "kraft-piece",
    cardboard: "cardboard-piece",
    newspaper: "newspaper-piece",
    photo: "photo-piece",
    wish: "studio-sticker star-piece",
    bloom: "studio-sticker flower-piece"
  }[type];
}

function labelForType(type) {
  return {
    note: "note",
    tape: "tape",
    heart: "love",
    star: "star",
    flower: "bloom",
    sparkle: "sparkle",
    moon: "moon note",
    bow: "ribbon bow",
    cat: "cat sticker",
    dog: "dog sticker",
    ticket: "admit one memory",
    label: "little label",
    receipt: "receipt\ntea + cake\nthank you",
    kraft: "reused kraft paper",
    cardboard: "recycled cardboard",
    newspaper: "today's tiny headline\nsoft weather, softer plans",
    photo: "photo",
    wish: "wish",
    bloom: "bloom"
  }[type];
}

function isEditableScrap(type) {
  return ["ticket", "label", "receipt", "kraft", "cardboard", "newspaper"].includes(type);
}

function enableDrag(element) {
  element.addEventListener("pointerdown", (event) => {
    if (event.target.matches("img")) event.preventDefault();
    if (element.isContentEditable && event.detail > 1) return;
    const pageRect = scrapbookPage.getBoundingClientRect();
    const startRect = element.getBoundingClientRect();
    const offsetX = event.clientX - startRect.left;
    const offsetY = event.clientY - startRect.top;

    element.classList.add("dragging");
    element.setPointerCapture(event.pointerId);

    function move(moveEvent) {
      const x = moveEvent.clientX - pageRect.left - offsetX;
      const y = moveEvent.clientY - pageRect.top - offsetY;
      const maxX = pageRect.width - element.offsetWidth;
      const maxY = pageRect.height - element.offsetHeight;
      element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    }

    function up() {
      element.classList.remove("dragging");
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      savePage();
    }

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
  });

  element.addEventListener("dblclick", () => {
    if (element.dataset.type !== "note") element.remove();
    savePage();
  });
}

function savePage() {
  saveCurrentPage();
}

function loadPage() {
  const pages = getAllPages();
  const page = pages[currentPage] || defaultPage(currentPage);
  pageIndicator.textContent = `page ${currentPage + 1} / ${pageTotal}`;
  localStorage.setItem("paperMoonCurrentPage", String(currentPage));

  if (page.elements === null) {
    scrapbookPage.querySelectorAll(".scrap-element").forEach(enableDrag);
    pageTitle.value = page.title;
    journalText.value = page.text;
    liveTitle.textContent = pageTitle.value;
    liveText.textContent = journalText.value;
    return;
  }

  pageTitle.value = page.title || pageTitle.value;
  journalText.value = page.text || journalText.value;
  liveTitle.textContent = pageTitle.value;
  liveText.textContent = journalText.value;
  scrapbookPage.style.removeProperty("--paper");
  if (page.paper) scrapbookPage.style.setProperty("--paper", page.paper);
  scrapbookPage.querySelectorAll(".scrap-element").forEach((element) => element.remove());

  page.elements.forEach((item) => {
    const element = document.createElement("div");
    element.className = item.className;
    element.dataset.type = item.type;
    element.tabIndex = 0;
    element.style.left = item.left;
    element.style.top = item.top;
    element.style.rotate = item.rotate;
    if (item.type === "note" || isEditableScrap(item.type)) element.contentEditable = "true";
    element.innerHTML = item.html || item.text;
    scrapbookPage.append(element);
    enableDrag(element);
  });
}

function goToPage(nextPage) {
  savePage();
  currentPage = (nextPage + pageTotal) % pageTotal;
  scrapbookPage.classList.add("page-flipping");
  setTimeout(() => {
    loadPage();
    openBook();
    scrapbookPage.classList.remove("page-flipping");
    toast(`page ${currentPage + 1}`);
  }, 220);
}

window.addEventListener("scroll", () => {
  document.documentElement.style.setProperty("--scroll", window.scrollY.toString());
});

loadPage();
if (localStorage.getItem("paperMoonBookOpen") === "true") openBook();
