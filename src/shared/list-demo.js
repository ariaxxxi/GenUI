export const DEMO_LIST = [
  { icon: "🌤", primary: "21°  Sunny", secondary: "San Francisco" },
  { icon: "✉", primary: "New Message", secondary: "Alice · Want to meet?" },
  { icon: "⏱", primary: "Timer", secondary: "10 minutes remaining" },
];

function demoIcon(value = "") {
  const text = String(value || "").trim();
  return text ? { kind: "emoji", value: text } : { kind: "none", value: "" };
}

export function demoListToRenderContent(items = DEMO_LIST) {
  const resolvedItems = Array.isArray(items) && items.length ? items : DEMO_LIST;
  const firstItem = resolvedItems[0] || {};
  return {
    icon: demoIcon(firstItem.icon),
    primary: String(firstItem.primary || "").trim(),
    secondary: String(firstItem.secondary || "").trim(),
    detail: "",
    listItems: resolvedItems.map((item) => ({
      label: String(item?.primary || "").trim(),
      subtitle: String(item?.secondary || "").trim(),
      icon: demoIcon(item?.icon),
    })),
  };
}

export function selectListItem(target) {
  const pills = Array.from(document.querySelectorAll("#list-pills .g-disambiguation-pill"));
  if (!pills.length) return;
  const next = typeof target === "number"
    ? pills[target] || null
    : target?.closest?.(".g-disambiguation-pill") || null;
  pills.forEach((pill) => pill.classList.toggle("selected", pill === next));
}

export function clearListPills() {
  const wrap = document.getElementById("list-pills");
  if (!wrap) return;
  wrap.innerHTML = "";
  wrap.style.pointerEvents = "none";
  wrap.style.opacity = "";
  wrap.style.transition = "";
  wrap.dataset.collapsing = "";
  wrap.dataset.active = "";
}

export function collapseListStack(ms = 600) {
  const wrap = document.getElementById("list-pills");
  if (!wrap) return;
  const cluster = wrap.querySelector(".g-disambiguation-pills");
  if (!cluster) {
    clearListPills();
    return;
  }
  if (wrap.dataset.collapsing === "1") return;
  wrap.dataset.collapsing = "1";
  cluster.classList.remove("entering", "settled");
  cluster.classList.add("exiting-to-compose");
  setTimeout(() => {
    clearListPills();
  }, Math.max(220, ms) + 40);
}
