import React from 'react';
import { useStore } from '../store/timelineStore.js';

export default function PropertiesPanel() {
  const selectedClipId = useStore((s) => s.selectedClipId);
  const findClip = useStore((s) => s.findClip);
  const updateClip = useStore((s) => s.updateClip);

  const found = selectedClipId ? findClip(selectedClipId) : null;

  if (!found) {
    return (
      <div className="panel properties-panel">
        <div className="panel-header"><span>Properties</span></div>
        <div className="empty-hint">Select a clip on the timeline to edit it.</div>
      </div>
    );
  }

  const { track, clip } = found;

  if (track.type === 'text') {
    return (
      <div className="panel properties-panel">
        <div className="panel-header"><span>Text</span></div>
        <label>Content
          <textarea
            value={clip.text}
            onChange={(e) => updateClip(track.id, clip.id, { text: e.target.value })}
          />
        </label>
        <label>Font size
          <input type="range" min="16" max="140" value={clip.fontSize}
            onChange={(e) => updateClip(track.id, clip.id, { fontSize: +e.target.value })} />
        </label>
        <label>Color
          <input type="color" value={clip.color === 'white' ? '#ffffff' : clip.color}
            onChange={(e) => updateClip(track.id, clip.id, { color: e.target.value })} />
        </label>
        <label>Horizontal position
          <input type="range" min="0" max="100" value={clip.x}
            onChange={(e) => updateClip(track.id, clip.id, { x: +e.target.value })} />
        </label>
        <label>Vertical position
          <input type="range" min="0" max="100" value={clip.y}
            onChange={(e) => updateClip(track.id, clip.id, { y: +e.target.value })} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={clip.bold}
            onChange={(e) => updateClip(track.id, clip.id, { bold: e.target.checked })} />
          Bold + outline
        </label>
      </div>
    );
  }

  if (track.type === 'video') {
    const f = clip.filters || {};
    return (
      <div className="panel properties-panel">
        <div className="panel-header"><span>Clip</span></div>
        <label>Brightness
          <input type="range" min="-100" max="100" value={f.brightness ?? 0}
            onChange={(e) => updateClip(track.id, clip.id, { filters: { ...f, brightness: +e.target.value } })} />
        </label>
        <label>Contrast
          <input type="range" min="-100" max="100" value={f.contrast ?? 0}
            onChange={(e) => updateClip(track.id, clip.id, { filters: { ...f, contrast: +e.target.value } })} />
        </label>
        <label>Saturation
          <input type="range" min="-100" max="100" value={f.saturation ?? 0}
            onChange={(e) => updateClip(track.id, clip.id, { filters: { ...f, saturation: +e.target.value } })} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={!!f.grayscale}
            onChange={(e) => updateClip(track.id, clip.id, { filters: { ...f, grayscale: e.target.checked } })} />
          Grayscale
        </label>
        <hr />
        <label>Volume
          <input type="range" min="0" max="2" step="0.05" value={clip.volume ?? 1}
            onChange={(e) => updateClip(track.id, clip.id, { volume: +e.target.value })} />
        </label>
        <hr />
        <label className="checkbox-label">
          <input type="checkbox" checked={clip.transition === 'crossfade'}
            onChange={(e) => updateClip(track.id, clip.id, { transition: e.target.checked ? 'crossfade' : 'none' })} />
          Crossfade into next clip
        </label>
        {clip.transition === 'crossfade' && (
          <label>Transition length (s)
            <input type="range" min="0.1" max="3" step="0.1" value={clip.transitionDuration ?? 0.5}
              onChange={(e) => updateClip(track.id, clip.id, { transitionDuration: +e.target.value })} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="panel properties-panel">
      <div className="panel-header"><span>Clip</span></div>
      <label>Volume
        <input type="range" min="0" max="2" step="0.05" value={clip.volume ?? 1}
          onChange={(e) => updateClip(track.id, clip.id, { volume: +e.target.value })} />
      </label>
    </div>
  );
}
