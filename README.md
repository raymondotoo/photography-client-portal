# Photography Client Portal

Free first-version client gallery site built for a GitHub + Cloudflare Pages workflow.

## What this gives you

- Private-ish client links without building a real backend yet
- Proof galleries where clients can favorite images in the browser
- Copy, download, or email selection lists back to you
- Finals delivered from the same gallery page
- Google Drive links for proof or final delivery when you prefer not to host the finished files in the site itself

## Where to work

- Source config: `data/clients.config.json`
- Client proof folders: `content/clients/<slug>/proofs`
- Client finals folders: `content/clients/<slug>/finals`
- Built site output: `dist/`

## Quick start

1. Open this folder in VS Code.
2. Update your brand settings in `data/clients.config.json`.
3. Add your first real client:

```bash
npm run create-client -- "Client Name"
```

4. Drop web-sized proof images into that client's `proofs` folder.
5. Optionally add edited finals into that client's `finals` folder.
6. Build the static site:

```bash
npm run build
```

7. Open `dist/index.html` locally to preview.

## Client workflow

1. Send the client their direct gallery link:

```text
/clients/<slug>/index.html
```

2. They favorite images by tapping hearts.
3. They can copy or download the selection list.
4. If you set `replyEmail`, they can also email their selections directly from the page.
5. After editing, either:
   - add finals into `content/clients/<slug>/finals`, rebuild, and redeploy
   - or set `finalsDriveUrl` in `data/clients.config.json` and rebuild

## Important limitations of this free version

- This is not true authentication.
- Hidden client links are private by obscurity, not by login security.
- Do not upload sensitive originals or RAW files into the public site build.
- Use web-sized proofs in the site and keep full-resolution delivery in Google Drive if you want a safer first version.

## Suggested image workflow

- Proofs in the site: export JPEG or WebP around 1800px long edge
- Finals in Google Drive: full-resolution JPEGs
- Keep RAW files local or on your backup drive, not in the deployed site

## Deploy to GitHub and Cloudflare Pages

1. Initialize git if needed:

```bash
git init
git add .
git commit -m "Initial client portal"
```

2. Create a GitHub repo and push from VS Code or terminal.
3. In Cloudflare Pages:
   - Connect the GitHub repo
   - Choose `Import an existing Git repository`
   - Select `raymondotoo/photography-client-portal`
   - Production branch: `main`
   - Root directory: leave blank
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: leave default unless you want to pin one later
4. Every time you add images or update config:
   - run `npm run build`
   - commit
   - push

## Cloudflare Pages quick connect

This repository now includes `wrangler.jsonc` with the Pages project name and build output directory:

- Project name: `photography-client-portal`
- Build output directory: `dist`

That means the Cloudflare side should be a simple dashboard setup:

1. Go to Cloudflare `Workers & Pages`.
2. Select `Create application`.
3. Select `Pages`.
4. Select `Import an existing Git repository`.
5. Connect GitHub if Cloudflare asks.
6. Choose `raymondotoo/photography-client-portal`.
7. Confirm the build settings above and deploy.

Once the first deploy succeeds, every push to `main` will rebuild the site automatically.

## Config fields

Top-level `site`:

- `brandName`
- `tagline`
- `intro`
- `contactEmail`
- `bookingUrl`
- `homepageHeadline`
- `homepageSubhead`

Per-client:

- `name`
- `slug`
- `eventType`
- `eventDate`
- `location`
- `listOnHomepage`
- `clientNote`
- `selectionInstructions`
- `proofsFolder`
- `finalsFolder`
- `coverAsset`
- `proofsDriveUrl`
- `finalsDriveUrl`
- `replyEmail`

## Notes on Google Drive

Google Drive works well here as a delivery layer for final downloads. For this free version, that is the best use of it. A real password-protected portal would come later when you decide to add a backend.
