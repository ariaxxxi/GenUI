# Completed Handoff

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
