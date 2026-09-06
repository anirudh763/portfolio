export type AlgorithmType = 'QUICKSORT' | 'MERGESORT' | 'TIMSORT';
export type ComplexityClass = 'O(N)' | 'O(N log N)' | 'O(N^2)';

export interface ProfilerResult {
  n: number;
  timeMs: number;
}

export class ComplexityProfiler {
  
  public runBenchmark(algo: AlgorithmType, nValues: number[]): ProfilerResult[] {
    const results: ProfilerResult[] = [];
    
    for (const n of nValues) {
      const arr = Array.from({length: n}, () => Math.random());
      
      const start = performance.now();
      switch (algo) {
        case 'QUICKSORT':
          this.quickSort(arr, 0, arr.length - 1);
          break;
        case 'MERGESORT':
          this.mergeSort(arr);
          break;
        case 'TIMSORT':
          // Standard JS sort is often TimSort or similar O(N log N)
          arr.sort((a,b) => a - b);
          break;
      }
      const end = performance.now();
      
      results.push({ n, timeMs: end - start });
    }
    
    return results;
  }
  
  public classifyComplexity(results: ProfilerResult[]): ComplexityClass {
    if (results.length < 3) return 'O(N log N)'; // fallback
    
    // Normalize data
    const maxN = Math.max(...results.map(r => r.n));
    const maxT = Math.max(...results.map(r => r.timeMs));
    
    if (maxT === 0) return 'O(N)';
    
    // Calculate R-squared for linear, n log n, and quadratic fits
    let linearError = 0;
    let nLognError = 0;
    let quadError = 0;
    
    // Fit a curve y = c * f(n). Find best c using least squares, then measure error.
    // Simplifying: we'll check how cost scales relative to endpoints.
    const midIdx = Math.floor(results.length / 2);
    const p1 = results[0];
    const p2 = results[midIdx];
    const p3 = results[results.length - 1];
    
    // Empirical slope analysis between log(T) and log(N)
    // T = c * N^k => log(T) = log(c) + k*log(N)
    // slope k = (log(T2) - log(T1)) / (log(N2) - log(N1))
    
    // Avoid log(0) if timing is extremely fast
    const t2 = Math.max(p3.timeMs, 0.001);
    const t1 = Math.max(p2.timeMs, 0.0001);
    
    const slope = (Math.log(t2) - Math.log(t1)) / (Math.log(p3.n) - Math.log(p2.n));
    
    if (slope < 1.1) return 'O(N)';
    if (slope > 1.8) return 'O(N^2)';
    return 'O(N log N)';
  }
  
  private quickSort(arr: number[], left: number, right: number) {
    if (left < right) {
      const pivot = this.partition(arr, left, right);
      this.quickSort(arr, left, pivot - 1);
      this.quickSort(arr, pivot + 1, right);
    }
  }
  
  private partition(arr: number[], left: number, right: number): number {
    const pivot = arr[right];
    let i = left - 1;
    for (let j = left; j < right; j++) {
      if (arr[j] < pivot) {
        i++;
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
    }
    const temp = arr[i + 1];
    arr[i + 1] = arr[right];
    arr[right] = temp;
    return i + 1;
  }
  
  private mergeSort(arr: number[]): number[] {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid));
    const right = this.mergeSort(arr.slice(mid));
    return this.merge(left, right);
  }
  
  private merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let l = 0, r = 0;
    while (l < left.length && r < right.length) {
      if (left[l] < right[r]) result.push(left[l++]);
      else result.push(right[r++]);
    }
    return result.concat(left.slice(l)).concat(right.slice(r));
  }
}
