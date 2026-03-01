/**
 * remove-driveway.mjs
 *
 * Permanently removes driveway geometry from public/models/house.glb.
 * Prunes all orphaned meshes, materials, and textures after removal.
 *
 * Run:  npm run remove-driveway
 */

import { NodeIO } from "@gltf-transform/core";
import { prune, dedup } from "@gltf-transform/functions";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, "../public/models/house.glb");

// ── Keywords used to identify driveway nodes / meshes / materials ─────────────
// Extend this list if the script logs a name that clearly belongs to the driveway
// but wasn't caught automatically.
const DRIVEWAY_KEYWORDS = [
  "drive", "driveway", "road", "pavement", "asphalt",
  "concrete", "curb", "walkway", "sidewalk", "ground_path",
  "path", "terrain_path",
  // Cyprys House model: the front flat platform uses this node name
  "terrace",
];

// ─────────────────────────────────────────────────────────────────────────────
const io = new NodeIO();
console.log(`\nReading: ${MODEL_PATH}`);
const document = await io.read(MODEL_PATH);
const root = document.getRoot();

// ── 1. Log every mesh node so you can verify names ───────────────────────────
console.log("\n══════════ All mesh nodes in model ══════════");
root.listNodes().forEach((node) => {
  const mesh = node.getMesh();
  if (!mesh) return;
  const matNames = mesh
    .listPrimitives()
    .map((p) => p.getMaterial()?.getName() ?? "—")
    .join(", ");
  console.log(
    `  node: "${node.getName()}"` +
    `  |  mesh: "${mesh.getName()}"` +
    `  |  materials: [${matNames}]`
  );
});
console.log("═════════════════════════════════════════════\n");

// ── 2. Collect nodes to remove (never mutate during traversal) ────────────────
const toRemove = [];

root.listNodes().forEach((node) => {
  const mesh = node.getMesh();
  if (!mesh) return;

  const nodeName = node.getName().toLowerCase();
  const meshName = mesh.getName().toLowerCase();
  const matNames = mesh
    .listPrimitives()
    .map((p) => p.getMaterial()?.getName()?.toLowerCase() ?? "")
    .join(" ");

  const hit = DRIVEWAY_KEYWORDS.find(
    (k) => nodeName.includes(k) || meshName.includes(k) || matNames.includes(k)
  );

  if (hit) {
    console.log(
      `  ✂  Removing (matched "${hit}"):` +
      ` node="${node.getName()}"  mesh="${mesh.getName()}"`
    );
    toRemove.push(node);
  }
});

// ── 3. Dispose matched nodes ──────────────────────────────────────────────────
if (toRemove.length === 0) {
  console.log(
    "  ⚠  No nodes matched DRIVEWAY_KEYWORDS.\n" +
    "     Check the names printed above, then add the relevant keyword\n" +
    "     to DRIVEWAY_KEYWORDS at the top of this script and re-run.\n"
  );
  process.exit(0);
}

toRemove.forEach((node) => node.dispose());

// ── 4. Prune orphaned meshes, accessors, materials, and textures ──────────────
console.log("\n  Pruning orphaned resources…");
await document.transform(prune(), dedup());

// ── 5. Write cleaned model back in-place ─────────────────────────────────────
await io.write(MODEL_PATH, document);

console.log(
  `\n  ✓  Done. Removed ${toRemove.length} node(s).\n` +
  `     Cleaned model written to:\n     ${MODEL_PATH}\n`
);
