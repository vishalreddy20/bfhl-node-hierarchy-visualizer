# BFHL Node Hierarchy API + Visualizer

A production-grade full stack application that parses directed edge strings into tree hierarchies with cycle detection, duplicate identification, and multi-parent resolution.

## 🔗 Live URLs

| Service  | URL |
|----------|-----|
| **API**  | `https://your-render-url.onrender.com/bfhl` |
| **Frontend** | `https://your-vercel-url.vercel.app` |

> Update these after deployment.

## 🛠 Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Node.js, Express, CORS |
| Frontend  | HTML5, CSS3, Vanilla JavaScript |
| Fonts     | Inter, JetBrains Mono (Google Fonts) |

## 📂 Project Structure

```
/
├── backend/
│   ├── index.js          # Express server + POST /bfhl route
│   ├── utils.js          # processData() — core graph logic
│   └── package.json
├── frontend/
│   ├── index.html        # Single-page app shell
│   ├── style.css         # Dark theme design system
│   └── script.js         # API interaction + tree rendering
└── README.md
```

## 🚀 Run Locally

### Backend
```bash
cd backend
npm install
npm start
# → API running on http://localhost:3000
```

### Frontend
Open `frontend/index.html` in your browser, or serve it:
```bash
cd frontend
npx -y serve .
# → Frontend on http://localhost:3000 (or next available port)
```

## 📡 API Reference

### `POST /bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D", "C->E", "E->F", "hello", "G->H", "G->H"]
}
```

**Response:**
```json
{
  "user_id": "vishalgowthamreddy_24042004",
  "email_id": "vr1234@srmist.edu.in",
  "college_roll_number": "RA2311030010001",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": { "D": {} },
          "C": { "E": { "F": {} } }
        }
      },
      "depth": 4
    },
    {
      "root": "G",
      "tree": { "G": { "H": {} } },
      "depth": 2
    }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 2,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

## ✅ Key Rules

- **Depth** = number of nodes on longest root-to-leaf path (not edges)
- **Multi-parent**: first parent wins, subsequent edges silently discarded
- **Duplicates**: only first occurrence used; reported once in `duplicate_edges`
- **Cycles**: `has_cycle: true` only on cyclic entries; never `has_cycle: false`
- **`depth`** field only on non-cyclic trees; never on cycles
- **Largest tree root** tiebreak: lexicographically smaller root wins
