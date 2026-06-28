import { describe, it, expect } from 'vitest';
import { computeRms } from './useSpeakingLevel';

describe('computeRms', () => {
  it('returns 0 for silence (centered samples)', () => {
    const data = new Uint8Array(128).fill(128);
    expect(computeRms(data)).toBe(0);
  });

  it('returns higher value for louder signal', () => {
    const quiet = new Uint8Array(128).fill(128);
    quiet[0] = 130;

    const loud = new Uint8Array(128).fill(128);
    for (let i = 0; i < loud.length; i++) {
      loud[i] = i % 2 === 0 ? 200 : 56;
    }

    expect(computeRms(loud)).toBeGreaterThan(computeRms(quiet));
  });
});
