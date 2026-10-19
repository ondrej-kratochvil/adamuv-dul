import { describe, expect, it } from 'vitest';
import { PLOT_H, PLOT_W, addBlocks, tapCell, tapGround, totalBlocks, type Build } from '../../src/logic/build';

const fresh = (): Build => ({ blocks: {}, placed: {} });

describe('stavění', () => {
  it('vykopané kostky přibudou do zásoby', () => {
    const b = fresh();
    addBlocks(b, ['dirt', 'dirt', 'stone']);
    expect(b.blocks).toEqual({ dirt: 2, stone: 1 });
  });
  it('položit, vzít zpět krumpáčem, vyměnit', () => {
    const b = fresh(); addBlocks(b, ['dirt', 'stone']);
    expect(tapCell(b, 0, 8, 'dirt', false)).toBe('placed');
    expect(b.blocks.dirt).toBe(0);
    expect(tapCell(b, 0, 8, 'stone', false)).toBe('swapped');
    expect(b.blocks).toEqual({ dirt: 1, stone: 0 });
    expect(tapCell(b, 0, 8, null, true)).toBe('removed');
    expect(b.blocks).toEqual({ dirt: 1, stone: 1 });
  });
  it('klepnutí stejnou kostkou na stejnou kostku ji vezme zpět', () => {
    const b = fresh(); addBlocks(b, ['dirt']);
    tapCell(b, 3, 3, 'dirt', false);
    expect(tapCell(b, 3, 3, 'dirt', false)).toBe('removed');
  });
  it('bez kostek v zásobě nejde stavět, mimo plochu taky ne', () => {
    const b = fresh();
    expect(tapCell(b, 0, 0, 'dirt', false)).toBe('none');
    addBlocks(b, ['dirt']);
    expect(tapCell(b, PLOT_W, 0, 'dirt', false)).toBe('none');
    expect(tapCell(b, 0, PLOT_H, 'dirt', false)).toBe('none');
    expect(tapCell(b, -1, 0, 'dirt', false)).toBe('none');
  });
  it('kostky se nikdy neztratí', () => {
    const b = fresh(); addBlocks(b, ['dirt', 'dirt', 'stone', 'goldOre']);
    const before = totalBlocks(b);
    const types = ['dirt', 'stone', 'goldOre', null];
    for (let i = 0; i < 500; i++) tapCell(b, i % 5, (i * 7) % 4, types[i % 4], i % 9 === 0);
    expect(totalBlocks(b)).toBe(before);
    expect(Object.values(b.blocks).every(n => n >= 0)).toBe(true);
  });
  it('klepnutí na zem staví od země nahoru a krumpáč bere shora (review 2)', () => {
    const b = fresh(); addBlocks(b, ['dirt', 'dirt', 'stone']);
    expect(tapGround(b, 4, 'dirt', false)).toBe('placed');
    expect(tapGround(b, 4, 'dirt', false)).toBe('placed');
    expect(tapGround(b, 4, 'stone', false)).toBe('placed');
    expect(b.placed).toEqual({ ['4,' + (PLOT_H - 1)]: 'dirt', ['4,' + (PLOT_H - 2)]: 'dirt', ['4,' + (PLOT_H - 3)]: 'stone' });
    expect(tapGround(b, 4, null, true)).toBe('removed');
    expect(b.placed['4,' + (PLOT_H - 3)]).toBeUndefined();
    expect(b.blocks.stone).toBe(1);
  });
  it('plný sloupec nic nepoloží', () => {
    const b = fresh(); addBlocks(b, Array(PLOT_H + 2).fill('dirt'));
    for (let i = 0; i < PLOT_H; i++) tapGround(b, 0, 'dirt', false);
    expect(tapGround(b, 0, 'dirt', false)).toBe('none');
    expect(b.blocks.dirt).toBe(2);
  });
});
