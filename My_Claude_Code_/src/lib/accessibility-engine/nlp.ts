/**
 * Review Telemetry NLP Mining Pipeline
 */

export interface TokenizedReview {
  id: string;
  originalText: string;
  tokens: string[];
  bigrams: string[];
}

export const STOP_WORDS = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'for']);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));
}

export function generateBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

export function calculateBM25(query: string, document: string, corpus: string[], k1 = 1.5, b = 0.75): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  const corpusTokensList = corpus.map(tokenize);
  
  const N = corpus.length;
  const avgdl = corpusTokensList.reduce((sum, doc) => sum + doc.length, 0) / N;
  const dl = docTokens.length;

  let score = 0;

  for (const q of queryTokens) {
    // Document frequency
    const n = corpusTokensList.filter(doc => doc.includes(q)).length;
    // Inverse document frequency
    const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
    
    // Term frequency in document
    const tf = docTokens.filter(t => t === q).length;
    
    // BM25 weighting
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (dl / avgdl));
    
    score += idf * (numerator / denominator);
  }

  return score;
}

export type Category = 'Screen Reader' | 'High Contrast' | 'Dynamic Font Scaling' | 'Motor Navigation';

export function categorizeReview(text: string): Category[] {
  const categories: Category[] = [];
  const lower = text.toLowerCase();
  
  if (lower.includes('screen reader') || lower.includes('talkback') || lower.includes('voiceover')) {
    categories.push('Screen Reader');
  }
  if (lower.includes('contrast') || lower.includes('color blind') || lower.includes('visibility')) {
    categories.push('High Contrast');
  }
  if (lower.includes('font') || lower.includes('text size') || lower.includes('scaling')) {
    categories.push('Dynamic Font Scaling');
  }
  if (lower.includes('touch') || lower.includes('target') || lower.includes('switch access')) {
    categories.push('Motor Navigation');
  }
  
  return categories;
}

export function calculateConfidenceIntervals(reviews: string[]): Record<Category, { frequency: number, ciLower: number, ciUpper: number }> {
  let screenReader = 0;
  let highContrast = 0;
  let fontScaling = 0;
  let motorNav = 0;
  
  const n = reviews.length;
  if (n === 0) {
    return {} as Record<Category, { frequency: number, ciLower: number, ciUpper: number }>;
  }

  for (const r of reviews) {
    const cats = categorizeReview(r);
    if (cats.includes('Screen Reader')) screenReader++;
    if (cats.includes('High Contrast')) highContrast++;
    if (cats.includes('Dynamic Font Scaling')) fontScaling++;
    if (cats.includes('Motor Navigation')) motorNav++;
  }
  
  const results: any = {};
  
  // Z-score for 95% confidence interval is 1.96
  const z = 1.96;
  
  const categories = [
    { name: 'Screen Reader', count: screenReader },
    { name: 'High Contrast', count: highContrast },
    { name: 'Dynamic Font Scaling', count: fontScaling },
    { name: 'Motor Navigation', count: motorNav },
  ];
  
  for (const cat of categories) {
    const p = cat.count / n;
    // Standard error (binomial proportion)
    const se = Math.sqrt((p * (1 - p)) / n);
    const margin = z * se;
    
    results[cat.name] = {
      frequency: p,
      ciLower: Math.max(0, p - margin),
      ciUpper: Math.min(1, p + margin)
    };
  }
  
  return results;
}
