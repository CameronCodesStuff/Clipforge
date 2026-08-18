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
2. Open Command Prompt and navigate into the folder:
   ```
   cd C:\Users\you\clipforge
   ```
3. Install dependencies (only needed once, takes a few minutes):
   ```
   npm install
   ```
4. Launch the app in development mode:
   ```
   npm run dev
   ```
   A window should open with the editor. Leave the Command Prompt window
   open in the background — closing it closes the app while in dev mode.

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

Once you're happy with the app, you can package it into a proper installer
so you don't need to run `npm run dev` every time:

```
npm run build
```

This produces an installer in the `release` folder (e.g.
`ClipForge Setup 0.1.0.exe`). Run that installer and ClipForge will show up
as a normal Windows app you can launch from the Start Menu.

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
