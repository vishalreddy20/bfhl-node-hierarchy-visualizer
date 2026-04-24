// Test runner for all 7 validation cases
const { processData } = require('./utils');

function test(name, data, validate) {
  const result = processData(data);
  const pass = validate(result);
  console.log(`${pass ? '✅' : '❌'} ${name}`);
  if (!pass) {
    console.log('   Result:', JSON.stringify(result, null, 2));
  }
}

// Test 1 — Standard tree
test('Test 1: Standard tree (A→C→E→F = depth 4)', 
  ["A->B", "A->C", "B->D", "C->E", "E->F"],
  r => r.hierarchies.length === 1 && r.hierarchies[0].root === 'A' && r.hierarchies[0].depth === 4
);

// Test 2 — Cycle
test('Test 2: Cycle detection (X→Y→Z→X)',
  ["X->Y", "Y->Z", "Z->X"],
  r => {
    const h = r.hierarchies;
    // All nodes are children, so no roots → pure cycle handling
    // Should get has_cycle: true
    return h.length === 1 && h[0].has_cycle === true && h[0].root === 'X' && !('depth' in h[0]);
  }
);

// Test 3 — Duplicates
test('Test 3: Duplicate edges (G->H x3)',
  ["G->H", "G->H", "G->H", "G->I"],
  r => {
    return r.duplicate_edges.length === 1 && r.duplicate_edges[0] === 'G->H'
      && r.hierarchies[0].tree['G']['H'] !== undefined
      && r.hierarchies[0].tree['G']['I'] !== undefined;
  }
);

// Test 4 — Invalid entries (note: " A->B " trims to "A->B" which is VALID)
test('Test 4: Invalid entries filtering',
  ["hello", "1->2", "AB->C", "A-B", "A->", "A->A", "", " A->B "],
  r => {
    // 6 invalid: hello, 1->2, AB->C, A-B, A->, A->A
    // empty string "" → pushed as invalid
    // " A->B " trims to "A->B" → VALID
    // So 7 items: 6 invalids + "" = 7... wait let me recount
    // "hello" → invalid, "1->2" → invalid (digits), "AB->C" → invalid (multi-char), 
    // "A-B" → invalid (no arrow), "A->" → invalid (fails regex), "A->A" → self-loop → invalid
    // "" → empty string → invalid
    // " A->B " → trims to "A->B" → VALID
    // So invalid_entries should have 7 items and hierarchies should have 1 tree with A->B
    return r.invalid_entries.length === 7 && r.hierarchies.length === 1 
      && r.hierarchies[0].root === 'A' && r.hierarchies[0].depth === 2;
  }
);

// Test 5 — Multi-parent (diamond)
test('Test 5: Multi-parent diamond (A owns D, B->D silently discarded)',
  ["A->D", "B->D", "A->E", "B->F"],
  r => {
    const hA = r.hierarchies.find(h => h.root === 'A');
    const hB = r.hierarchies.find(h => h.root === 'B');
    return hA && hB 
      && hA.depth === 2 && hB.depth === 2
      && JSON.stringify(hA.tree) === JSON.stringify({ A: { D: {}, E: {} } })
      && JSON.stringify(hB.tree) === JSON.stringify({ B: { F: {} } })
      && r.invalid_entries.length === 0 && r.duplicate_edges.length === 0;
  }
);

// Test 6 — Pure cycle (no roots)
test('Test 6: Pure cycle with no roots (X→Y→X)',
  ["X->Y", "Y->X"],
  r => {
    // X->Y: parentMap[Y]=X, Y->X: parentMap[X]=Y
    // Both are children → no roots → pure cycle step
    // Since X->Y and Y->X: childSet = {Y, X}. nodes = {X, Y}. roots = [] (all in childSet)
    // Wait: parentMap. X->Y: C=Y, parentMap[Y]=X. Y->X: C=X, parentMap[X]=Y.
    // childSet = {Y, X}. So no roots.
    // Pure cycle: component {X, Y}, sorted → X is root
    return r.hierarchies.length === 1 && r.hierarchies[0].root === 'X' 
      && r.hierarchies[0].has_cycle === true && !('depth' in r.hierarchies[0]);
  }
);

// Test 7 — Summary tiebreak
test('Test 7: Summary tiebreak (A vs C, both depth 2 → A wins)',
  ["A->B", "C->D"],
  r => {
    return r.summary.largest_tree_root === 'A' && r.summary.total_trees === 2;
  }
);

// Extra: has_cycle should never be false
test('Extra: No has_cycle:false on normal trees',
  ["A->B"],
  r => !('has_cycle' in r.hierarchies[0])
);

// Extra: Empty data
test('Extra: Empty/undefined data handling',
  undefined,
  r => r.hierarchies.length === 0 && r.invalid_entries.length === 0
);

console.log('\nDone.');
