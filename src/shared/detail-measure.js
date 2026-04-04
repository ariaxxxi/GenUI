const DETAIL_MEASURE_STYLE = "position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;white-space:normal;word-break:break-word;font-family:'DM Sans', sans-serif;font-weight:300;";

export function createDetailMeasureEl(documentRef = document) {
  const detailMeasureEl = documentRef.createElement('div');
  detailMeasureEl.style.cssText = DETAIL_MEASURE_STYLE;
  documentRef.body.appendChild(detailMeasureEl);
  return detailMeasureEl;
}
