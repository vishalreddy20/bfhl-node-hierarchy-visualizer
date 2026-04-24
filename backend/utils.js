function processData(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seen = new Set();             // tracks exact edge strings already processed
  const edges = [];                   // valid, non-duplicate edges
  const graph = {};                   // { parent: [children] }
  const parentMap = {};               // { child: firstParent } — first parent wins
  const childSet = new Set();         // all nodes that appear as a child
  const nodes = new Set();            // ALL nodes encountered
  const visitedNodes = new Set();     // global tracker — prevents reprocessing nodes

  if (!Array.isArray(data) || data.length === 0) {
    return {
      hierarchies: [],
      invalid_entries,
      duplicate_edges,
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" }
    };
  }

  // STEP 1 — VALIDATION + DEDUPLICATION
  for (const item of data) {
    if (typeof item !== 'string' || item === '') {
      invalid_entries.push(item);
      continue;
    }
    const trimmed = item.trim();
    if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
      invalid_entries.push(trimmed);
      continue;
    }
    const [parent, child] = trimmed.split('->');
    if (parent === child) {
      invalid_entries.push(trimmed);
      continue;
    }
    if (seen.has(trimmed)) {
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      continue;
    }
    seen.add(trimmed);
    edges.push(trimmed);
  }

  // STEP 2 — GRAPH CONSTRUCTION
  for (const edge of edges) {
    const [p, c] = edge.split('->');
    nodes.add(p);
    nodes.add(c);
    if (parentMap[c] !== undefined) {
      continue; // SILENTLY DISCARD
    } else {
      parentMap[c] = p;
      graph[p] = graph[p] || [];
      graph[p].push(c);
      childSet.add(c);
    }
  }

  // STEP 3 — FIND AND SORT ROOTS
  const roots = [...nodes]
    .filter(n => !childSet.has(n))
    .sort();

  // STEP 4 — DFS FUNCTION
  function dfs(node, pathSet) {
    if (pathSet.has(node)) return "CYCLE";
    pathSet.add(node);
    const children = graph[node] || [];
    if (children.length === 0) {
      return { tree: { [node]: {} }, depth: 1 };
    }
    const subtree = {};
    subtree[node] = {};
    let maxChildDepth = 0;
    for (const child of children) {
      const result = dfs(child, new Set(pathSet));
      if (result === "CYCLE") return "CYCLE";
      subtree[node][child] = result.tree[child];
      maxChildDepth = Math.max(maxChildDepth, result.depth);
    }
    return { tree: subtree, depth: 1 + maxChildDepth };
  }

  // STEP 5 — PROCESS ROOTED TREES
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let maxDepth = 0;
  let largest_tree_root = "";

  for (const root of roots) {
    const result = dfs(root, new Set());
    
    function markVisited(n) {
      if (visitedNodes.has(n)) return;
      visitedNodes.add(n);
      (graph[n] || []).forEach(markVisited);
    }
    markVisited(root);

    if (result === "CYCLE") {
      hierarchies.push({ root, tree: {}, has_cycle: true });
      total_cycles++;
    } else {
      hierarchies.push({ root, tree: result.tree, depth: result.depth });
      total_trees++;
      if (result.depth > maxDepth) {
        maxDepth = result.depth;
        largest_tree_root = root;
      } else if (result.depth === maxDepth && root < largest_tree_root) {
        largest_tree_root = root;
      }
    }
  }

  // STEP 6 — HANDLE PURE CYCLES
  const unvisited = [...nodes].filter(n => !visitedNodes.has(n));
  if (unvisited.length > 0) {
    function getComponent(start, visited) {
      const component = new Set();
      const queue = [start];
      while (queue.length) {
        const n = queue.shift();
        if (component.has(n)) continue;
        component.add(n);
        visited.add(n);
        // traverse both outgoing and incoming edges
        (graph[n] || []).forEach(c => { if (!component.has(c)) queue.push(c); });
        Object.keys(graph).forEach(p => {
          if ((graph[p] || []).includes(n) && !component.has(p)) queue.push(p);
        });
      }
      return [...component].sort();
    }

    const pureVisited = new Set();
    for (const node of unvisited) {
      if (pureVisited.has(node)) continue;
      const component = getComponent(node, pureVisited);
      const root = component[0];  // lexicographically smallest
      hierarchies.push({ root, tree: {}, has_cycle: true });
      total_cycles++;
    }
  }

  // STEP 7 — EDGE CASES
  if (total_trees === 0) {
    largest_tree_root = "";
  }

  // STEP 8 — RETURN
  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  };
}

module.exports = { processData };
