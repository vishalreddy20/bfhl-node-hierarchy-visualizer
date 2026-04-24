const express = require('express');
const cors = require('cors');
const { processData } = require('./utils');

const app = express();

// Enable CORS globally (all origins)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// ─── POST /bfhl ─────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  try {
    let { data } = req.body;
    if (!data || !Array.isArray(data)) {
      data = [];
    }
    const result = processData(data);

    res.json({
      user_id: "dhonevishalgowthamreddy_20102005",
      email_id: "vd0602@srmist.edu.in",
      college_roll_number: "RA2311056010013",
      ...result
    });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ─── Start server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BFHL API running on port ${PORT}`);
});
