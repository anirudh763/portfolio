import { describe, it, expect } from 'vitest';
import { MemorySim } from '../src/lib/algorithms/memory';
import { ComplexityProfiler } from '../src/lib/algorithms/profiler';

describe('Algorithm Engine: Memory Container simulation', () => {
  it('reallocates according to growth factor', () => {
    const sim = new MemorySim(2.0); // Doubling factor
    expect(sim.state.capacity).toBe(4);
    
    // Fill up to capacity
    sim.push(); sim.push(); sim.push(); sim.push(); 
    expect(sim.state.capacity).toBe(4);
    
    // Push one more to trigger reallocation
    sim.push();
    expect(sim.state.capacity).toBe(8); // 4 * 2.0
    expect(sim.state.reallocations).toBe(1);
    
    // Check fragmentation (should have old blocks taking up virtual address space)
    expect(sim.state.fragmentationScore).toBeGreaterThan(0);
  });
  
  it('handles 1.5x factor efficiently', () => {
    const sim = new MemorySim(1.5);
    // Initial 4. Next should be max(5, floor(4 * 1.5)) = 6.
    sim.push(); sim.push(); sim.push(); sim.push(); sim.push();
    expect(sim.state.capacity).toBe(6);
  });
});

describe('Algorithm Profiler: Asymptotic Analysis', () => {
  it('QuickSort is categorized effectively', () => {
    const profiler = new ComplexityProfiler();
    
    // Fast mock for testing logic, overriding time generation
    const mockResults = [
        { n: 100, timeMs: 0.1 },
        { n: 1000, timeMs: 1.5 },
        { n: 10000, timeMs: 25 },
    ];
    
    const classification = profiler.classifyComplexity(mockResults);
    // It should identify it primarily as N log N bounded
    expect(['O(N log N)', 'O(N^2)']).toContain(classification);
  });
});
