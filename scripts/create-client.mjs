import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(projectRoot, "data", "clients.config.json");

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const randomSuffix = () => Math.random().toString(36).slice(2, 7);

const [name, explicitSlug] = process.argv.slice(2);

if (!name) {
  console.error('Usage: npm run create-client -- "Client Name" optional-slug');
  process.exit(1);
}

const config = JSON.parse(await fs.readFile(configPath, "utf8"));
const slugBase = explicitSlug ? slugify(explicitSlug) : slugify(name);
const slug = explicitSlug ? slugBase : `${slugBase}-${randomSuffix()}`;

if (config.clients.some((client) => client.slug === slug)) {
  console.error(`A client with slug "${slug}" already exists.`);
  process.exit(1);
}

const clientFolder = `content/clients/${slug}`;
const entry = {
  name,
  slug,
  eventType: "Portrait Session",
  eventDate: "",
  location: "",
  listOnHomepage: false,
  clientNote: "Welcome to your proof gallery. Tap the heart on any image you want edited first, then copy or download your selections when you are ready.",
  selectionInstructions: "Choose your favorites, add any notes you have, then send the selection list back.",
  proofsFolder: `${clientFolder}/proofs`,
  finalsFolder: `${clientFolder}/finals`,
  coverAsset: "",
  proofsDriveUrl: "",
  finalsDriveUrl: "",
  replyEmail: config.site.contactEmail || ""
};

config.clients.push(entry);

await fs.mkdir(path.join(projectRoot, clientFolder, "proofs"), { recursive: true });
await fs.mkdir(path.join(projectRoot, clientFolder, "finals"), { recursive: true });
await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n");

console.log(`Created ${name}`);
console.log(`Slug: ${slug}`);
console.log(`Proofs folder: ${entry.proofsFolder}`);
console.log(`Finals folder: ${entry.finalsFolder}`);
console.log("Next steps:");
console.log("1. Add proof images into the proofs folder.");
console.log("2. Update event details in data/clients.config.json.");
console.log("3. Run npm run build.");
