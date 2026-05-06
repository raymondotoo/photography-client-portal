import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const configPath = path.join(projectRoot, "data", "clients.config.json");
const assetsDir = path.join(projectRoot, "src", "assets");
const contentDir = path.join(projectRoot, "content");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

const slash = (value) => value.split(path.sep).join("/");

const htmlEscape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const jsonScript = (value) =>
  JSON.stringify(value, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll("</script", "<\\/script");

const fileExists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const readJson = async (target) => JSON.parse(await fs.readFile(target, "utf8"));

const ensureDir = async (target) => {
  await fs.mkdir(target, { recursive: true });
};

const copyDir = async (source, destination) => {
  await ensureDir(destination);
  await fs.cp(source, destination, { recursive: true });
};

const walkMedia = async (directory) => {
  if (!(await fileExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMedia(absolute)));
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolute);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
};

const toClientAssetPath = (relativeFromRoot) => slash(path.posix.join("..", "..", slash(relativeFromRoot)));

const toHomeAssetPath = (relativeFromRoot) => slash(relativeFromRoot);

const collectGalleryFiles = async (relativeDirectory, assetFormatter) => {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);
  const files = await walkMedia(absoluteDirectory);

  return files.map((absolute) => {
    const relative = slash(path.relative(projectRoot, absolute));
    return {
      filename: path.basename(absolute),
      alt: path.basename(absolute, path.extname(absolute)).replace(/[-_]+/g, " ").trim(),
      url: assetFormatter(relative)
    };
  });
};

const renderHomePage = (site, clients) => {
  const visibleClients = clients.filter((client) => client.listOnHomepage);

  const galleryMarkup = visibleClients.length
    ? visibleClients
        .map(
          (client) => `
            <article class="gallery-card reveal">
              <a href="clients/${client.slug}/index.html">
                <img src="${client.coverAssetHome}" alt="${htmlEscape(client.name)} cover image">
              </a>
              <div class="gallery-card-body">
                <div class="meta-pills">
                  <span class="pill">${htmlEscape(client.eventType || "Client Gallery")}</span>
                </div>
                <div>
                  <h3>${htmlEscape(client.name)}</h3>
                  <p>${htmlEscape([client.eventDate, client.location].filter(Boolean).join(" • ") || "Private gallery link")}</p>
                </div>
                <div class="gallery-card-footer">
                  <small>${client.proofs.length} proofs${client.finals.length || client.finalsDriveUrl ? " • finals ready" : ""}</small>
                  <a class="button secondary" href="clients/${client.slug}/index.html">Open gallery</a>
                </div>
              </div>
            </article>
          `
        )
        .join("")
    : `
      <article class="empty-card reveal">
        <h3>No public galleries listed yet</h3>
        <p>That is okay. You can keep client pages unlisted and only share the direct gallery links you send privately.</p>
      </article>
    `;

  const bookingAction = site.bookingUrl
    ? `<a class="button secondary" href="${htmlEscape(site.bookingUrl)}" target="_blank" rel="noreferrer">Book a session</a>`
    : "";

  const contactAction = site.contactEmail
    ? `<a class="button ghost" href="mailto:${htmlEscape(site.contactEmail)}">Update contact email</a>`
    : `<span class="pill">Set your email in data/clients.config.json</span>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${htmlEscape(site.brandName)} | Client Galleries</title>
    <meta name="description" content="${htmlEscape(site.tagline)}">
    <link rel="stylesheet" href="assets/styles.css">
    <script defer src="assets/home.js"></script>
  </head>
  <body>
    <header class="shell site-header">
      <div class="brand-lockup">
        <strong>${htmlEscape(site.brandName)}</strong>
        <span>${htmlEscape(site.tagline)}</span>
      </div>
      <div class="inline-actions">
        ${bookingAction}
        ${contactAction}
      </div>
    </header>

    <main class="shell">
      <section class="hero">
        <article class="hero-copy reveal">
          <p class="eyebrow">Private client galleries</p>
          <h1>${htmlEscape(site.homepageHeadline)}</h1>
          <p class="lede">${htmlEscape(site.homepageSubhead)}</p>
          <div class="hero-actions" style="margin-top:1.25rem;">
            <span class="pill">Free static workflow</span>
            <span class="pill">GitHub + Cloudflare Pages</span>
            <span class="pill">Google Drive delivery</span>
          </div>
          <div class="note-banner">
            Client links can stay off the homepage entirely. This page can act like your public front door while private gallery URLs are shared one by one.
          </div>
        </article>

        <aside class="hero-aside reveal">
          <article class="workflow-card">
            <p class="eyebrow">How it works</p>
            <h3>1. Upload proofs</h3>
            <p>Drop web-sized proof images into a client's folder, rebuild, and push from VS Code.</p>
          </article>
          <article class="workflow-card">
            <h3>2. Client selects favorites</h3>
            <p>Favorites stay in their browser until they copy, download, or email the selection list back to you.</p>
          </article>
          <article class="workflow-card">
            <h3>3. Deliver finals</h3>
            <p>Add edited files to the finals folder or link the client's Google Drive delivery folder from the same gallery.</p>
          </article>
        </aside>
      </section>

      <section class="section">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">Live galleries</p>
            <h2>Direct links for real clients</h2>
            <p>Anything marked public in the config appears here. Everything else still works by direct URL only.</p>
          </div>
        </div>
        <div class="gallery-list">
          ${galleryMarkup}
        </div>
      </section>
    </main>

    <footer class="shell footer">
      <p>${htmlEscape(site.brandName)} • <span data-current-year></span> • Built as a free starter workflow you can push from VS Code.</p>
    </footer>
  </body>
</html>`;
};

const renderClientPage = (site, client) => {
  const details = [client.eventType, client.eventDate, client.location].filter(Boolean);
  const proofButton = client.proofsDriveUrl
    ? `<a class="button ghost" href="${htmlEscape(client.proofsDriveUrl)}" target="_blank" rel="noreferrer">Open proof folder in Drive</a>`
    : "";

  const finalButton = client.finalsDriveUrl
    ? `<a class="button secondary" href="${htmlEscape(client.finalsDriveUrl)}" target="_blank" rel="noreferrer">Open final downloads</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${htmlEscape(client.name)} | ${htmlEscape(site.brandName)}</title>
    <meta name="description" content="Private client gallery for ${htmlEscape(client.name)}">
    <meta name="robots" content="noindex,nofollow">
    <link rel="stylesheet" href="../../assets/styles.css">
    <script>
      window.__GALLERY_DATA__ = ${jsonScript(client)};
    </script>
    <script defer src="../../assets/gallery.js"></script>
  </head>
  <body>
    <header class="shell site-header">
      <div class="brand-lockup">
        <strong>${htmlEscape(site.brandName)}</strong>
        <span>Private gallery link</span>
      </div>
      <div class="inline-actions">
        <a class="button ghost" href="../../index.html">Back to home</a>
      </div>
    </header>

    <main class="shell">
      <section class="client-hero">
        <article class="hero-copy reveal">
          <p class="eyebrow">Client gallery</p>
          <h1>${htmlEscape(client.name)}</h1>
          <div class="meta-pills" style="margin-top:1rem;">
            ${details.map((detail) => `<span class="pill">${htmlEscape(detail)}</span>`).join("")}
            <span class="pill">${client.proofs.length} proofs</span>
          </div>
          <p class="lede">${htmlEscape(client.clientNote)}</p>
          <div class="hero-actions" style="margin-top:1.25rem;">
            ${proofButton}
            ${finalButton}
          </div>
          <div class="note-banner">
            This free version uses direct links, not real authentication. Share client URLs privately and keep sensitive originals off the web build.
          </div>
        </article>

        <aside class="selection-card reveal">
          <div class="selection-summary">
            <span>Current picks</span>
            <strong id="selected-count">0</strong>
            <span>favorites selected on this device</span>
          </div>
          <p class="muted">${htmlEscape(client.selectionInstructions)}</p>
          <label for="client-note"><strong>Notes for your photographer</strong></label>
          <textarea id="client-note" placeholder="Optional notes, retouch requests, or priority images"></textarea>
          <div class="toolbar-actions">
            <button class="button secondary" id="copy-selections" type="button">Copy selections</button>
            <button class="button ghost" id="download-selections" type="button">Download list</button>
            <button class="button ghost" id="mail-selections" type="button"${client.replyEmail ? "" : " disabled"}>Email selections</button>
            <button class="button ghost" id="clear-selections" type="button">Reset</button>
          </div>
          <div class="selected-list" id="selected-list">No favorites selected yet.</div>
        </aside>
      </section>

      <section class="section">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">Proof gallery</p>
            <h2>Pick the frames you want first</h2>
            <p>Use the heart on any image to mark it as a favorite. When you finish, copy or download the list and send it back.</p>
          </div>
        </div>
        <div class="proof-grid" id="proof-grid"></div>
      </section>

      <section class="section">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">Edited delivery</p>
            <h2>Final downloads live here</h2>
            <p>Use local files for direct downloads, a Google Drive folder for delivery, or both.</p>
          </div>
        </div>
        <div class="finals-grid" id="finals-grid"></div>
      </section>
    </main>

    <footer class="shell footer">
      <p>${htmlEscape(site.brandName)} • Share this page as a direct client link.</p>
    </footer>
  </body>
</html>`;
};

const main = async () => {
  const config = await readJson(configPath);
  const clients = config.clients ?? [];
  const seen = new Set();
  const builtClients = [];

  for (const client of clients) {
    if (seen.has(client.slug)) {
      throw new Error(`Duplicate client slug detected: ${client.slug}`);
    }
    seen.add(client.slug);

    const proofs = await collectGalleryFiles(client.proofsFolder, toClientAssetPath);
    const finals = await collectGalleryFiles(client.finalsFolder, toClientAssetPath);

    const coverPath = client.coverAsset ? toHomeAssetPath(client.coverAsset) : "";
    const fallbackCover = proofs[0]?.url.replace("../../", "") || finals[0]?.url.replace("../../", "") || "";

    builtClients.push({
      ...client,
      replyEmail: client.replyEmail || config.site.contactEmail || "",
      proofs,
      finals,
      coverAssetHome: coverPath || fallbackCover
    });
  }

  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(distDir);
  await copyDir(assetsDir, path.join(distDir, "assets"));
  await copyDir(contentDir, path.join(distDir, "content"));
  await ensureDir(path.join(distDir, "clients"));

  await fs.writeFile(path.join(distDir, "index.html"), renderHomePage(config.site, builtClients));
  await fs.writeFile(
    path.join(distDir, "robots.txt"),
    "User-agent: *\nDisallow: /clients/\n"
  );
  await fs.writeFile(
    path.join(distDir, "data.json"),
    JSON.stringify({ site: config.site, clients: builtClients.map(({ proofs, finals, ...client }) => client) }, null, 2)
  );

  for (const client of builtClients) {
    const folder = path.join(distDir, "clients", client.slug);
    await ensureDir(folder);
    await fs.writeFile(path.join(folder, "index.html"), renderClientPage(config.site, client));
  }

  console.log(`Built ${builtClients.length} client page(s) into ${slash(path.relative(projectRoot, distDir))}`);
};

await main();
