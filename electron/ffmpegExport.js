const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');

// Default font for drawtext — Windows ships Arial at this path.
// If text doesn't render on another OS, point this at a valid .ttf.
const DEFAULT_FONT = os.platform() === 'win32'
  ? 'C\\:\\\\Windows\\\\Fonts\\\\arial.ttf'
  : null;

function escapeDrawtext(text) {
  return String(text)
    .replace(/\\/g, '\\\\\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\u2019");
}

function buildFilterGraph(project) {
  const { width, height, fps, duration, tracks } = project;
  const videoTracks = tracks.filter(t => t.type === 'video');
  const textTracks = tracks.filter(t => t.type === 'text');
  const audioTracks = tracks.filter(t => t.type === 'audio');

  const inputs = []; // { path, ss, t }
  const filterLines = [];
  let inputIndex = 0;

  filterLines.push(`color=size=${width}x${height}:color=black:duration=${duration}:rate=${fps}[base0]`);
  let baseLabel = 'base0';
  let baseCount = 0;

  const audioLabels = []; // labels of delayed/volume-adjusted audio streams to mix

  function addClipInput(clip) {
    const idx = inputIndex++;
    inputs.push({ path: clip.srcPath, ss: clip.inPoint || 0, t: clip.duration });
    return idx;
  }

  function buildClipVideoChain(clip, idx, outLabel) {
    const f = clip.filters || {};
    const brightness = (f.brightness ?? 0) / 100; // -1..1
    const contrast = 1 + (f.contrast ?? 0) / 100; // ~0..2
    const saturation = 1 + (f.saturation ?? 0) / 100;
    const eq = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${f.grayscale ? 0 : saturation}`;
    filterLines.push(
      `[${idx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,${eq},setpts=PTS-STARTPTS[${outLabel}]`
    );
  }

  function collectClipAudio(clip, idx, startTime) {
    const vol = clip.volume ?? 1;
    const label = `aud${idx}`;
    filterLines.push(
      `[${idx}:a]atrim=0:${clip.duration},asetpts=PTS-STARTPTS,volume=${vol},` +
      `adelay=${Math.round(startTime * 1000)}|${Math.round(startTime * 1000)}[${label}]`
    );
    audioLabels.push(label);
  }

  for (const track of videoTracks) {
    const clips = [...track.clips].sort((a, b) => a.startTime - b.startTime);
    let i = 0;
    while (i < clips.length) {
      const clip = clips[i];
      const next = clips[i + 1];

      if (clip.transition === 'crossfade' && next && next.startTime < clip.startTime + clip.duration) {
        // Merge this clip and the next via xfade
        const idxA = addClipInput(clip);
        const idxB = addClipInput(next);
        buildClipVideoChain(clip, idxA, `preA${idxA}`);
        buildClipVideoChain(next, idxB, `preB${idxB}`);
        const transDur = Math.min(clip.transitionDuration || 0.5, clip.duration, next.duration);
        const offset = clip.duration - transDur;
        const mergedLabel = `xf${idxA}`;
        filterLines.push(
          `[preA${idxA}][preB${idxB}]xfade=transition=fade:duration=${transDur}:offset=${offset}[${mergedLabel}]`
        );
        const shiftedLabel = `sh${idxA}`;
        filterLines.push(`[${mergedLabel}]tpad=start_duration=${clip.startTime}[${shiftedLabel}]`);
        baseCount++;
        const newBase = `base${baseCount}`;
        filterLines.push(
          `[${baseLabel}][${shiftedLabel}]overlay=x=0:y=0:enable='between(t,${clip.startTime},${next.startTime + next.duration})'[${newBase}]`
        );
        baseLabel = newBase;
        if (track.hasAudio !== false) {
          collectClipAudio(clip, idxA, clip.startTime);
          collectClipAudio(next, idxB, next.startTime);
        }
        i += 2;
      } else {
        const idx = addClipInput(clip);
        const preLabel = `pre${idx}`;
        buildClipVideoChain(clip, idx, preLabel);
        const shiftedLabel = `sh${idx}`;
        filterLines.push(`[${preLabel}]tpad=start_duration=${clip.startTime}[${shiftedLabel}]`);
        baseCount++;
        const newBase = `base${baseCount}`;
        filterLines.push(
          `[${baseLabel}][${shiftedLabel}]overlay=x=0:y=0:enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'[${newBase}]`
        );
        baseLabel = newBase;
        if (track.hasAudio !== false) {
          collectClipAudio(clip, idx, clip.startTime);
        }
        i += 1;
      }
    }
  }

  // Standalone audio-only tracks (music etc.)
  for (const track of audioTracks) {
    for (const clip of track.clips) {
      const idx = addClipInput(clip);
      collectClipAudio(clip, idx, clip.startTime);
    }
  }

  // Text overlays, drawn last so they sit on top of everything
  for (const track of textTracks) {
    for (const clip of track.clips) {
      baseCount++;
      const newBase = `base${baseCount}`;
      const fontOpt = DEFAULT_FONT ? `fontfile=${DEFAULT_FONT}:` : '';
      const x = Math.round((clip.x ?? 50) / 100 * width);
      const y = Math.round((clip.y ?? 85) / 100 * height);
      filterLines.push(
        `[${baseLabel}]drawtext=${fontOpt}text='${escapeDrawtext(clip.text)}':` +
        `fontsize=${clip.fontSize || 48}:fontcolor=${clip.color || 'white'}:` +
        `x=${x}-text_w/2:y=${y}-text_h/2:` +
        `${clip.bold ? 'borderw=2:bordercolor=black:' : ''}` +
        `enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'[${newBase}]`
      );
      baseLabel = newBase;
    }
  }

  let audioMapArg = null;
  if (audioLabels.length > 0) {
    filterLines.push(`${audioLabels.map(l => `[${l}]`).join('')}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0[aout]`);
    audioMapArg = 'aout';
  }

  return { filterGraph: filterLines.join(';'), inputs, videoOutLabel: baseLabel, audioOutLabel: audioMapArg };
}

function runExport(project, onProgress) {
  return new Promise((resolve, reject) => {
    const { filterGraph, inputs, videoOutLabel, audioOutLabel } = buildFilterGraph(project);

    const args = [];
    for (const input of inputs) {
      args.push('-ss', String(input.ss), '-t', String(input.t), '-i', input.path);
    }
    args.push('-filter_complex', filterGraph);
    args.push('-map', `[${videoOutLabel}]`);
    if (audioOutLabel) {
      args.push('-map', `[${audioOutLabel}]`);
    } else {
      args.push('-an');
    }
    args.push('-r', String(project.fps));
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20');
    if (audioOutLabel) args.push('-c:a', 'aac', '-b:a', '192k');
    args.push('-y', project.outputPath);

    const proc = spawn(ffmpegPath, args);
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      const str = chunk.toString();
      stderr += str;
      const match = str.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (match && onProgress) {
        const seconds = (+match[1]) * 3600 + (+match[2]) * 60 + parseFloat(match[3]);
        onProgress(Math.min(100, Math.round((seconds / project.duration) * 100)));
      }
    });

    proc.on('close', (code) => {
      if (code === 0) resolve(project.outputPath);
      else reject(new Error(`ffmpeg exited with code ${code}\n${stderr.slice(-4000)}`));
    });

    proc.on('error', (err) => reject(err));
  });
}

module.exports = { runExport, buildFilterGraph };
