// platformKeys — the modifier-key LABEL for the OQL chip shortcut hints (oxjob #467).
// The "new chip to the right" shortcut is Cmd+Enter on macOS / Ctrl+Enter elsewhere;
// the menu hint shows "⌘" (the Mac command symbol) or "Ctrl" accordingly. Detection is best-effort and static
// (the platform doesn't change mid-session): prefer the modern userAgentData.platform,
// fall back to navigator.platform, then the UA string.
const plat = (() => {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
})();

export const isMac = /Mac|iPhone|iPad|iPod/i.test(plat);
// The label shown in the kbd pill for the Cmd/Ctrl modifier.
export const cmdLabel = isMac ? "⌘" : "Ctrl";
