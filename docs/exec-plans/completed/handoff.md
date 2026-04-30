# Completed Handoff

## 2026-04-30 - Bubble agent-tab control defaults

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added set-specific Bubble Home control defaults so the `agent` tab now turns both toggles on by default, while the `app` tab keeps both toggles off by default.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final set-switch feel and toggle sync still need a human check on `/bubble`.

## 2026-04-30 - Bubble canvas-removal toggle

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added a Bubble Home control-panel toggle that removes the visible `420px` canvas frame and switches the viewport background to pure black without changing the existing Bubble Home geometry or interaction logic.
- Files changed: `bubble.html`, `src/styles/bubble-page.css`, `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final canvasless framing and panel contrast still need a human check on `/bubble`.

## 2026-04-30 - Bubble press-scope toggle

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added a Bubble Home control-panel toggle that switches press/pan start between canvas-only and viewport-anywhere modes, with the control panel excluded from viewport-start behavior.
- Files changed: `bubble.html`, `src/styles/bubble-page.css`, `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final control-panel exclusion and viewport-start feel still need a human check on `/bubble`.

## 2026-04-30 - Bubble Claude scale parity with Spotify slot

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: confirmed the requested app-slot mapping was already in place for the Bubble Home `agent` set, then removed Claude’s local `imageScale: 0.82` override so it matches the Spotify slot’s full-scale image behavior instead of rendering smaller inside the same slot.
- Files changed: `src/bubble-page.js`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so if Claude still looks smaller on `/bubble`, the remaining cause would be padding baked into `assets/agents/Claude-ai-icon.png`.

## 2026-04-30 - Bubble domain pill gap reduction

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reduced the domain-agent image-to-text gap by `4px` in the Bubble Home `agent` set by moving the pill copy block left from `-8px` to `-12px` on the four domain pills.
- Files changed: `src/bubble-page.js`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final domain pill gap still needs a human check on `/bubble`.

## 2026-04-30 - Bubble domain layout, shell-color, and uncropped-image cleanup

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: restored strict app-slot layout inheritance for the Bubble Home `agent` set, rethemed the four domain shells to match their blue/green/orange/yellow artwork, and disabled circular masking for those domain images in both the field bubble and promoted home orb.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final shell-color feel and uncropped domain-image framing still need a human check on `/bubble`.

## 2026-04-30 - Bubble domain agent image replacement

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: replaced the Travel, Fitness, Budget, and Writing emoji graphics in the Bubble Home `agent` set with the requested `assets/agents` images while preserving the existing pill-expansion and promotion behavior.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final contained-image scale and home-orb appearance still need a human check on `/bubble`.

## 2026-04-30 - Bubble pill title and subtitle size increase

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: increased Bubble Home top-level pill copy to `20px` titles and `18px` subtitles, and updated the pill width measurement plus CSS fallbacks so the render and sizing paths stay aligned.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final pill fit still needs a human check on `/bubble`.

## 2026-04-30 - Bubble Claude and ChatGPT slot swap

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: swapped the Claude and ChatGPT inherited slot positions inside the Bubble Home `agent` set without changing any other agent bubble content or interactions.
- Files changed: `src/bubble-page.js`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final visual balance still needs a human check on `/bubble`.

## 2026-04-30 - Bubble agent set app-layout inheritance

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: removed the custom `agent`-set slot geometry overrides and made the retained agent bubbles inherit the `app` set slot positions plus default field sizing, so both sets now share the same layout and depth-scaling logic.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final visual balance of Claude and the four domain pills still needs a human check on `/bubble`.

## 2026-04-30 - Bubble agent pill gap reduction

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reduced the emoji-to-text gap in the four `agent`-set domain pills by `4px` by moving the pill copy block leftward, without changing pill width logic.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final agent-pill spacing still needs a human check on `/bubble`.

## 2026-04-30 - Bubble domain size restore to 80

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: changed the four `agent`-set domain bubbles from `72px` back to `80px`, including their field-size caps, without changing their interactions.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final domain-bubble balance still needs a human check on `/bubble`.

## 2026-04-30 - Bubble final promotion frame alignment

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: delayed swap commit until after rendering the `progress = 1` promotion frame, so promoted bubble images can match the final home-orb size before handoff instead of snapping slightly larger at commit.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final travel-to-home size match still needs a human check on `/bubble`.

## 2026-04-30 - Bubble Claude promotion size compensation

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: compensated image-based promotion end scale for filled image bubbles, so Claude keeps its reduced field `imageScale` without shrinking too much during travel into the home orb.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final Claude promotion sizing still needs a human check on `/bubble`.

## 2026-04-30 - Bubble Claude-only home-orb mask

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: removed the global promoted-home circular image mask and made that crop apply only when the promoted home-orb image is Claude.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final promoted-home image treatment still needs a human check on `/bubble`.

## 2026-04-30 - Bubble pill width path simplification

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: removed the DOM-based pill width measurement path and restored the deterministic shared text-width formula, because the live DOM measurement was producing unstable widths across the `app` and `agent` sets.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final pill fit in both sets still needs a human check on `/bubble`.

## 2026-04-30 - Bubble home-orb icon mask restore

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: restored the circular mask on promoted home-orb center images by reapplying the rounded crop to the promoted-home center shell and image.
- Files changed: `src/styles/bubble-page.css`
- Validation performed: `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final promoted-home crop still needs a human check on `/bubble`.

## 2026-04-30 - Bubble field orb overlap prevention

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added a dedicated field-layout clearance pass against the home orb, so open-field bubbles are pushed off the orb during panning instead of being allowed to overlap it.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final orb-clearance distance still needs a human check on `/bubble`.

## 2026-04-30 - Bubble pill measurement scale normalization

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: fixed the shared pill width measurement to normalize rendered text widths back to the base `18px`/`16px` copy size before computing pill width, so inverse-scaled field text no longer produces oversized pills in the `app` set.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final app-pill fit still needs a human check on `/bubble`.

## 2026-04-30 - Bubble agent pill gap increase

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: increased the emoji-to-text gap in the four `agent`-set domain pills by `8px` by moving the pill copy block rightward, without changing pill width measurement or padding rules.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final agent-pill spacing still needs a human check on `/bubble`.

## 2026-04-30 - Bubble app pill right-padding reduction

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reduced the shared no-action pill right padding from `64px` to `24px`, which tightens the `app`-set pills without changing the `agent` pills that already use explicit per-slot padding.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final app-pill fit still needs a human check on `/bubble`.

## 2026-04-30 - Bubble domain pill right-padding reduction

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reduced the explicit right padding on the four domain-agent pills from `26px` to `18px`, without changing their interaction or measurement logic.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final pill fit still needs a human check on `/bubble`.

## 2026-04-30 - Bubble pill width measurement fix

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: fixed the domain-pill width measurement to size from the actual rendered title/subtitle line widths plus the current paddings, instead of reading a stretched pill-copy container width.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final pill fit still needs a human check on `/bubble`.

## 2026-04-30 - Bubble domain x-axis tighten

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: moved Travel and Fitness `20px` toward center on the x-axis, and moved Budget and Writing `10px` toward center, without changing any styling or interaction behavior.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final domain-bubble spacing still needs a human check on `/bubble`.

## 2026-04-30 - Bubble Claude slot size increase

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: increased the `agent`-set Claude bubble at the top-center slot from the shared default diameter to an explicit `120px` base size and matching field cap, without changing its interaction behavior.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final Claude-to-neighbor spacing still needs a human check on `/bubble`.

## 2026-04-30 - Bubble domain pill text-width measurement

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: changed domain-pill sizing to measure the rendered title/subtitle block from the DOM, so each expanded pill now grows or shrinks with its actual text length instead of relying on one shared estimated width.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final pill widths still need a human check on `/bubble`.

## 2026-04-30 - Bubble open-state neutral focus and agent relayout

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: removed the automatic Claude-biased field focus on initial long-press so no bubble is auto-favored before the pointer moves, moved ChatGPT `30px` right and Gemini `30px` left, and shifted all four domain bubbles `40px` downward in the `agent` set.
- Files changed: `src/bubble-page.js`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the new open-state neutrality and updated cluster spacing still need a human check on `/bubble`.

## 2026-04-30 - Bubble emoji size ratio

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: changed field-bubble emoji sizing from a fixed pixel value to a bubble-relative size, and the current emoji ratio is `0.6` of each bubble’s base diameter.
- Follow-up adjustment: expanded pill subtitle measurement and live subtitle scaling now both use `16px`, and expanded pills auto-pan with extra viewport padding so the full pill stays inside the visible canvas.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the final emoji balance on `/bubble` still needs a human check.

## 2026-04-30 - Bubble domain base-size alignment

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: changed the four `agent`-set domain bubbles from a shared undersized base to position-matched base diameters, so they render at their intended field sizes without relying on visible scale-up from their slot positions.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the new base-size read and emoji balance still need a human check on `/bubble`.

## 2026-04-30 - Bubble pill repels home orb

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: expanded top-level pills now push the home orb away using the same pill-repulsion geometry already applied to field bubbles, so the orb no longer stays fixed underneath an opened pill.
- Follow-up adjustment: the home orb now uses a larger dedicated pill-clearance gap than regular field bubbles, so it gets pushed farther and avoids shell overlap with expanded pills.
- Follow-up adjustment: when a promoted release starts while the orb is pushed away, the demoting previous home orb now keeps that release-position offset during its fade-out instead of snapping back to center first.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact repulsion distance and settle feel still need a human check on `/bubble`.

## 2026-04-30 - Bubble promotion glitch and demotion cleanup

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: fixed the domain-agent promotion gate so Travel/Fitness/Budget/Writing can fire on hover-and-release, stripped pill metadata from demoted home-orb bubbles so Bixby returns to the field as a plain round bubble, and delayed the demoted-slot write until after the reset frame to reduce the previous-image blink at home handoff.
- Follow-up adjustment: the home orb now remounts a fresh center-content DOM at swap commit before syncing the promoted content, so stale previous-icon switch state cannot flash for a frame at arrival.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the home-orb blink fix and the Travel/Fitness release behavior still need a human check on `/bubble`.

## 2026-04-30 - Bubble domain promotion continuity

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: updated domain-agent promotion so the hovered pill now promotes from its actual `0.8` hovered emoji-group scale, while the same shell collapses smoothly back from pill width to a circle on its way into the home orb.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact collapse timing and final visual continuity on `/bubble` still need a human check.

## 2026-04-30 - Bubble domain geometry tighten

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reduced the four `agent`-set domain bubbles to `72px` and lowered them so they sit closer to the larger bubbles beneath them, without changing shell styling or interaction behavior.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact spacing still needs a human check on `/bubble`.

## 2026-04-29 - Bubble agent set remap

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: replaced the scaffold `agent` set clone with a distinct 7-bubble agent collection, added emoji-centered field bubble rendering for Fitness/Budget/Writing, and split hover-pill capability from the existing app pill path so those domain agents stay round at rest and expand into `XX agent` pills on hover.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact emoji sizing, Claude logo fit, and round-to-pill hover feel on `/bubble` still need a human check.

## 2026-04-29 - Bubble agent-set shell and promotion follow-up

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: changed the former Perplexity slot into `Travel agent`, gave the domain-agent bubbles a quiet default shell that expands into the full Celestial hover pill, and allowed `Claude` to promote in the `agent` set while also increasing its center-logo scale.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the pill-expansion alignment and Claude’s visual scale still need a human check.

## 2026-04-29 - Bubble set switcher left docking

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: docked the Bubble Home content-set switcher to the left side of the viewport on desktop while keeping the bubble canvas centered and preserving the stacked mobile layout.
- Files changed: `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact desktop spacing and left-edge placement on `/bubble` still need a human check.

## 2026-04-29 - Bubble content set switcher scaffold

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: replaced Bubble Home’s single hardcoded bubble collection with scalable named set definitions, added a left-side `App`/`Agent` switcher panel, and duplicated the current content into the new `agent` set so future set additions can stay data-driven.
- Files changed: `bubble.html`, `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact left-panel layout and `App`/`Agent` switching behavior on `/bubble` still need a human check.

## 2026-04-29 - Bubble health promotion disable

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added health to Bubble Home’s non-promotable bubble set so hovering health can still highlight, but releasing it no longer fires the home-orb promotion swap, matching the profile-pill behavior.
- Files changed: `src/bubble-page.js`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact health hover-and-release behavior on `/bubble` still needs a human check.

## 2026-04-29 - Prototype custom thinking text fire control

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: added a `Custom Text` input plus `Fire` button to the prototype AI Debug panel and wired it to the existing thinking-stream typing path so user-entered text can interrupt the current loop and stream once without changing the active `thinking`, `skill`, `agent`, or `app` visual state.
- Files changed: `index.html`, `src/tool/modules/manual-bindings.js`, `src/styles/editor-sidebar.css`, `docs/FRONTEND.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/tool/modules/manual-bindings.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in this turn, so the exact feel of custom fire behavior in `/prototype` still needs a manual check across `thinking`, `skill`, `agent`, and `app`.

## 2026-04-29 - Bubble release motion continuity

- Completion status: completed with static verification; manual browser pass still recommended.
- Summary: reworked Bubble Home release-on-hover promotion so the selected promotable round bubble remains the visual owner of the promoted motion, keeps its hover shell mounted through release, and shrinks continuously into the final home-orb state without a separate promoted-shell restart.
- Follow-up adjustment: round top-level bubble hover now shrinks visible content to `0.8`, and the hover scale-down transition duration is longer for a softer settle before release.
- Follow-up adjustment: pill-shaped top-level bubble hover now scales the leading bubble-plus-badge group down to `0.8` over `420ms` around the group center, while preserving the existing pill text expansion behavior.
- Follow-up adjustment: the demoted previous home orb now starts from its current pressed size and shrinks/fades out in place as another bubble is released, instead of glitching larger or flying across the field at swap start.
- Follow-up adjustment: orb-shell chrome on hovered/promoting round bubbles and the home orb now uses stable unscaled geometry during swap motion so the shell does not disappear and respawn mid-release.
- Follow-up adjustment: after the promotion commit, field bubbles now snap hidden for one reset frame so the demoted content does not reuse the selected field node for a visible second pass or late fly-in.
- Follow-up adjustment: the home orb visual now also snaps to its final scale on that reset frame, preventing a post-arrival shrink/grow rebound after the promoted bubble reaches home.
- Follow-up adjustment: committed promoted home orbs now keep a rounded center-image mask and static shell treatment, preventing the final handoff from blinking to a brighter shell or squarer icon shape.
- Files changed: `src/bubble-page.js`, `src/styles/bubble-page.css`, `docs/product-specs/bubble-home.md`, `docs/exec-plans/active/current.md`, `docs/exec-plans/completed/handoff.md`
- Validation performed: `node --check src/bubble-page.js`; `git diff --check`
- Remaining caveats: I did not run an interactive browser pass in that turn, so the exact continuity feel at release and the final handoff into the idle home orb still need a human check on `/bubble`.
