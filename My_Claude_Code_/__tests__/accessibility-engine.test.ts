import { describe, it, expect } from 'vitest';
import { relativeLuminance, contrastRatio, apcaContrast } from '../src/lib/accessibility-engine/contrast';
import { runAccessibilityAudit } from '../src/lib/accessibility-engine/audit';
import { calculateBM25, tokenize, generateBigrams, calculateConfidenceIntervals, categorizeReview } from '../src/lib/accessibility-engine/nlp';

describe('Accessibility Engine: Contrast Math', () => {
  it('calculates correct relative luminance', () => {
    expect(relativeLuminance(1, 1, 1)).toBeCloseTo(1); // White
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0); // Black
  });

  it('calculates standard contrast ratio', () => {
    // White vs Black should be 21:1
    expect(contrastRatio(1.0, 0.0)).toBeCloseTo(21.0);
  });

  it('calculates APCA contrast approximation', () => {
    const val = apcaContrast('#000000', '#FFFFFF', 16, 400);
    expect(val).toBeGreaterThan(100);
  });
});

describe('Accessibility Engine: Tree Audit', () => {
  it('flags touch target size < 24 as CRITICAL', () => {
    const issues = runAccessibilityAudit({
      id: 'n1',
      className: 'android.widget.Button',
      contentDescription: 'Submit',
      text: null,
      boundsInScreen: { left: 0, top: 0, right: 20, bottom: 20 },
      isClickable: true,
      isFocusable: true,
      isFocused: false,
      isCheckable: false,
      isChecked: false,
      isScrollable: false,
      children: []
    });
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('CRITICAL');
    expect(issues[0].type).toBe('TOUCH_TARGET_SIZE');
  });

  it('flags missing labels on interactive elements', () => {
    const issues = runAccessibilityAudit({
      id: 'n2',
      className: 'android.widget.ImageButton',
      contentDescription: null,
      text: null,
      boundsInScreen: { left: 0, top: 0, right: 50, bottom: 50 },
      isClickable: true,
      isFocusable: true,
      isFocused: false,
      isCheckable: false,
      isChecked: false,
      isScrollable: false,
      children: []
    });
    
    const labelIssue = issues.find(i => i.type === 'MISSING_LABEL');
    expect(labelIssue).toBeDefined();
    expect(labelIssue?.severity).toBe('CRITICAL');
  });
});

describe('Accessibility Engine: NLP & Profiling', () => {
  it('tokenizes correctly', () => {
    expect(tokenize('The Screen Reader is broken!')).toEqual(['screen', 'reader', 'broken']);
  });

  it('generates bigrams', () => {
    expect(generateBigrams(['screen', 'reader', 'broken'])).toEqual(['screen reader', 'reader broken']);
  });

  it('calculates non-zero BM25 score for exact match', () => {
    const corpus = ['talkback is bad', 'contrast is too low', 'good app'];
    const score = calculateBM25('talkback', corpus[0], corpus);
    expect(score).toBeGreaterThan(0);
  });

  it('calculates statistical confidence intervals', () => {
    const reviews = [
      'The screen reader does not read this button',
      'Talkback focus gets stuck',
      'I need larger text size',
      'Color contrast is terrible',
      'Fix talkback please'
    ];
    
    const stats = calculateConfidenceIntervals(reviews);
    
    expect(stats['Screen Reader'].frequency).toBe(0.6); // 3 out of 5
    expect(stats['High Contrast'].frequency).toBe(0.2); // 1 out of 5
    expect(stats['Screen Reader'].ciLower).toBeGreaterThanOrEqual(0);
    expect(stats['Screen Reader'].ciUpper).toBeLessThanOrEqual(1);
  });
});
