/**
 * Custom Graph Layout — Minimal-Displacement Crossing Elimination
 *
 * KEY PRINCIPLE: move as few nodes as possible, as little as possible.
 *
 * For each crossing, the algorithm tries to move ONLY ONE node (the one
 * with the smallest required displacement) to a position that eliminates
 * the crossing. Nodes not involved in crossings are NEVER touched.
 *
 * If the diagram has no crossings — returns immediately without changes.
 *
 * Pipeline:
 *   Phase 1 — Extract graph (nodes + edges, LinkLabels resolved)
 *   Phase 2 — If no crossings/overlaps → return immediately
 *   Phase 3 — Iterative crossing elimination (try single-node moves)
 *   Phase 4 — Minimal overlap removal (only if nodes overlap after Phase 3)
 *   Phase 5 — Apply changed positions to GoJS
 */

import * as go from 'gojs';
import { LINK_LABEL_CATEGORY } from '../../config';

// ---------------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------------

export interface CustomLayoutOptions {
  /**
   * Number of full optimization passes (default 5).
   *
   * Каждый pass заново анализирует текущее состояние и пробует устранить
   * пересечения. Каждый следующий pass строится на результате предыдущего,
   * поэтому несколько pass-ов дают лучший результат, чем один.
   * Алгоритм остановится раньше, если pass не улучшил ситуацию.
   */
  iterations?: number;

  /**
   * Maximum rounds of crossing elimination per pass (default 20).
   * Each round fixes one crossing by moving one node.
   */
  maxRoundsPerPass?: number;

  /**
   * Minimum gap between node bounding-boxes, in px (default 20).
   */
  minNodeGap?: number;

  /**
   * Maximum radius to search for candidate positions, in px (default 300).
   * Ноды не будут перемещаться дальше чем на это расстояние от исходной позиции.
   * Если pass не дал улучшений, maxDisplacement будет увеличен автоматически.
   */
  maxDisplacement?: number;

  /**
   * Increment to add to maxDisplacement when a pass produces no improvement (default 150).
   * Если pass не улучшил результат, maxDisplacement увеличивается на эту величину
   * и алгоритм пробует еще один pass с расширенным радиусом поиска.
   */
  maxDisplacementIncrement?: number;

  /**
   * Maximum allowed value for maxDisplacement (default 1000).
   * Предотвращает слишком большие перемещения узлов.
   */
  maxDisplacementLimit?: number;
}

const DEFAULT_OPTIONS: Required<CustomLayoutOptions> = {
  iterations: 10,
  maxRoundsPerPass: 20,
  minNodeGap: 20,
  maxDisplacement: 300,
  maxDisplacementIncrement: 150,
  maxDisplacementLimit: 1000,
};

/**
 * Apply crossing-elimination layout to the GoJS diagram.
 *
 * If no crossings and no node-edge overlaps exist, returns immediately
 * without modifying the diagram.
 */
export async function applyCustomLayout(
  diagram: go.Diagram,
  options: CustomLayoutOptions = {},
): Promise<void> {
  const opts: Required<CustomLayoutOptions> = { ...DEFAULT_OPTIONS, ...options };

  try {
    console.log('[layout] Starting minimal-displacement crossing elimination…');
    console.log(`[layout] Will run up to ${opts.iterations} pass(es).`);

    // Phase 1 — Extract graph
    const { nodes, edges } = extractGraph(diagram);
    if (nodes.length === 0) {
      console.log('[layout] No layoutable nodes found.');
      return;
    }

    const initialCrossings = countEdgeCrossings(nodes, edges);
    const initialOverlaps = countNodeEdgeOverlaps(nodes, edges);
    console.log(`[layout] Graph: ${nodes.length} nodes, ${edges.length} edges`);
    console.log(`[layout] Initial: ${initialCrossings} crossings, ${initialOverlaps} node-edge overlaps`);

    // Phase 2 — Early exit if nothing to fix
    if (initialCrossings === 0 && initialOverlaps === 0) {
      console.log('[layout] ✅ No crossings or overlaps — nothing to do.');
      return;
    }

    // Save very first positions for logging total displacement at the end
    const firstPositions = nodes.map(n => ({ x: n.x, y: n.y }));
    const movedNodes = new Set<number>();
    let totalMoves = 0;

    // Phase 3 — Multi-pass optimization
    // Each pass uses the result of the previous pass as starting state.
    // Each pass gets a FRESH displacement budget (origPositions reset per pass).
    // If a pass makes no improvement, maxDisplacement is increased and we try again.
    let currentMaxDisplacement = opts.maxDisplacement;
    let pass = 0;
    let consecutiveNoImprovementPasses = 0;
    
    while (pass < opts.iterations) {
      const crossingsBefore = countEdgeCrossings(nodes, edges);
      const overlapsBefore = countNodeEdgeOverlaps(nodes, edges);

      if (crossingsBefore === 0 && overlapsBefore === 0) {
        console.log(`[layout] Pass ${pass + 1}: nothing left to fix — stopping.`);
        break;
      }

      console.log(`[layout] Pass ${pass + 1}/${opts.iterations}: ${crossingsBefore} crossings, ${overlapsBefore} overlaps (maxDisplacement: ${currentMaxDisplacement}px)…`);

      // Fresh displacement budget for each pass — measured from positions
      // at the START of this pass, not from the very first positions.
      const origPositions = nodes.map(n => ({ x: n.x, y: n.y }));
      let passMoves = 0;

      // --- Crossing elimination ---
      for (let round = 0; round < opts.maxRoundsPerPass; round++) {
        const crossings = findAllCrossings(nodes, edges);
        if (crossings.length === 0) break;

        const fixed = fixOneCrossing(nodes, edges, crossings[0], origPositions, currentMaxDisplacement);
        if (fixed !== null) {
          movedNodes.add(fixed);
          passMoves++;
        } else {
          let anyFixed = false;
          for (let ci = 1; ci < crossings.length; ci++) {
            const f = fixOneCrossing(nodes, edges, crossings[ci], origPositions, currentMaxDisplacement);
            if (f !== null) {
              movedNodes.add(f);
              passMoves++;
              anyFixed = true;
              break;
            }
          }
          if (!anyFixed) break;
        }
      }

      // --- Node-edge overlap elimination ---
      fixNodeEdgeOverlaps(nodes, edges, origPositions, currentMaxDisplacement, movedNodes);

      totalMoves += passMoves;

      const crossingsAfter = countEdgeCrossings(nodes, edges);
      const overlapsAfter = countNodeEdgeOverlaps(nodes, edges);
      console.log(`[layout] Pass ${pass + 1} done: ${crossingsAfter} crossings, ${overlapsAfter} overlaps (was ${crossingsBefore}/${overlapsBefore})`);

      // Check if there was improvement
      const hadImprovement = crossingsAfter < crossingsBefore || overlapsAfter < overlapsBefore;
      
      if (!hadImprovement) {
        consecutiveNoImprovementPasses++;
        
        // Try increasing maxDisplacement if we haven't reached the limit
        if (currentMaxDisplacement < opts.maxDisplacementLimit) {
          const newMaxDisplacement = Math.min(
            currentMaxDisplacement + opts.maxDisplacementIncrement,
            opts.maxDisplacementLimit
          );
          console.log(`[layout] No improvement in pass ${pass + 1} — increasing maxDisplacement from ${currentMaxDisplacement}px to ${newMaxDisplacement}px`);
          currentMaxDisplacement = newMaxDisplacement;
          
          // Don't count this pass toward the limit if we're increasing displacement
          // This gives the algorithm a chance with the new displacement value
          if (consecutiveNoImprovementPasses < 3) {
            // Allow a few more attempts with increased displacement
            continue; // Don't increment pass counter
          }
        }
        
        // If we've reached the limit or had too many consecutive failures, stop
        console.log(`[layout] Stopping: reached maxDisplacement limit or no improvement possible.`);
        break;
      } else {
        // Reset consecutive failure counter on success
        consecutiveNoImprovementPasses = 0;
      }
      
      pass++;
    }

    // Phase 4 — Minimal overlap removal
    removeOverlaps(nodes, opts.minNodeGap, 30);

    const finalCrossings = countEdgeCrossings(nodes, edges);
    const finalOverlaps = countNodeEdgeOverlaps(nodes, edges);
    console.log(`[layout] Total: ${totalMoves} move(s), ${movedNodes.size} node(s) affected.`);
    console.log(`[layout] Final: ${finalCrossings} crossings, ${finalOverlaps} overlaps (was ${initialCrossings}/${initialOverlaps})`);

    // Log total displacement per moved node (from very first positions)
    for (const idx of movedNodes) {
      const disp = Math.sqrt((nodes[idx].x - firstPositions[idx].x) ** 2 +
                             (nodes[idx].y - firstPositions[idx].y) ** 2);
      console.log(`[layout]   Node ${idx} displaced by ${disp.toFixed(0)}px`);
    }

    // Phase 5 — Apply only if something changed
    if (movedNodes.size > 0 || finalOverlaps < initialOverlaps) {
      applyPositionsToDiagram(diagram, nodes);
      console.log('[layout] ✅ Layout applied.');
    } else {
      console.log('[layout] ✅ No beneficial changes found.');
    }
  } catch (error) {
    console.error('[layout] Failed:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
//  Internal data structures
// ---------------------------------------------------------------------------

interface LayoutNode {
  key: go.Key;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutEdge {
  fromIdx: number;
  toIdx: number;
  weight: number;
}

// ---------------------------------------------------------------------------
//  Phase 1 — Graph extraction
// ---------------------------------------------------------------------------

function extractGraph(diagram: go.Diagram): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const model = diagram.model as go.GraphLinksModel;
  const nodeDataArray: go.ObjectData[] = model.nodeDataArray as go.ObjectData[];
  const linkDataArray: go.ObjectData[] = model.linkDataArray as go.ObjectData[];

  const nodeDataByKey = new Map<go.Key, go.ObjectData>();
  for (const nd of nodeDataArray) nodeDataByKey.set(nd.key, nd);

  const nodes: LayoutNode[] = [];
  const keyToIdx = new Map<go.Key, number>();

  for (const nd of nodeDataArray) {
    if (nd.category === LINK_LABEL_CATEGORY) continue;
    const goNode = diagram.findNodeForKey(nd.key);
    const loc = goNode?.location ?? new go.Point(0, 0);
    const bounds = goNode?.actualBounds;
    keyToIdx.set(nd.key, nodes.length);
    nodes.push({
      key: nd.key,
      x: loc.x,
      y: loc.y,
      width: bounds ? bounds.width : 120,
      height: bounds ? bounds.height : 60,
    });
  }

  const parentFlowOf = (labelKey: go.Key): go.ObjectData | null => {
    for (const ld of linkDataArray) {
      const lk = ld.labelKeys;
      if (Array.isArray(lk) && lk.includes(labelKey)) return ld;
    }
    return null;
  };

  const edgeSet = new Set<string>();
  const edges: LayoutEdge[] = [];

  const addEdge = (fromKey: go.Key, toKey: go.Key, weight: number) => {
    const fi = keyToIdx.get(fromKey);
    const ti = keyToIdx.get(toKey);
    if (fi === undefined || ti === undefined || fi === ti) return;
    const id = fi < ti ? `${fi}|${ti}` : `${ti}|${fi}`;
    if (edgeSet.has(id)) return;
    edgeSet.add(id);
    edges.push({ fromIdx: fi, toIdx: ti, weight });
  };

  for (const ld of linkDataArray) {
    const rawFrom: go.Key | undefined = ld.from;
    const rawTo: go.Key | undefined = ld.to;
    if (rawFrom == null || rawTo == null) continue;

    const fromIsLabel = nodeDataByKey.get(rawFrom)?.category === LINK_LABEL_CATEGORY;
    const toIsLabel = nodeDataByKey.get(rawTo)?.category === LINK_LABEL_CATEGORY;

    if (!fromIsLabel && !toIsLabel) {
      addEdge(rawFrom, rawTo, 1);
    } else if (fromIsLabel && !toIsLabel) {
      const pf = parentFlowOf(rawFrom);
      if (pf) {
        if (pf.from != null) addEdge(pf.from, rawTo, 0.5);
        if (pf.to != null) addEdge(pf.to, rawTo, 0.5);
      }
    } else if (!fromIsLabel && toIsLabel) {
      const pf = parentFlowOf(rawTo);
      if (pf) {
        if (pf.from != null) addEdge(rawFrom, pf.from, 0.5);
        if (pf.to != null) addEdge(rawFrom, pf.to, 0.5);
      }
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
//  Phase 3 — Fix one crossing with minimum displacement
// ---------------------------------------------------------------------------

/**
 * Try to fix a single crossing [ei, ej] by moving ONE of the 4 involved nodes.
 * Returns the index of the moved node, or null if no fix was found.
 *
 * Strategy: for each of the 4 nodes, generate candidate positions (close to
 * current position), check if the crossing disappears AND no new crossings
 * appear. Pick the candidate with minimum displacement.
 */
function fixOneCrossing(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  crossing: [number, number],
  origPositions: { x: number; y: number }[],
  maxDisplacement: number,
): number | null {
  const [ei, ej] = crossing;
  const e1 = edges[ei];
  const e2 = edges[ej];
  const involvedNodes = [e1.fromIdx, e1.toIdx, e2.fromIdx, e2.toIdx];

  const currentTotalCrossings = countEdgeCrossings(nodes, edges);

  let bestNodeIdx = -1;
  let bestX = 0;
  let bestY = 0;
  let bestDisplacement = Infinity;

  for (const nodeIdx of involvedNodes) {
    const node = nodes[nodeIdx];
    const origX = node.x;
    const origY = node.y;

    // Generate candidate positions at various distances and angles
    const candidates = generateFixCandidates(node.x, node.y, origPositions[nodeIdx], maxDisplacement);

    for (const [cx, cy] of candidates) {
      // Check displacement from original position
      const disp = Math.sqrt((cx - origPositions[nodeIdx].x) ** 2 + (cy - origPositions[nodeIdx].y) ** 2);
      if (disp > maxDisplacement) continue;
      if (disp >= bestDisplacement) continue; // Already found a closer solution

      node.x = cx;
      node.y = cy;

      const newTotalCrossings = countEdgeCrossings(nodes, edges);
      if (newTotalCrossings < currentTotalCrossings) {
        bestNodeIdx = nodeIdx;
        bestX = cx;
        bestY = cy;
        bestDisplacement = disp;
      }

      // Restore
      node.x = origX;
      node.y = origY;
    }
  }

  if (bestNodeIdx >= 0) {
    nodes[bestNodeIdx].x = bestX;
    nodes[bestNodeIdx].y = bestY;
    return bestNodeIdx;
  }

  return null;
}

/**
 * Generate candidate positions for fixing a crossing.
 * Starts with small displacements and gradually increases.
 * Positions biased toward the original position.
 */
function generateFixCandidates(
  currentX: number,
  currentY: number,
  orig: { x: number; y: number },
  maxDisplacement: number,
): [number, number][] {
  const candidates: [number, number][] = [];
  const angleSteps = 12; // Every 30 degrees

  // Concentric rings of candidates around current position
  const radii = [20, 40, 70, 100, 150, 200, maxDisplacement * 0.8];
  for (const r of radii) {
    if (r > maxDisplacement) break;
    for (let i = 0; i < angleSteps; i++) {
      const a = (2 * Math.PI * i) / angleSteps;
      candidates.push([currentX + Math.cos(a) * r, currentY + Math.sin(a) * r]);
    }
  }

  // Also try positions around the original location (if different from current)
  const origDist = Math.sqrt((currentX - orig.x) ** 2 + (currentY - orig.y) ** 2);
  if (origDist > 10) {
    for (const r of [20, 40, 70, 100]) {
      for (let i = 0; i < angleSteps; i++) {
        const a = (2 * Math.PI * i) / angleSteps;
        candidates.push([orig.x + Math.cos(a) * r, orig.y + Math.sin(a) * r]);
      }
    }
  }

  // Try the midpoint between current and each cardinal shift
  candidates.push([currentX, currentY - 80]);
  candidates.push([currentX, currentY + 80]);
  candidates.push([currentX - 80, currentY]);
  candidates.push([currentX + 80, currentY]);
  candidates.push([currentX, currentY - 150]);
  candidates.push([currentX, currentY + 150]);
  candidates.push([currentX - 150, currentY]);
  candidates.push([currentX + 150, currentY]);

  return candidates;
}

// ---------------------------------------------------------------------------
//  Fix node-edge overlaps (edges passing through nodes)
// ---------------------------------------------------------------------------

function fixNodeEdgeOverlaps(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  origPositions: { x: number; y: number }[],
  maxDisplacement: number,
  movedNodes: Set<number>,
): void {
  for (let attempt = 0; attempt < 10; attempt++) {
    let anyFixed = false;

    for (let ni = 0; ni < nodes.length; ni++) {
      const nd = nodes[ni];
      let hasOverlap = false;

      for (const e of edges) {
        if (e.fromIdx === ni || e.toIdx === ni) continue;
        const a = nodes[e.fromIdx];
        const b = nodes[e.toIdx];
        if (segmentIntersectsRect(a.x, a.y, b.x, b.y, nd.x, nd.y, nd.width, nd.height)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) continue;

      // Try to move this node away from the edge
      const origX = nd.x;
      const origY = nd.y;
      const currentCrossings = countEdgeCrossings(nodes, edges);
      const currentOverlaps = countNodeEdgeOverlaps(nodes, edges);

      let bestX = origX;
      let bestY = origY;
      let bestScore = 0; // We want negative score (improvement)

      const candidates = generateFixCandidates(nd.x, nd.y, origPositions[ni], maxDisplacement);
      for (const [cx, cy] of candidates) {
        const disp = Math.sqrt((cx - origPositions[ni].x) ** 2 + (cy - origPositions[ni].y) ** 2);
        if (disp > maxDisplacement) continue;

        nd.x = cx;
        nd.y = cy;
        const newCrossings = countEdgeCrossings(nodes, edges);
        const newOverlaps = countNodeEdgeOverlaps(nodes, edges);

        // Only accept if we don't increase crossings and reduce overlaps
        if (newCrossings <= currentCrossings && newOverlaps < currentOverlaps) {
          const score = (newOverlaps - currentOverlaps) * 100 + (newCrossings - currentCrossings) * 1000 + disp * 0.01;
          if (score < bestScore) {
            bestScore = score;
            bestX = cx;
            bestY = cy;
          }
        }
      }

      nd.x = bestX;
      nd.y = bestY;
      if (bestX !== origX || bestY !== origY) {
        movedNodes.add(ni);
        anyFixed = true;
      }
    }

    if (!anyFixed) break;
  }
}

// ---------------------------------------------------------------------------
//  Phase 4 — Overlap removal
// ---------------------------------------------------------------------------

function removeOverlaps(nodes: LayoutNode[], minGap: number, iterations: number): void {
  for (let iter = 0; iter < iterations; iter++) {
    let anyOverlap = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const overlapX = (a.width / 2 + b.width / 2 + minGap) - Math.abs(a.x - b.x);
        const overlapY = (a.height / 2 + b.height / 2 + minGap) - Math.abs(a.y - b.y);
        if (overlapX > 0 && overlapY > 0) {
          anyOverlap = true;
          if (overlapX < overlapY) {
            const shift = overlapX / 2 + 1;
            if (a.x <= b.x) { a.x -= shift; b.x += shift; }
            else { a.x += shift; b.x -= shift; }
          } else {
            const shift = overlapY / 2 + 1;
            if (a.y <= b.y) { a.y -= shift; b.y += shift; }
            else { a.y += shift; b.y -= shift; }
          }
        }
      }
    }
    if (!anyOverlap) break;
  }
}

// ---------------------------------------------------------------------------
//  Phase 5 — Apply positions to GoJS
// ---------------------------------------------------------------------------

function applyPositionsToDiagram(diagram: go.Diagram, nodes: LayoutNode[]): void {
  diagram.startTransaction('custom-layout');
  try {
    for (const ln of nodes) {
      const goNode = diagram.findNodeForKey(ln.key);
      if (goNode) {
        goNode.location = new go.Point(ln.x, ln.y);
      }
    }
    diagram.commitTransaction('custom-layout');
  } catch (err) {
    diagram.rollbackTransaction();
    throw err;
  }
  diagram.zoomToFit();
}

// ---------------------------------------------------------------------------
//  Geometry helpers
// ---------------------------------------------------------------------------

function segmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
): boolean {
  const d1 = cross(x3, y3, x4, y4, x1, y1);
  const d2 = cross(x3, y3, x4, y4, x2, y2);
  const d3 = cross(x1, y1, x2, y2, x3, y3);
  const d4 = cross(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function segmentIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  nx: number, ny: number, w: number, h: number,
): boolean {
  const left = nx - w / 2;
  const right = nx + w / 2;
  const top = ny - h / 2;
  const bottom = ny + h / 2;

  if (Math.max(x1, x2) < left || Math.min(x1, x2) > right) return false;
  if (Math.max(y1, y2) < top || Math.min(y1, y2) > bottom) return false;
  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;

  if (segmentsIntersect(x1, y1, x2, y2, left, top, right, top)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, left, bottom, right, bottom)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, left, top, left, bottom)) return true;

  return false;
}

// ---------------------------------------------------------------------------
//  Edge crossing & overlap counters
// ---------------------------------------------------------------------------

function countEdgeCrossings(nodes: LayoutNode[], edges: LayoutEdge[]): number {
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    const a = nodes[edges[i].fromIdx];
    const b = nodes[edges[i].toIdx];
    for (let j = i + 1; j < edges.length; j++) {
      const e2 = edges[j];
      if (edges[i].fromIdx === e2.fromIdx || edges[i].fromIdx === e2.toIdx ||
          edges[i].toIdx === e2.fromIdx || edges[i].toIdx === e2.toIdx) continue;
      const c = nodes[e2.fromIdx];
      const d = nodes[e2.toIdx];
      if (segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y)) count++;
    }
  }
  return count;
}

function countNodeEdgeOverlaps(nodes: LayoutNode[], edges: LayoutEdge[]): number {
  let count = 0;
  for (let ni = 0; ni < nodes.length; ni++) {
    const nd = nodes[ni];
    for (const e of edges) {
      if (e.fromIdx === ni || e.toIdx === ni) continue;
      const a = nodes[e.fromIdx];
      const b = nodes[e.toIdx];
      if (segmentIntersectsRect(a.x, a.y, b.x, b.y, nd.x, nd.y, nd.width, nd.height)) count++;
    }
  }
  return count;
}

function findAllCrossings(nodes: LayoutNode[], edges: LayoutEdge[]): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < edges.length; i++) {
    const a = nodes[edges[i].fromIdx];
    const b = nodes[edges[i].toIdx];
    for (let j = i + 1; j < edges.length; j++) {
      const e2 = edges[j];
      if (edges[i].fromIdx === e2.fromIdx || edges[i].fromIdx === e2.toIdx ||
          edges[i].toIdx === e2.fromIdx || edges[i].toIdx === e2.toIdx) continue;
      const c = nodes[e2.fromIdx];
      const d = nodes[e2.toIdx];
      if (segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y)) {
        result.push([i, j]);
      }
    }
  }
  return result;
}
