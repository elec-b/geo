# Research: Globe Loading Performance

## Current Status
- **Data File:** `public/data/countries-50m.json`
- **Format:** TopoJSON
- **Size:** 739KB (Uncompressed)
- **Process:** Client-side fetch -> JSON Parse -> TopoJSON-to-GeoJSON Conversion (Main Thread).

## Bottleneck Analysis
The 739KB file is relatively small for network transfer (especially if gzipped), but the **CPU cost** of parsing and converting TopoJSON to GeoJSON is significant. 
- `topojson.feature()` is a synchronous operation that reconstructs thousands of polygon coordinates.
- Performing this on the **Main Thread** blocks the browser's render loop, causing the "freeze" or "static" sensation during load.

## Optimization Options (Ranked)

### 1. Web Worker (Recommended)
**Impact:** High (Perceived)
Offload the `fetch`, `JSON.parse`, and `topojson.feature` conversion to a background Worker.
- **Pros:** Keeps the UI (spinner/globe) 100% responsive during processing.
- **Cons:** Slight complexity increase (async messaging).

### 2. Pre-converted GeoJSON
**Impact:** Medium (Trade-off)
Convert TopoJSON to GeoJSON offline and serve `countries.geojson`.
- **Pros:** No cpu-intensive TopoJSON conversion at runtime.
- **Cons:** File size will balloon (739KB -> ~5MB+). Network transfer time increases, possibly negating CPU savings.

### 3. Progressive Loading (Revisit)
**Impact:** High
Load 110m (~100KB) first, then 50m.
- **Why it failed before:** The synchronization/transition caused issues or the 50m load still blocked the thread eventually.
- **Fix:** Combine with **Web Worker** so the 50m load happens silently in background without freezing the 110m rotation.

### 4. Binary Format (Geobuf)
**Impact:** High
Use `geobuf` (Protocol Buffers for GeoJSON).
- **Pros:** Extremely fast parsing and small size.
- **Cons:** Requires adding a decoder library (`geobuf`, `pbf`).

## Conclusion
To make the load feel "instant" or at least smooth, we must move the heavy lifting off the main thread. **Web Worker** is the cleanest solution that doesn't require changing data formats or increasing bandwidth usage.
