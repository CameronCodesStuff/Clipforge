# ClipForge

A free, open-source multi-track video editor for Windows — trim, arrange clips
on multiple tracks, add text overlays, apply filters, crossfade transitions,
and export to MP4. Built with Electron + React, rendered with ffmpeg.

You own all of this code. No subscriptions, no watermarks, no cloud upload.

## What you need before you start

1. **Node.js** (this gives you `npm`, which installs and runs the app)
   - Go to https://nodejs.org
   - Download the **LTS** version and run the installer (click Next through
     all the defaults)
   - Confirm it worked: open **Command Prompt** (search "cmd" in the Start
     Menu) and type:
     ```
     node -v
     ```
     You should see a version number like `v20.x.x`.

That's it — everything else (Electron, ffmpeg, React) installs automatically
in the next step.

## First-time setup

1. Unzip the `clipforge` folder somewhere easy to find, e.g. `C:\Users\you\clipforge`.
2. That's it for setup — you don't need to open Command Prompt. Use one of
   the two scripts below depending on what you want.

## Option A: Just try it out (quickest)

Double-click **`launch-clipforge.bat`**.

First run installs everything automatically (a few minutes, one-time), then
opens the editor. Every run after that opens instantly. Closing the black
console window that appears also closes the app — that's expected, it's
just showing you progress/logs.

## Option B: Install it as a real Windows app (recommended once you like it)

Double-click **`build-installer.bat`**.

This installs dependencies (if needed) and packages ClipForge into a proper
Windows installer. When it finishes, a folder named `release` opens
automatically — inside it, run:

```
ClipForge Setup 0.1.0.exe
```

That gives you a normal Windows install: pick an install folder, get a
Start Menu entry and desktop shortcut, and an uninstaller listed in
"Add or remove programs." From then on you launch ClipForge like any other
app — no more `.bat` files or console windows.

## Using the editor

- **Import** — top-left panel, click "Import" and choose video/audio/image files.
- **Add to timeline** — click a media item in the list; it's appended to the
  end of the matching track (video → first video track, audio → music track).
- **Move a clip** — drag it left/right on the timeline.
- **Trim a clip** — drag its left or right edge.
- **Delete a clip** — double-click it.
- **Select a clip** — click it once; the right-hand panel shows its controls
  (filters + crossfade for video, text styling for text clips).
- **Add text** — toolbar → "+ Text", then edit content/size/color/position
  in the right panel.
- **Playhead** — click anywhere on the timeline ruler/track area to jump there;
  the play button in the preview panel plays from that point.
- **Save/Open Project** — toolbar buttons, saves a `.json` project file you
  can reopen later (media files must stay in the same location on disk).
- **Export** — toolbar → "Export MP4", choose where to save, and watch the
  progress percentage. This runs a real ffmpeg render, so a long/high-res
  timeline can take a while — that's expected.

Note: the preview shows transitions as a hard cut for performance reasons;
the **exported MP4** renders true crossfades.

## Building a standalone Windows .exe (optional)

Covered above in **Option B** — just double-click `build-installer.bat`.
If you prefer doing it manually from Command Prompt instead, the equivalent
commands are `npm install` then `npm run build`.

## How it's built (if you want to extend it)

- `electron/main.js` — the app window, file-open/save dialogs, IPC.
- `electron/ffmpegExport.js` — builds the ffmpeg filter graph (scaling,
  color filters, crossfade transitions via `xfade`, text via `drawtext`,
  audio mixing) and runs the actual export. This is the "rendering engine."
- `src/store/timelineStore.js` — all editor state (tracks, clips, playhead)
  using Zustand.
- `src/components/` — UI: MediaLibrary, PreviewPlayer, Timeline,
  PropertiesPanel, Toolbar.

Natural next features to add: drag-and-drop from the media library straight
onto a specific timeline position, ripple trim, keyframed filter values,
waveform display on audio clips, more transition types (wipe, slide) by
swapping the `xfade` transition name in `ffmpegExport.js`.

## Troubleshooting

- **Text doesn't appear in the exported video**: `drawtext` needs a font
  file. The code points at `C:\Windows\Fonts\arial.ttf` by default, which
  should exist on any Windows machine. If you renamed/removed that font,
  edit `DEFAULT_FONT` in `electron/ffmpegExport.js` to point at another
  `.ttf` file.
- **`npm install` fails**: make sure you're on a recent Node.js LTS (18+),
  and that you have a working internet connection — it needs to download
  packages including a bundled copy of ffmpeg.
- **Export is slow**: this is normal for CPU-based encoding, especially at
  1080p+. Lower the project resolution in `timelineStore.js` (`width`/`height`
  defaults) for faster drafts.
