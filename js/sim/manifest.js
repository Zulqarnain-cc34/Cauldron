/**
 * L3 Core rule manifest — list built-in rule modules in one place.
 * To add a material: create rule file, add one import + one line here.
 */
import { registerRuleDefs } from './rule-store.js';
import { sandRuleDef } from '../rules/materials/sand.js';
import { waterRuleDef } from '../rules/materials/water.js';
import { steamRuleDef } from '../rules/materials/steam.js';
import { fireRuleDef } from '../rules/materials/fire.js';
import { organicRuleDef } from '../rules/materials/organic.js';
import { stoneRuleDef } from '../rules/materials/stone.js';
import { dustRuleDef } from '../rules/materials/dust.js';
import { oilRuleDef } from '../rules/materials/oil.js';
import { gasRuleDef } from '../rules/materials/gas.js';
import { iceRuleDef } from '../rules/materials/ice.js';
import { lavaRuleDef } from '../rules/materials/lava.js';
import { woodRuleDef } from '../rules/materials/wood.js';
import { acidRuleDef } from '../rules/materials/acid.js';
import { seedRuleDef } from '../rules/materials/seed.js';
import { fungusRuleDef } from '../rules/materials/fungus.js';
import { rocketRuleDef } from '../rules/materials/rocket.js';
import { reactionRuleDef } from '../rules/reactions-module.js';

let loaded = false;

/** Idempotent — safe to call multiple times. */
export function loadCoreRules() {
  if (loaded) return;
  loaded = true;
  registerRuleDefs([
    sandRuleDef,
    waterRuleDef,
    steamRuleDef,
    fireRuleDef,
    organicRuleDef,
    stoneRuleDef,
    dustRuleDef,
    oilRuleDef,
    gasRuleDef,
    iceRuleDef,
    lavaRuleDef,
    woodRuleDef,
    acidRuleDef,
    seedRuleDef,
    fungusRuleDef,
    rocketRuleDef,
    reactionRuleDef,
  ]);
}

loadCoreRules();
