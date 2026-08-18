import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/timelineStore.js';
import { toFileUrl } from './MediaLibrary.jsx';

function activeClipFor(track, t) {
  return track.clips.find((c) => t >= c.startTime && t < c.startTime + c.duration) || null;
}

function filtersToCss(filters = {}) {
  const brightness = 1 + (filters.brightness ?? 0) / 100;
  const contrast = 1 + (filters.contrast ?? 0) / 100;
  const saturate = 1 + (filters.saturation ?? 0) / 100;
  const grayscale = filters.grayscale ? 1 : 0;
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) grayscale(${grayscale})`;
}

export default function PreviewPlayer() {
  const tracks = useStore((s) => s.tracks);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const playhead = useStore((s) => s.playhead);
  const setPlayhead = useStore((s) => s.setPlayhead);

  const videoTracks = tracks.filter((t) => t.type === 'video');
  const textTracks = tracks.filter((t) => t.type === 'text');
  const audioTracks = tracks.filter((t) => t.type === 'audio');

  const videoRefs = useRef({});
  const audioRefs = useRef({});
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const stageRef = useRef(null);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      lastTsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const next = useStore.getState().playhead + dt;
      setPlayhead(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [isPlaying, setPlayhead]);

  // Sync each track's active <video>/<audio> element to the playhead
  useEffect(() => {
    for (const track of videoTracks) {
      const clip = activeClipFor(track, playhead);
      const el = videoRefs.current[track.id];
      if (!el) continue;
      if (clip) {
        const localTime = playhead - clip.startTime + (clip.inPoint || 0);
        if (Math.abs(el.currentTime - localTime) > 0.15) el.currentTime = localTime;
        if (isPlaying && el.paused) el.play().catch(() => {});
        if (!isPlaying && !el.paused) el.pause();
      } else if (!el.paused) {
        el.pause();
      }
    }
    for (const track of audioTracks) {
      const clip = activeClipFor(track, playhead);
      const el = audioRefs.current[track.id];
      if (!el) continue;
      if (clip) {
        const localTime = playhead - clip.startTime + (clip.inPoint || 0);
        if (Math.abs(el.currentTime - localTime) > 0.15) el.currentTime = localTime;
        if (isPlaying && el.paused) el.play().catch(() => {});
        if (!isPlaying && !el.paused) el.pause();
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [playhead, isPlaying, videoTracks, audioTracks]);

  const activeTextClips = textTracks.flatMap((t) => {
    const c = activeClipFor(t, playhead);
    return c ? [c] : [];
  });

  return (
    <div className="panel preview-panel">
      <div className="stage-wrapper">
        <div className="stage" ref={stageRef} style={{ aspectRatio: `${width}/${height}` }}>
          {videoTracks.map((track) => {
            const clip = activeClipFor(track, playhead);
            return (
              <video
                key={track.id}
                ref={(el) => { videoRefs.current[track.id] = el; }}
                src={clip ? toFileUrl(clip.srcPath) : undefined}
                className="stage-video"
                style={{
                  display: clip ? 'block' : 'none',
                  filter: clip ? filtersToCss(clip.filters) : 'none'
                }}
                muted={false}
                playsInline
              />
            );
          })}
          {activeTextClips.map((clip) => (
            <div
              key={clip.id}
              className="stage-text"
              style={{
                left: `${clip.x}%`,
                top: `${clip.y}%`,
                color: clip.color,
                fontSize: `${(clip.fontSize / width) * 100}cqw`,
                fontWeight: clip.bold ? 700 : 400
              }}
            >
              {clip.text}
            </div>
          ))}
          {audioTracks.map((track) => {
            const clip = activeClipFor(track, playhead);
            return (
              <audio
                key={track.id}
                ref={(el) => { audioRefs.current[track.id] = el; }}
                src={clip ? toFileUrl(clip.srcPath) : undefined}
              />
            );
          })}
        </div>
      </div>
      <div className="transport">
        <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? '⏸' : '▶'}</button>
        <span className="time-readout">{playhead.toFixed(1)}s</span>
        <span className="hint">Note: transitions preview as a hard cut — they render as true crossfades on export.</span>
      </div>
    </div>
  );
}
