# GenUI

Single-file generative UI prototype tool for designers. The current workflow is manual and edit-based: build a library of scenarios, edit icon/text content for `dot`, `pill`, and `card`, and preview the result instantly.

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
- Scenario data and canvas settings persist in browser `localStorage`.

## Architecture Notes

- Rendering is driven by a normalized scenario object with `shape`, `content`, and `triggers`.
- The app is currently in manual mode; future AI can plug into the same scenario format instead of calling rendering code directly.
- The small Node server remains available for local hosting and for future AI-route experiments, but the default UI no longer calls AI APIs.
