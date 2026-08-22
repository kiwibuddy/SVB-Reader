/** One-shot handoff after creating a custom plan (avoid /plan/[id] routing). */
let pendingFocusUserPlanId: string | null = null;

export function setPendingFocusUserPlan(id: string) {
  pendingFocusUserPlanId = id;
}

export function takePendingFocusUserPlan(): string | null {
  const id = pendingFocusUserPlanId;
  pendingFocusUserPlanId = null;
  return id;
}
