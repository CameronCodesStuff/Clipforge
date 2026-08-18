import React, { useState } from 'react';
import { useStore } from '../store/timelineStore.js';

export default function Toolbar() {
  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const addTrack = useStore((s) => s.addTrack);
  const tracks = useStore((s) => s.tracks);
  const addTextClip = useStore((s) => s.addTextClip);
  const playhead = useStore((s) => s.playhead);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const fps = useStore((s) => s.fps);
  const serializeProject = useStore((s) => s.serializeProject);
  const loadProject = useStore((s) => s.loadProject);

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  const handleAddText = () => {
    const textTrack = tracks.find((t) => t.type === 'text') || tracks[0];
    addTextClip(textTrack.id, playhead);
  };

  const handleSave = async () => {
    const json = serializeProject();
    const savedPath = await window.clipforge.saveProject(json);
    if (savedPath) setStatusMsg(`Saved: ${savedPath}`);
  };

  const handleLoad = async () => {
    const json = await window.clipforge.loadProject();
    if (json) {
      loadProject(json);
      setStatusMsg('Project loaded');
    }
  };

  const handleExport = async () => {
    const outputPath = await window.clipforge.selectExportPath();
    if (!outputPath) return;

    const state = useStore.getState();
    let maxEnd = 5;
    for (const t of state.tracks) for (const c of t.clips) maxEnd = Math.max(maxEnd, c.startTime + c.duration);

    const project = {
      width: state.width,
      height: state.height,
      fps: state.fps,
      duration: maxEnd,
      outputPath,
      tracks: state.tracks
    };

    setExporting(true);
    setProgress(0);
    setStatusMsg('Rendering...');
    const unsubscribe = window.clipforge.onExportProgress((p) => setProgress(p));

    const result = await window.clipforge.exportVideo(project);
    unsubscribe();
    setExporting(false);

    if (result.ok) {
      setStatusMsg(`Exported to ${result.outputPath}`);
    } else {
      setStatusMsg(`Export failed: ${result.error}`);
      console.error(result.error);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={() => addTrack('video')}>+ Video Track</button>
        <button onClick={() => addTrack('audio')}>+ Audio Track</button>
        <button onClick={handleAddText}>+ Text</button>
      </div>
      <div className="toolbar-group">
        <span className="brand">ClipForge</span>
      </div>
      <div className="toolbar-group">
        <button onClick={handleLoad}>Open Project</button>
        <button onClick={handleSave}>Save Project</button>
        <button className="export-btn" onClick={handleExport} disabled={exporting}>
          {exporting ? `Exporting ${progress}%` : 'Export MP4'}
        </button>
      </div>
      {statusMsg && <div className="status-msg">{statusMsg}</div>}
    </div>
  );
}
