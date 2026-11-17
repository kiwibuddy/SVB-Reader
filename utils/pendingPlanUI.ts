/** One-shot handoff after creating a custom plan (avoid /plan/[id] routing). */
let pending: { id: string; expand: boolean } | null = null;

/** `expand`: open the plan's stories on arrival (voice plans); otherwise it stays collapsed. */
export function setPendingFocusUserPlan(id: string, options: { expand?: boolean } = {}) {
  pending = { id, expand: !!options.expand };
}

export function takePendingFocusUserPlan(): { id: string; expand: boolean } | null {
  const taken = pending;
  pending = null;
  return taken;
}
