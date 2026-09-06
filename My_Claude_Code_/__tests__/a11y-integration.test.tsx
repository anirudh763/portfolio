import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { expect, it, describe, vi } from 'vitest';
import { FallbackView2D } from '../src/components/ui/FallbackView2D';

// Type assertion override
const _expect = expect as any;

// Mock Zustand store for tests
vi.mock('../src/store/useAppStore', () => ({
  useAppStore: () => ({
    uavTrueState: { position: { x: 0, y: 0, z: 10 }, velocity: { x:0, y:0, z:0 } },
    uavSecurityState: { underAttack: false, attackType: 'NONE', anomalyScore: 0, mitigationActive: false },
    activeAttack: 'NONE',
    targetAltitude: 10,
    memoryCapacity: 4,
    memorySize: 2,
    setTargetAltitude: vi.fn(),
    setActiveAttack: vi.fn(),
  })
}));

describe('WCAG 2.2 AAA Compliance', () => {
  it('FallbackView2D should have no accessibility violations', async () => {
    const { container } = render(<FallbackView2D />);
    const results = await axe(container);
    
    _expect(results).toHaveNoViolations();
  });
});
