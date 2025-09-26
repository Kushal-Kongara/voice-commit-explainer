import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const required = ["GITHUB_OWNER", "GITHUB_REPO", "GITHUB_TOKEN"];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env: ${k}`);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO  = process.env.GITHUB_REPO;

export async function getLatestCommitWithDiff() {
  const commits = await octokit.repos.listCommits({
    owner: OWNER,
    repo: REPO,
    per_page: 1
  });
  if (!commits.data.length) throw new Error("No commits found");

  const latestSha = commits.data[0].sha;
  const commitDetail = await octokit.repos.getCommit({
    owner: OWNER,
    repo: REPO,
    ref: latestSha
  });

  const message = commitDetail.data.commit?.message || "";
  const files = (commitDetail.data.files || []).map(f => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    patch: f.patch || ""
  }));

  const MAX_LINES = 600;
  const diffs = files
    .map(f => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch || ""}`)
    .join("\n\n");
  const trimmedDiff = diffs.split("\n").slice(0, MAX_LINES).join("\n");

  return {
    sha: latestSha,
    message,
    filesChanged: files.map(f => f.filename),
    diff: trimmedDiff
  };
}