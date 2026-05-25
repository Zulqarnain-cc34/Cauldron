/** Default rule toggle keys for system phases only — materials sync at bootstrap. */
export function defaultRuleEnabled() {
  return {
    reactions: true,
    life: false,
    boids: false,
    flow: false,
  };
}
