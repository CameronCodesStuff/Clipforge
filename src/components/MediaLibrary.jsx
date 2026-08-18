import React from 'react';
import { useStore } from '../store/timelineStore.js';

export function toFileUrl(p) {
  const normalized = p.replace(/\\/g, '/');
  const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `file://${encodeURI(withSlash).replace(/#/g, '%23')}`;
}

function guessType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return 'audio';
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
  return 'video';
}

function probeDuration(filePath, type) {
  return new Promise((resolve) => {
    if (type === 'image') return resolve(5);
    const el = document.createElement(type === 'audio' ? 'audio' : 'video');
    el.preload = 'metadata';
    el.src = toFileUrl(filePath);
    el.onloadedmetadata = () => resolve(el.duration || 5);
    el.onerror = () => resolve(5);
  });
}

export default function MediaLibrary() {
  const media = useStore((s) => s.media);
  const addMedia = useStore((s) => s.addMedia);
  const addClipToTrack = useStore((s) => s.addClipToTrack);
  const tracks = useStore((s) => s.tracks);

  const handleImport = async () => {
    const paths = await window.clipforge.selectMediaFiles();
    for (const p of paths) {
      const type = guessType(p);
      const duration = await probeDuration(p, type);
      const name = p.split(/[\\/]/).pop();
      addMedia({ name, path: p, type, duration });
    }
  };

  const handleAddToTimeline = (item) => {
    const targetTrack = item.type === 'audio'
      ? tracks.find((t) => t.type === 'audio')
      : tracks.find((t) => t.type === 'video');
    if (!targetTrack) return;

    const lastEnd = targetTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    addClipToTrack(targetTrack.id, {
      mediaId: item.id,
      srcPath: item.path,
      startTime: lastEnd,
      duration: item.duration,
      inPoint: 0
    });
  };

  return (
    <div className="panel media-library">
      <div className="panel-header">
        <span>Media</span>
        <button onClick={handleImport}>Import</button>
      </div>
      <div className="media-list">
        {media.length === 0 && <div className="empty-hint">Import video, audio, or image files to get started.</div>}
        {media.map((item) => (
          <div key={item.id} className="media-item" onClick={() => handleAddToTimeline(item)}>
            <div className={`media-thumb media-thumb-${item.type}`}>{item.type === 'audio' ? '♫' : '▶'}</div>
            <div className="media-info">
              <div className="media-name" title={item.name}>{item.name}</div>
              <div className="media-duration">{item.duration.toFixed(1)}s</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
