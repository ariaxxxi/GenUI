# GenUI

Single-file generative UI prototype tool for designers with two modes: manual prototyping and AI preview.

## Run

```bash
npm run start
```

Open `http://localhost:5173`.

## Current Workflow

- Create, duplicate, and delete scenarios in the sidebar.
- Edit scenario name, future AI trigger phrases, shape, icon, and text content.
- Tune icon, primary, secondary, and detail text size and color per scenario.
- Upload a PNG to replace the default emoji icon.
- Toggle the blurred background image on or off.
- Switch between Manual mode and AI mode from the Canvas section.
- In AI mode, use input + stage override (`Auto`, `Dot`, `Pill`, `Card`) for preview generation.
- Scenario data, canvas settings, mode, and AI stage override persist in browser `localStorage`.

## Architecture Notes

- Rendering is driven by a normalized scenario object with `shape`, `content`, and `triggers`.
- Rendering is shared between manual and AI paths through the same scenario format.
- AI mode currently uses a frontend Gauss adapter stub (placeholder for real API integration) and falls back to manual matching on AI errors.
- The Node server remains available for local hosting and future provider integrations.
