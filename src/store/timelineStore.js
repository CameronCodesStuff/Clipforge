import { create } from 'zustand';

let idCounter = 1;
const genId = (prefix) => `${prefix}_${idCounter++}_${Date.now().toString(36)}`;

export const useStore = create((set, get) => ({
  width: 1280,
  height: 720,
  fps: 30,
  pixelsPerSecond: 80,

  media: [], // { id, name, path, type: 'video'|'audio'|'image', duration }

  tracks: [
    { id: genId('track'), type: 'video', name: 'Video 1', clips: [], hasAudio: true },
    { id: genId('audio'), type: 'audio', name: 'Music', clips: [] },
    { id: genId('text'), type: 'text', name: 'Text', clips: [] }
  ],

  selectedClipId: null,
  playhead: 0,
  isPlaying: false,

  get duration() {
    const { tracks } = get();
    let max = 0;
    for (const t of tracks) {
      for (const c of t.clips) {
        max = Math.max(max, c.startTime + c.duration);
      }
    }
    return Math.max(max, 5);
  },

  addMedia: (mediaItem) => set((state) => ({ media: [...state.media, { id: genId('media'), ...mediaItem }] })),

  addTrack: (type) => set((state) => ({
    tracks: [...state.tracks, {
      id: genId('track'),
      type,
      name: type === 'video' ? `Video ${state.tracks.filter(t => t.type === 'video').length + 1}` : type === 'audio' ? 'Audio' : 'Text',
      clips: [],
      hasAudio: type === 'video'
    }]
  })),

  addClipToTrack: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === trackId
      ? { ...t, clips: [...t.clips, { id: genId('clip'), filters: { brightness: 0, contrast: 0, saturation: 0, grayscale: false }, transition: 'none', transitionDuration: 0.5, volume: 1, ...clip }] }
      : t)
  })),

  addTextClip: (trackId, startTime) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === trackId
      ? { ...t, clips: [...t.clips, {
          id: genId('text'), startTime, duration: 3, text: 'New Text',
          fontSize: 48, color: 'white', x: 50, y: 85, bold: true
        }] }
      : t)
  })),

  updateClip: (trackId, clipId, patch) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === trackId
      ? { ...t, clips: t.clips.map((c) => c.id === clipId ? { ...c, ...patch } : c) }
      : t)
  })),

  removeClip: (trackId, clipId) => set((state) => ({
    tracks: state.tracks.map((t) => t.id === trackId
      ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
      : t),
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
  })),

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setPlayhead: (t) => set({ playhead: Math.max(0, t) }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setZoom: (pps) => set({ pixelsPerSecond: Math.max(20, Math.min(400, pps)) }),

  findClip: (clipId) => {
    const { tracks } = get();
    for (const t of tracks) {
      const c = t.clips.find((c) => c.id === clipId);
      if (c) return { track: t, clip: c };
    }
    return null;
  },

  serializeProject: () => {
    const { tracks, width, height, fps } = get();
    return JSON.stringify({ tracks, width, height, fps }, null, 2);
  },

  loadProject: (json) => {
    const data = JSON.parse(json);
    set({ tracks: data.tracks, width: data.width, height: data.height, fps: data.fps });
  }
}));
