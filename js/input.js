import { Species } from './materials.js';
import { CELL_PX } from './world.js';
import { registerRule } from './rules/registry.js';

function gridFromMouse(world, mx, my) {
  const gx = Math.floor(mx / CELL_PX);
  const gy = Math.floor(my / CELL_PX);
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
  registerRule('brush', {
    id: 'player-brush',
    enabled: () => true,
    run: applyBrushQueue,
  });

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

export const BRUSH_TOOLS = [
  { id: 'sand', species: Species.SAND, label: 'Sand' },
  { id: 'water', species: Species.WATER, label: 'Water' },
  { id: 'stone', species: Species.STONE, label: 'Stone' },
  { id: 'wall', species: Species.WALL, label: 'Wall' },
  { id: 'fire', species: Species.FIRE, label: 'Fire' },
  { id: 'organic', species: Species.ORGANIC, label: 'Organic' },
  { id: 'erase', species: Species.EMPTY, label: 'Eraser' },
];
