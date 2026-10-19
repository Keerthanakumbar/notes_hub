import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors()); // let the React dev server (other origin) call us
app.use(express.json()); // parse JSON request bodies

// Wraps async routes so a thrown error goes to the error middleware below
// instead of crashing the process.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// --- helpers -----------------------------------------------------------

// Validate the "name" body field. Returns an error string or null.
function validateName(body) {
  if (typeof body?.name !== "string") return "name is required";
  const name = body.name.trim();
  if (name.length === 0) return "name cannot be empty";
  if (name.length > 100) return "name must be 100 characters or fewer";
  return null;
}

// --- routes ------------------------------------------------------------

app.get("/api/health", wrap(async (_req, res) => {
  await pool.query("SELECT 1"); // proves the DB connection works too
  res.json({ status: "ok" });
}));

// READ — all names
app.get("/api/names", wrap(async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM names ORDER BY id ASC");
  res.json(rows);
}));

// CREATE — one name
app.post("/api/names", wrap(async (req, res) => {
  const error = validateName(req.body);
  if (error) return res.status(400).json({ error });

  const name = req.body.name.trim();
  // $1 is a placeholder: the value is sent separately, never as SQL text.
  // This is what makes SQL injection impossible.
  const { rows } = await pool.query(
    "INSERT INTO names (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.status(201).json(rows[0]);
}));

// UPDATE — one name by id
app.put("/api/names/:id", wrap(async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id must be a number" });

  const error = validateName(req.body);
  if (error) return res.status(400).json({ error });

  const name = req.body.name.trim();
  const { rows } = await pool.query(
    "UPDATE names SET name = $1 WHERE id = $2 RETURNING *",
    [name, id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "name not found" });
  res.json(rows[0]);
}));

// DELETE — one name by id
app.delete("/api/names/:id", wrap(async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id must be a number" });

  const { rowCount } = await pool.query("DELETE FROM names WHERE id = $1", [id]);
  if (rowCount === 0) return res.status(404).json({ error: "name not found" });
  res.status(204).end(); // success, no body needed
}));

// --- error middleware ---------------------------------------------------
// Anything a route throws lands here: log it, tell the client it's us, not them.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
