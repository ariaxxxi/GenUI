# Echo player integration

`motion-ai-echo.html` is the only runtime file to copy. It contains the renderer, eight authored Echo presets, each preset's full Effects, CSS, and font. Double-click it for offline review, or serve it with your prototype. The original JSON is preserved in the repository; thumbnails are omitted from the runtime. Big is the only supported View. No editor, installation, CDN, audio permission, or network request is required.

Embed it as an isolated iframe. `embed=1` hides the preset selector and voice-level controls:

```html
<iframe id="ai" src="./motion-ai-echo.html?embed=1"
  title="AI assistant" style="width:100%;height:640px;border:0"></iframe>
<script>
  const frame = document.querySelector('#ai');
  frame.addEventListener('load', () => {
    const ai = frame.contentWindow.MotionAI;
    ai.setState('thinking');
    ai.setVoiceLevel(0.7);
  });
</script>
```

Serve the iframe and prototype from the same origin to access this JavaScript API. `window.MotionAI` is also available when the file runs directly. `presets` lists all eight immutable `{id, state, label}` records. `setPreset(id)` selects an exact look. `setState(state)` selects the first matching record in the supplied bundle; there are two Listening looks, so use their preset IDs to choose Metaball or Glow explicitly. The bundle contains no Pathfinding look; unsupported states/IDs throw rather than substituting an invented preset. `options` returns the requested preset and voice level. Preset changes retain the existing animation owners and restore that preset's Effects.

`setVoiceLevel(number)` accepts a finite input and clamps it to 0–1. Zero is resting mouth geometry. Feed your prototype's audio/voice intensity or use the review slider; the file does not request a microphone or speak. Reduced-motion preferences are respected. The demo defaults to Idle. Big retains authored physical geometry, so allocate enough iframe space for the form and its status line (the example uses 640px height).

Build from canonical sources with `npm run component:build`; regular production/Pages builds generate the same file. The HTML metadata records source revision and the supplied JSON's SHA-256. Repository `DEV_BIBLE.md` is the current product handoff.
