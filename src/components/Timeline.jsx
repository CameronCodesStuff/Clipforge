import React, { useRef } from 'react';
import { useStore } from '../store/timelineStore.js';

const TRACK_HEIGHT = 56;

function ClipBlock({ track, clip, pixelsPerSecond }) {
  const selectedClipId = useStore((s) => s.selectedClipId);
  const selectClip = useStore((s) => s.selectClip);
  const updateClip = useStore((s) => s.updateClip);
  const removeClip = useStore((s) => s.removeClip);
  const dragState = useRef(null);

  const left = clip.startTime * pixelsPerSecond;
  const w = Math.max(6, clip.duration * pixelsPerSecond);
  const isSelected = selectedClipId === clip.id;

  const onPointerDownMove = (e) => {
    e.stopPropagation();
    selectClip(clip.id);
    dragState.current = { mode: 'move', startX: e.clientX, origStart: clip.startTime };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerDownResize = (edge) => (e) => {
    e.stopPropagation();
    selectClip(clip.id);
    dragState.current = {
      mode: 'resize', edge, startX: e.clientX,
      origStart: clip.startTime, origDuration: clip.duration, origIn: clip.inPoint || 0
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e) => {
    const ds = dragState.current;
    if (!ds) return;
    const deltaSec = (e.clientX - ds.startX) / pixelsPerSecond;
    if (ds.mode === 'move') {
      updateClip(track.id, clip.id, { startTime: Math.max(0, ds.origStart + deltaSec) });
    } else if (ds.mode === 'resize' && ds.edge === 'right') {
      updateClip(track.id, clip.id, { duration: Math.max(0.2, ds.origDuration + deltaSec) });
    } else if (ds.mode === 'resize' && ds.edge === 'left') {
      const newDuration = Math.max(0.2, ds.origDuration - deltaSec);
      const newStart = Math.max(0, ds.origStart + (ds.origDuration - newDuration));
      const newIn = Math.max(0, ds.origIn + (ds.origDuration - newDuration));
      updateClip(track.id, clip.id, { startTime: newStart, duration: newDuration, inPoint: newIn });
    }
  };

  const onPointerUp = () => {
    dragState.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const label = clip.text ?? clip.srcPath?.split(/[\\/]/).pop() ?? 'clip';

  return (
    <div
      className={`clip-block clip-${track.type} ${isSelected ? 'selected' : ''}`}
      style={{ left, width: w }}
      onPointerDown={onPointerDownMove}
      onDoubleClick={() => removeClip(track.id, clip.id)}
      title={`${label} (double-click to delete)`}
    >
      <div className="clip-resize-handle left" onPointerDown={onPointerDownResize('left')} />
      <span className="clip-label">{label}</span>
      {clip.transition === 'crossfade' && <span className="clip-transition-badge">×fade</span>}
      <div className="clip-resize-handle right" onPointerDown={onPointerDownResize('right')} />
    </div>
  );
}

export default function Timeline() {
  const tracks = useStore((s) => s.tracks);
  const pixelsPerSecond = useStore((s) => s.pixelsPerSecond);
  const setZoom = useStore((s) => s.setZoom);
  const playhead = useStore((s) => s.playhead);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const duration = useStore((s) => s.duration);
  const rulerRef = useRef(null);

  const totalWidth = Math.max(800, (duration + 10) * pixelsPerSecond);

  const handleRulerClick = (e) => {
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + rulerRef.current.scrollLeft;
    setPlayhead(x / pixelsPerSecond);
  };

  return (
    <div className="panel timeline-panel">
      <div className="timeline-header">
        <span>Timeline</span>
        <div className="zoom-controls">
          <button onClick={() => setZoom(pixelsPerSecond - 20)}>−</button>
          <button onClick={() => setZoom(pixelsPerSecond + 20)}>+</button>
        </div>
      </div>
      <div className="timeline-scroll" ref={rulerRef} onClick={handleRulerClick}>
        <div className="timeline-content" style={{ width: totalWidth }}>
          <div className="playhead-line" style={{ left: playhead * pixelsPerSecond }} />
          {tracks.map((track) => (
            <div key={track.id} className="track-row" style={{ height: TRACK_HEIGHT }}>
              <div className="track-label">{track.name}</div>
              <div className="track-lane" style={{ width: totalWidth }}>
                {track.clips.map((clip) => (
                  <ClipBlock key={clip.id} track={track} clip={clip} pixelsPerSecond={pixelsPerSecond} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
