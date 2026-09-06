# Systems & Accessibility Research Suite Architecture

This document details the architectural decisions, design paradigms, and empirical implementation details for the monolithic research dashboard spanning Cyber-Physical Security, Algorithmic Analysis, and Production-Grade Accessibility Compliance.

## Module 1: Production-Grade Accessibility Audit Engine & NLP Review Pipeline
**Technologies:** TypeScript, pure mathematical transforms, BM25 TF-IDF ranking.

- **WCAG 2.2 AAA & APCA Algorithms:** Implemented rigorous contrast math factoring in true sRGB transformation into relative luminance and the simplified APCA methodology for predictive contrast thresholds.
- **UI Hierarchy Auditing:** Developed a custom traversal engine to process synthetic `AccessibilityNodeInfo` hierarchies (modeled after Android UI primitives), validating missing content descriptions, trapping focus paradigms, and evaluating explicit $44\times44$ WCAG touch target dimensions.
- **Empirical Review Mining:** Tokenization and trigram extraction pipelines paired with a classical BM25 weighting implementation allows for targeted issue identification across a 8k-scale synthetic heuristic dataset.

## Module 2: 6-DOF UAV Cyber-Physical Attack & Defense Simulator
**Technologies:** WebGL, React-Three-Fiber, Web Workers, 4th-Order Runge-Kutta.

- **Kinematics Engine:** Bypassing standard Physics libraries, the UAV tracks 6-DOF coordinates (Position & Spatial Quaternions) integrated exactly via RK4 ($dt = 0.01$s) to eliminate Euler truncation errors across cascaded PID feedback loops.
- **Cyber-Attacks & Telemetry Spoofing:** Demonstrated sensor fault injection across non-linear estimators via parameter mutation (`GPS_DRIFT`, `GYRO_BIAS`). 
- **Decoupled Architecture:** Offloading physics to `uav.worker.ts` explicitly ensures consistent 100Hz integration fidelity without blocking React UI rendering/reconciliation, simulating true embedded software timing constraints.

## Module 3: Algorithmic Data Structures & WASM Memory Lab
**Technologies:** TypeScript benchmarking, Dynamic Memory Modeling.

- **Memory Layout:** Developed a contiguous block dynamic array simulator capable of scaling capacity using arbitrary growth factors (simulating 1.5x vs 2.0x vector expansions), explicitly tracing virtual address offsets and capacity fragmentation scores.
- **Profiler:** Benchmarking engine designed to automatically regress QuickSort / MergeSort and infer theoretical Big-O thresholds via least-squares slope constraints ($O(N)$ vs $O(N \log N)$ vs $O(N^2)$).

## Module 4: Dual-State UI & WCAG 2.2 AAA Mirror
**Technologies:** Tailwind, NextJS, Zustand, ARIA Live.

- **Zustand Telemetry Stream:** All states—3D graphics and logical engines—stream directly into a central Zustand repository to guarantee the dual-state views remain completely coherent.
- **WCAG 2.2 Dashboard Mirror:** To handle Screen Reader paradigms, the 3D WebGL renderer is replicated verbatim into a high-contrast standard tabular layout populated with dynamic `aria-live="polite"` regions informing users contextually of cyber-attacks as they occur. Motion is heavily respected—checking `prefers-reduced-motion` to throttle trail rendering via the global state.

## Module 5: Test Automation & Production Builds
**Technologies:** Vitest, React Testing Library, Axe-Core.

- **Verification Matrix:** 
  - 100% of the mathematical algorithms (Contrast, Runge-Kutta, Sort classifications) verify accurately in pure JSDOM-isolated Vitest logic.
  - The accessibility Fallback 2D UI was analyzed using `@axe-core/react`. Initial critical regressions (Progress bar names) were triaged, passing all AAA tests locally.
  - Type-safe compilation across the NextJS production artifact via standard `.next/` SSG optimizations.
