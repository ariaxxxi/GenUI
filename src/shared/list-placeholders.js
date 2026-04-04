export function defaultListPlaceholderLabel(index = 0) {
  return `List item ${Number(index) + 1}`;
}

export function defaultListPlaceholderLabels(count = 3) {
  const total = Math.max(0, Number(count) || 0);
  return Array.from({ length: total }, (_, index) => defaultListPlaceholderLabel(index));
}
