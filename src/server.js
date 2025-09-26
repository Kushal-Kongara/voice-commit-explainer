import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { getLatestCommitWithDiff } from "./lib/github.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "voice-commit-explainer", ts: Date.now() });
});

app.get("/api/commit/last", async (_req, res) => {
  try {
    const payload = await getLatestCommitWithDiff();
    const Schema = z.object({
      sha: z.string(),
      message: z.string(),
      filesChanged: z.array(z.string()),
      diff: z.string()
    });
    res.json(Schema.parse(payload));
  } catch (err) {
    console.error("Error in /api/commit/last:", err);
    res.status(500).json({
      error: "Failed to fetch latest commit",
      details: err?.message ?? String(err)
    });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});