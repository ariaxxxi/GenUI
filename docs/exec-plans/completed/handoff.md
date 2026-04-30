# Completed Handoff

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
