/** Default rule toggle keys — keep in sync with material rule modules. */
export const MATERIAL_RULE_KEYS = [
  'sand',
  'water',
  'fire',
  'organic',
  'stone',
  'dust',
  'oil',
  'gas',
  'ice',
  'lava',
  'wood',
  'acid',
  'seed',
  'fungus',
  'rocket',
];

export function defaultRuleEnabled() {
  const enabled = {
    reactions: true,
    life: false,
    boids: false,
    flow: false,
  };
  for (const key of MATERIAL_RULE_KEYS) {
    enabled[key] = true;
  }
  return enabled;
}
