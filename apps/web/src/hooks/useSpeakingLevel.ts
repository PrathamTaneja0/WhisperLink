import { useEffect, useRef, useState } from 'react';

const SPEAK_THRESHOLD = 0.02;
const SILENCE_HANGOVER_MS = 300;

export interface SpeakingSource {
  id: string;
  stream: MediaStream | null;
  enabled: boolean;
}

export function computeRms(data: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const normalized = (data[i]! - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
}

export function useSpeakingMap(sources: SpeakingSource[]): Map<string, boolean> {
  const [speaking, setSpeaking] = useState<Map<string, boolean>>(() => new Map());
  const lastSpokeRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (sources.length === 0) {
      return;
    }

    const audioContext = new AudioContext();
    const analysers = new Map<string, AnalyserNode>();
    const dataArrays = new Map<string, Uint8Array>();
    let rafId = 0;

    for (const source of sources) {
      if (!source.stream || !source.enabled) continue;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      const mediaSource = audioContext.createMediaStreamSource(source.stream);
      mediaSource.connect(analyser);
      analysers.set(source.id, analyser);
      dataArrays.set(source.id, new Uint8Array(analyser.fftSize));
    }

    const tick = () => {
      const now = Date.now();
      const next = new Map<string, boolean>();

      for (const source of sources) {
        const analyser = analysers.get(source.id);
        const data = dataArrays.get(source.id);
        if (!analyser || !data || !source.enabled) {
          next.set(source.id, false);
          continue;
        }

        analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);
        const rms = computeRms(data);
        const lastSpoke = lastSpokeRef.current.get(source.id) ?? 0;

        if (rms >= SPEAK_THRESHOLD) {
          lastSpokeRef.current.set(source.id, now);
          next.set(source.id, true);
        } else if (now - lastSpoke < SILENCE_HANGOVER_MS) {
          next.set(source.id, true);
        } else {
          next.set(source.id, false);
        }
      }

      setSpeaking((prev) => {
        if (prev.size === next.size) {
          let same = true;
          for (const [id, value] of next) {
            if (prev.get(id) !== value) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      void audioContext.close();
      analysers.clear();
      dataArrays.clear();
    };
  }, [sources]);

  return speaking;
}
