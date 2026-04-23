import type { DiceRoll } from './types';

export interface RandomSource {
  int(min: number, max: number): number;
}

const cryptoRandom = (): RandomSource => ({
  int(min, max) {
    const range = max - min + 1;
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    return min + (randomBuffer[0] % range);
  },
});

export const defaultRandomSource = cryptoRandom();

export const rollDice = (
  count: number,
  sides: number,
  multiplier = 1,
  modifier = 0,
  random: RandomSource = defaultRandomSource,
  label = `${count}D${sides}`,
): DiceRoll => {
  const rolls = Array.from({ length: count }, () => random.int(1, sides));
  const sum = rolls.reduce((total, value) => total + value, 0);
  return {
    label,
    formula: multiplier === 1 ? `${count}D${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}` : `${count}D${sides}x${multiplier}`,
    rolls,
    modifier,
    result: (sum + modifier) * multiplier,
  };
};

export const rollD100 = (random: RandomSource = defaultRandomSource): number => random.int(1, 100);
