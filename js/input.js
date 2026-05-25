import { Species } from './catalog/species.js';
import { getBrushMaterials } from './catalog/materials.js';
import { getExtensionBrushTools } from './sim/brush-registry.js';
import { displayCellPx } from './world.js';

function gridFromMouse(world, mx, my) {
  const px = displayCellPx();
  const gx = Math.floor(mx / px);
  const gy = Math.floor(my / px);
  if (!world.inBounds(gx, gy)) return null;
  return { gx, gy };
}

function paintDisc(world, gx, gy, species) {
  const r = world.brush.radius;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 0.5) continue;
      const x = gx + dx;
      const y = gy + dy;
      if (!world.inBounds(x, y)) continue;
      if (species === Species.EMPTY) {
        world.set(x, y, world.emptyCell());
      } else {
        world.set(x, y, {
          species,
          flags: 0,
          ra: world.randInt(255),
          rb: 0,
        });
      }
    }
  }
}

export function queueBrush(world, mx, my, erasing = false) {
  const g = gridFromMouse(world, mx, my);
  if (!g) return;
  world.brush.queue.push({
    gx: g.gx,
    gy: g.gy,
    species: erasing ? Species.EMPTY : world.brush.species,
  });
}

export function applyBrushQueue(world) {
  for (const stroke of world.brush.queue) {
    paintDisc(world, stroke.gx, stroke.gy, stroke.species);
  }
  world.brush.queue.length = 0;
}

export function setupInput(world, canvas) {
  const onPaint = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    queueBrush(world, mx, my, e.button === 2 || e.shiftKey);
  };

  canvas.addEventListener('mousedown', onPaint);
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons & 1 || e.buttons & 2) onPaint(e);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Paint tools for brush dropdown (core + extensions). */
export function buildBrushTools() {
  const core = getBrushMaterials()
    .filter((m) => m.id !== Species.WALL)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({
      id: m.name,
      species: m.id,
      label: m.name.charAt(0).toUpperCase() + m.name.slice(1),
    }));

  const ext = getExtensionBrushTools()
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  return [
    ...core,
    ...ext,
    { id: 'wall', species: Species.WALL, label: 'Wall' },
    { id: 'erase', species: Species.EMPTY, label: 'Eraser' },
  ];
}

/** @deprecated Use buildBrushTools() for fresh list after runtime registration */
export const BRUSH_TOOLS = buildBrushTools();
