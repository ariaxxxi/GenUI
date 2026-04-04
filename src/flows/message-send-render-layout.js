import { measureSuccessToastGeometry, ensureMeasureLayer } from "../shared/flow-toast.js";
import { clamp } from "../utils.js";

const TOP = 10;
const BOTTOM = 10;
const CONTROLS_LIFT = 78;
const MIN_H = 100;
const MAX_H = 400;
const COMPOSE_FIELD_BOTTOM = 408;
const COMPOSE_FIELD_W = 307;
const COMPOSE_FIELD_H = 96;
const COMPOSE_FIELD_MAX_W = 420;
const COMPOSE_FIELD_ACTIVE_H = 94;
const COMPOSE_FIELD_MAX_H = 220;
const COMPOSE_FIELD_SIDE_PADDING = 28;
const CONFIRM_AWAIT_ORB_SIZE = 44;
const CONFIRM_AWAIT_ORB_GAP = 16;
const CONFIRM_AWAIT_ORB_SHIFT = CONFIRM_AWAIT_ORB_SIZE + CONFIRM_AWAIT_ORB_GAP;
const BOTTOM_ALIGN_STAGE_H = 420;
const DISAMBIGUATION_ORB_SCALE = 0.625;
const DISAMBIGUATION_ENTER_MS = 800;
const CONFIRM_TO_SENDING_MS = 600;

export function createMessageSendRenderLayout({
  document,
  SHAPES,
  C,
  GS,
  getFlow,
}) {
  let lastContentHeight = 180;
  const heightByState = { [GS.COMPOSE]: 240, [GS.CONFIRM]: 180 };

  function glassStateShape(state) {
    if (state === GS.IDLE) return "listening";
    if (state === GS.THINKING || state === GS.SENDING) return "magic";
    if (state === GS.DISAMBIGUATE) return "listening";
    if (state === GS.COMPOSE || state === GS.CONFIRM) return "card-form";
    if (state === GS.SENT) return "pill";
    return "circle";
  }

  function isConfirmToSendTransition(flow = getFlow()) {
    return !!(flow?.active && flow.sentTransitionActive && flow.state === GS.SENDING);
  }

  function isCardState(state = getFlow().state) {
    return state === GS.CONFIRM;
  }

  function dynamicGeo(shape, contentHeightPx) {
    const base = SHAPES[shape] || SHAPES.card;
    const shellHeight = clamp(Math.round(contentHeightPx + TOP + BOTTOM), MIN_H, MAX_H);
    const controlsLift = shape === "card" ? CONTROLS_LIFT : 0;
    return { ...base, main: { ...base.main, h: shellHeight, ty: -(shellHeight / 2) - controlsLift } };
  }

  function measureComposeFieldWidth(hasText) {
    const flow = getFlow();
    const value = flow.state === GS.CONFIRM
      ? String(flow.msg || "").trim()
      : String(flow.composeText || "").trim();
    if (!hasText) return COMPOSE_FIELD_W;

    const sample = value || "Speak your message...";
    const lines = sample.split(/\r?\n/).filter(Boolean);
    if (!measureComposeFieldWidth._ctx) {
      const canvas = document.createElement("canvas");
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return COMPOSE_FIELD_W;
      ctx2d.font = "500 24px 'DM Sans'";
      measureComposeFieldWidth._canvas = canvas;
      measureComposeFieldWidth._ctx = ctx2d;
    }
    const ctx2d = measureComposeFieldWidth._ctx;
    const widestLine = Math.max(
      ...lines.map((line) => Math.ceil(ctx2d.measureText(line).width)),
      0,
    );
    return clamp(
      Math.ceil(widestLine + COMPOSE_FIELD_SIDE_PADDING),
      COMPOSE_FIELD_W,
      COMPOSE_FIELD_MAX_W,
    );
  }

  function measureComposeFieldHeight(hasText, targetWidth = COMPOSE_FIELD_W) {
    const baseMin = hasText ? COMPOSE_FIELD_ACTIVE_H : COMPOSE_FIELD_H;
    const field = C.rich.querySelector("[data-compose-field]");
    if (!field) return baseMin;
    const measure = (node) => Math.ceil(Math.max(
      node?.getBoundingClientRect?.().height || 0,
      node?.offsetHeight || 0,
      node?.scrollHeight || 0,
    ));
    const measureWidth = clamp(Math.round(targetWidth || COMPOSE_FIELD_W), COMPOSE_FIELD_W, COMPOSE_FIELD_MAX_W);
    const layer = ensureMeasureLayer("glass-compose-field-measure");
    layer.style.width = `${measureWidth}px`;
    layer.innerHTML = field.outerHTML;
    const probe = layer.querySelector("[data-compose-field]");
    probe?.classList.remove("g-compose-field-magic-pending");
    const measured = measure(probe) || measure(field);
    if (!measured) return baseMin;
    return clamp(measured, baseMin, COMPOSE_FIELD_MAX_H);
  }

  function composeGeo() {
    const flow = getFlow();
    const showAwaitOrb = flow.state === GS.CONFIRM || (flow.state === GS.COMPOSE && !!flow.composeChipMagicOrbActive);
    const hasText = flow.state === GS.CONFIRM
      ? !!String(flow.msg || "").trim()
      : !!String(flow.composeText || "").trim();
    const w = measureComposeFieldWidth(hasText);
    const h = measureComposeFieldHeight(hasText, w);
    const bottom = COMPOSE_FIELD_BOTTOM - (showAwaitOrb ? CONFIRM_AWAIT_ORB_SHIFT : 0);
    return {
      ...SHAPES["card-form"],
      main: {
        ...(SHAPES["card-form"]?.main || {}),
        w,
        h,
        br: "30px",
        tx: -Math.round(w / 2),
        ty: Math.round(bottom - BOTTOM_ALIGN_STAGE_H - (h / 2)),
        op: 1,
      },
      left: { ...(SHAPES["card-form"]?.left || {}), op: 0 },
      right: { ...(SHAPES["card-form"]?.right || {}), op: 0 },
    };
  }

  function sentGeo() {
    return measureSuccessToastGeometry({
      richRoot: C.rich,
      pillShape: SHAPES.pill || SHAPES.card,
      fallbackLabel: "Message sent",
    });
  }

  function contentHeightPx() {
    const measure = (node) => node ? Math.ceil(Math.max(node.getBoundingClientRect().height || 0, node.offsetHeight || 0, node.scrollHeight || 0)) : 0;
    const layer = ensureMeasureLayer("glass-measure-layer");
    layer.innerHTML = C.rich.innerHTML;
    let raw = measure(layer.querySelector("[data-glass-body]"));
    if (raw <= 0) raw = measure(C.rich.querySelector("[data-glass-body]"));
    const flow = getFlow();
    if (raw > 0) {
      const resolved = clamp(raw, 60, MAX_H - TOP - BOTTOM);
      lastContentHeight = resolved;
      if (isCardState(flow.state)) heightByState[flow.state] = resolved;
      return resolved;
    }
    if (isCardState(flow.state) && Number.isFinite(heightByState[flow.state])) return clamp(heightByState[flow.state], 60, MAX_H - TOP - BOTTOM);
    return clamp(lastContentHeight, 60, MAX_H - TOP - BOTTOM);
  }

  function disambiguationGeo() {
    const base = SHAPES.listening?.main || SHAPES.circle?.main || {};
    const baseW = Number(base.w) || 80;
    const baseH = Number(base.h) || 80;
    const nextW = Math.round(baseW * DISAMBIGUATION_ORB_SCALE);
    const nextH = Math.round(baseH * DISAMBIGUATION_ORB_SCALE);
    const baseTx = Number(base.tx) || -(baseW / 2);
    const baseTy = Number(base.ty) || -(baseH / 2);
    return {
      ...SHAPES.listening,
      main: {
        ...(SHAPES.listening?.main || {}),
        w: nextW,
        h: nextH,
        br: `${Math.round(nextW / 2)}px`,
        tx: Math.round(baseTx + ((baseW - nextW) / 2)),
        ty: Math.round(baseTy + ((baseH - nextH) / 2)),
        op: 1,
      },
      left: { ...(SHAPES.listening?.left || {}), op: 0 },
      right: { ...(SHAPES.listening?.right || {}), op: 0 },
    };
  }

  return {
    COMPOSE_FIELD_W,
    CONFIRM_TO_SENDING_MS,
    DISAMBIGUATION_ENTER_MS,
    composeGeo,
    contentHeightPx,
    disambiguationGeo,
    dynamicGeo,
    glassStateShape,
    isConfirmToSendTransition,
    measureComposeFieldWidth,
    sentGeo,
  };
}
