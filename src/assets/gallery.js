const gallery = window.__GALLERY_DATA__;

if (!gallery) {
  throw new Error("Gallery data is missing.");
}

const favoritesKey = `gallery:favorites:${gallery.slug}`;
const noteKey = `gallery:note:${gallery.slug}`;
const favoriteSet = new Set(JSON.parse(localStorage.getItem(favoritesKey) || "[]"));

const proofGrid = document.querySelector("#proof-grid");
const finalsGrid = document.querySelector("#finals-grid");
const countTarget = document.querySelector("#selected-count");
const listTarget = document.querySelector("#selected-list");
const noteField = document.querySelector("#client-note");
const copyButton = document.querySelector("#copy-selections");
const downloadButton = document.querySelector("#download-selections");
const mailButton = document.querySelector("#mail-selections");
const clearButton = document.querySelector("#clear-selections");

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);

for (const node of document.querySelectorAll(".reveal")) {
  observer.observe(node);
}

noteField.value = localStorage.getItem(noteKey) || "";

const prettyName = (name) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const saveState = () => {
  localStorage.setItem(favoritesKey, JSON.stringify([...favoriteSet]));
  localStorage.setItem(noteKey, noteField.value);
};

const selectionLines = () => {
  const chosen = gallery.proofs
    .filter((proof) => favoriteSet.has(proof.filename))
    .map((proof, index) => `${index + 1}. ${prettyName(proof.filename)} (${proof.filename})`);

  const lines = [
    `Gallery: ${gallery.name}`,
    `Link slug: ${gallery.slug}`,
    "",
    "Selected favorites:"
  ];

  if (chosen.length === 0) {
    lines.push("None selected yet.");
  } else {
    lines.push(...chosen);
  }

  if (noteField.value.trim()) {
    lines.push("", "Client notes:", noteField.value.trim());
  }

  return lines.join("\n");
};

const updateSummary = () => {
  const total = favoriteSet.size;
  countTarget.textContent = String(total);

  const picked = gallery.proofs
    .filter((proof) => favoriteSet.has(proof.filename))
    .map((proof) => prettyName(proof.filename));

  listTarget.textContent = picked.length
    ? picked.join(" • ")
    : "No favorites selected yet.";

  mailButton.disabled = !gallery.replyEmail;
};

const toggleFavorite = (filename, button) => {
  if (favoriteSet.has(filename)) {
    favoriteSet.delete(filename);
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("title", "Add to favorites");
  } else {
    favoriteSet.add(filename);
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("title", "Remove from favorites");
  }

  saveState();
  updateSummary();
};

const renderProofs = () => {
  if (!gallery.proofs.length) {
    proofGrid.innerHTML = `
      <article class="empty-card">
        <h3>Proofs are not uploaded yet</h3>
        <p>Add web-sized images into this client's proofs folder, rebuild the site, and they will appear here.</p>
      </article>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const proof of gallery.proofs) {
    const card = document.createElement("article");
    card.className = "proof-card reveal";

    const selected = favoriteSet.has(proof.filename);

    card.innerHTML = `
      <figure>
        <img src="${proof.url}" alt="${proof.alt}">
      </figure>
      <div class="proof-card-body">
        <div class="proof-card-title">
          <div>
            <strong>${prettyName(proof.filename)}</strong>
            <span>${proof.filename}</span>
          </div>
          <button class="icon-button${selected ? " is-selected" : ""}" type="button" aria-pressed="${selected ? "true" : "false"}" title="${selected ? "Remove from favorites" : "Add to favorites"}">
            ${selected ? "♥" : "♡"}
          </button>
        </div>
      </div>
    `;

    const button = card.querySelector("button");
    button.addEventListener("click", () => toggleFavorite(proof.filename, button));
    fragment.appendChild(card);
    observer.observe(card);
  }

  proofGrid.replaceChildren(fragment);
}

const renderFinals = () => {
  if (!gallery.finals.length && !gallery.finalsDriveUrl) {
    finalsGrid.innerHTML = `
      <article class="empty-card">
        <h3>Edited downloads are not ready yet</h3>
        <p>Once finals are uploaded, they will show up here automatically after the next build and deploy.</p>
      </article>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const finalImage of gallery.finals) {
    const card = document.createElement("article");
    card.className = "final-card reveal";
    card.innerHTML = `
      <figure>
        <img src="${finalImage.url}" alt="${finalImage.alt}">
      </figure>
      <div class="final-card-body">
        <div class="final-card-title">
          <strong>${prettyName(finalImage.filename)}</strong>
        </div>
        <p>Edited file hosted directly in the site build.</p>
        <div class="inline-actions">
          <a class="button secondary" href="${finalImage.url}" download="${finalImage.filename}">Download</a>
          <a class="button ghost" href="${finalImage.url}" target="_blank" rel="noreferrer">Open</a>
        </div>
      </div>
    `;
    fragment.appendChild(card);
    observer.observe(card);
  }

  if (gallery.finalsDriveUrl) {
    const driveCard = document.createElement("article");
    driveCard.className = "empty-card reveal";
    driveCard.innerHTML = `
      <h3>Google Drive delivery</h3>
      <p>Use this if you would rather download the finished gallery from Drive.</p>
      <div class="inline-actions" style="margin-top:0.85rem;">
        <a class="button secondary" href="${gallery.finalsDriveUrl}" target="_blank" rel="noreferrer">Open final Drive folder</a>
      </div>
    `;
    fragment.appendChild(driveCard);
    observer.observe(driveCard);
  }

  finalsGrid.replaceChildren(fragment);
}

copyButton.addEventListener("click", async () => {
  const text = selectionLines();
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy selections";
    }, 1600);
  } catch (error) {
    alert(text);
  }
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob([selectionLines()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${gallery.slug}-selections.txt`;
  link.click();
  URL.revokeObjectURL(url);
});

mailButton.addEventListener("click", () => {
  if (!gallery.replyEmail) {
    return;
  }

  const subject = `Selections for ${gallery.name}`;
  const body = selectionLines();
  window.location.href = `mailto:${encodeURIComponent(gallery.replyEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

clearButton.addEventListener("click", () => {
  favoriteSet.clear();
  noteField.value = "";
  saveState();
  renderProofs();
  updateSummary();
});

noteField.addEventListener("input", saveState);

renderProofs();
renderFinals();
updateSummary();
