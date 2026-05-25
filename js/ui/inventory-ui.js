import { getItemDef, itemSwatchColor, getSlot } from '../cauldron/game.js';

/**
 * @param {import('../game/inventory/slot-inventory.js').SlotInventory} inv
 * @param {HTMLElement} grid
 * @returns {{ slot: HTMLButtonElement, iconEl: HTMLImageElement, swatchEl: HTMLSpanElement, labelEl: HTMLSpanElement, countEl: HTMLSpanElement }[]}
 */
export function buildInventoryGrid(inv, grid) {
  grid.innerHTML = '';
  grid.style.setProperty('--inv-cols', String(inv.cols));
  grid.setAttribute('role', 'grid');

  const slotEls = [];

  for (let i = 0; i < inv.slots.length; i++) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'inventory-slot';
    slot.dataset.slotIndex = String(i);
    slot.setAttribute('role', 'gridcell');
    slot.setAttribute('aria-label', `Slot ${i + 1}, empty`);
    slot.title = 'Empty slot';

    const iconEl = document.createElement('img');
    iconEl.className = 'inventory-slot-icon';
    iconEl.alt = '';
    iconEl.hidden = true;

    const swatchEl = document.createElement('span');
    swatchEl.className = 'inventory-slot-swatch';
    swatchEl.hidden = true;

    const labelEl = document.createElement('span');
    labelEl.className = 'inventory-slot-label';
    labelEl.hidden = true;

    const countEl = document.createElement('span');
    countEl.className = 'inventory-slot-count';
    countEl.hidden = true;

    slot.append(iconEl, swatchEl, labelEl, countEl);
    slot.addEventListener('click', (e) => e.stopPropagation());
    grid.appendChild(slot);
    slotEls.push({ slot, iconEl, swatchEl, labelEl, countEl });
  }

  return slotEls;
}

/**
 * @param {ReturnType<typeof buildInventoryGrid>} slotEls
 * @param {import('../game/inventory/slot-inventory.js').SlotInventory} inv
 */
export function refreshInventoryGrid(slotEls, inv) {
  slotEls.forEach(({ slot, iconEl, swatchEl, labelEl, countEl }, index) => {
    const stack = getSlot(inv, index);
    iconEl.hidden = true;
    swatchEl.hidden = true;
    labelEl.hidden = true;
    countEl.hidden = true;
    iconEl.removeAttribute('src');
    swatchEl.style.backgroundColor = '';

    if (!stack) {
      slot.classList.remove('has-item');
      slot.setAttribute('aria-label', `Slot ${index + 1}, empty`);
      slot.title = 'Empty slot';
      return;
    }

    const def = getItemDef(stack.itemId);
    const label = stack.label ?? def?.label ?? stack.itemId;
    slot.classList.add('has-item');
    slot.setAttribute('aria-label', `Slot ${index + 1}, ${label}${stack.count > 1 ? ` ×${stack.count}` : ''}`);
    slot.title = label;

    if (def?.icon) {
      iconEl.src = def.icon;
      iconEl.hidden = false;
    } else if (def) {
      const color = itemSwatchColor(def);
      if (color) {
        swatchEl.style.backgroundColor = color;
        swatchEl.hidden = false;
      } else {
        labelEl.textContent = label.slice(0, 3);
        labelEl.hidden = false;
      }
    } else {
      labelEl.textContent = label.slice(0, 3);
      labelEl.hidden = false;
    }

    if (stack.count > 1) {
      countEl.textContent = String(stack.count);
      countEl.hidden = false;
    }
  });
}

/** @param {EventTarget | null} target */
export function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/**
 * @param {object} opts
 * @param {string} opts.overlayId
 * @param {string} opts.title
 * @param {string} opts.iconSrc
 * @param {string} opts.hotkeyLabel
 * @param {string} [opts.hotkeyCode]
 * @param {string} opts.hint
 * @param {() => import('../game/inventory/slot-inventory.js').SlotInventory} opts.getInventory
 * @param {HTMLElement} opts.toolbar
 * @param {string} [opts.toggleClass] extra class on toolbar button
 * @param {(open: boolean) => void} [opts.onOpenChange]
 */
export function mountInventoryContainer(opts) {
  const {
    overlayId,
    title,
    iconSrc,
    hotkeyLabel,
    hotkeyCode,
    hint,
    getInventory,
    toolbar,
    toggleClass,
    onOpenChange,
  } = opts;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = toggleClass ? `container-toggle ${toggleClass}` : 'container-toggle';
  toggle.title = `${title} (${hotkeyLabel})`;
  toggle.setAttribute('aria-label', `Open ${title.toLowerCase()}`);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', `${overlayId}-modal`);

  const toggleIcon = document.createElement('img');
  toggleIcon.className = 'container-toggle-icon';
  toggleIcon.alt = '';
  toggleIcon.src = iconSrc;
  toggleIcon.draggable = false;
  toggle.appendChild(toggleIcon);

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.className = 'container-overlay';
  overlay.hidden = true;

  const modal = document.createElement('div');
  modal.id = `${overlayId}-modal`;
  modal.className = 'container-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', title);

  const header = document.createElement('header');
  header.className = 'container-modal-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'container-modal-title';
  const titleIcon = document.createElement('img');
  titleIcon.className = 'container-modal-icon';
  titleIcon.alt = '';
  titleIcon.src = iconSrc;
  titleIcon.draggable = false;
  const heading = document.createElement('h2');
  heading.textContent = title;
  titleWrap.append(titleIcon, heading);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'container-close';
  closeBtn.title = 'Close (Esc)';
  closeBtn.setAttribute('aria-label', `Close ${title.toLowerCase()}`);
  closeBtn.textContent = '×';

  header.append(titleWrap, closeBtn);

  const body = document.createElement('div');
  body.className = 'container-modal-body';

  const grid = document.createElement('div');
  grid.className = 'inventory-grid';
  grid.setAttribute('aria-label', `${title} slots`);

  const hintEl = document.createElement('p');
  hintEl.className = 'container-hint';
  hintEl.textContent = hint;

  body.append(grid, hintEl);
  modal.append(header, body);
  overlay.appendChild(modal);
  toolbar.appendChild(toggle);
  document.body.appendChild(overlay);

  let slotEls = buildInventoryGrid(getInventory(), grid);

  function refresh() {
    const inv = getInventory();
    modal.style.setProperty('--inv-cols', String(inv.cols));
    if (slotEls.length !== inv.slots.length) {
      slotEls = buildInventoryGrid(inv, grid);
    }
    refreshInventoryGrid(slotEls, inv);
  }

  function open() {
    refresh();
    overlay.hidden = false;
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
    onOpenChange?.(true);
  }

  function close() {
    overlay.hidden = true;
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
    onOpenChange?.(false);
  }

  function toggleOpen() {
    if (overlay.hidden) open();
    else close();
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleOpen();
  });

  closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  modal.addEventListener('click', (e) => e.stopPropagation());

  const keyHandler = (e) => {
    if (e.key === 'Escape' && !overlay.hidden) {
      e.preventDefault();
      close();
      return;
    }
    if (hotkeyCode && e.code === hotkeyCode && !isTypingTarget(e.target)) {
      e.preventDefault();
      toggleOpen();
    }
  };

  document.addEventListener('keydown', keyHandler);

  refresh();

  return {
    open,
    close,
    toggle: toggleOpen,
    refresh,
    destroy() {
      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
      toggle.remove();
    },
  };
}
