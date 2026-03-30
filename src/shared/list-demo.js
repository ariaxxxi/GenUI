export const DEMO_LIST = [
  { icon: "🌤", primary: "21°  Sunny", secondary: "San Francisco" },
  { icon: "✉", primary: "New Message", secondary: "Alice · Want to meet?" },
  { icon: "⏱", primary: "Timer", secondary: "10 minutes remaining" },
];

export const LIST_PILL_H = 120;
export const LIST_GAP = 12;
export const LIST_STEP = LIST_PILL_H + LIST_GAP;

let _selectedPill = null;

export function selectListItem(el) {
  _selectedPill?.classList.remove("selected");
  el.classList.add("selected");
  _selectedPill = el;
}

export function clearListPills() {
  _selectedPill = null;
  const wrap = document.getElementById("list-pills");
  if (!wrap) return;
  wrap.innerHTML = "";
  wrap.style.pointerEvents = "none";
  wrap.style.opacity = "";
  wrap.style.transition = "";
  wrap.dataset.collapsing = "";
}

export function collapseListStack(ms = 220) {
  const wrap = document.getElementById("list-pills");
  if (!wrap) return;
  if (!wrap.children.length) return void clearListPills();
  if (wrap.dataset.collapsing === "1") return;
  wrap.dataset.collapsing = "1";
  wrap.style.pointerEvents = "none";
  wrap.style.transition = `opacity ${ms}ms ease`;
  wrap.style.opacity = "0";
  setTimeout(clearListPills, ms + 30);
}

export function buildListPill(item, idx, items) {
  const el = document.createElement("div");
  el.className = "list-pill";
  el.style.zIndex = String(Math.max(1, items.length - idx));
  el.innerHTML = `<div class="list-pill-thumb">${item.icon || "◉"}</div><div class="list-pill-text"><div class="list-pill-primary">${item.primary || ""}</div><div class="list-pill-secondary">${item.secondary || ""}</div></div>`;
  el.addEventListener("click", () => selectListItem(el));
  return el;
}
