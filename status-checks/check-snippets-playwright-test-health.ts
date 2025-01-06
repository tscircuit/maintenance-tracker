import type { HealthCheckFunction } from "./types"
import ky from "ky"

const repo = "tscircuit/snippets"

export const checkSnippetsPlaywrightTestHealth: HealthCheckFunction =
  async () => {
    try {
      console.log("Fetching CI check-runs from GitHub...");
      const response = await ky.get(`https://api.github.com/repos/${repo}/commits/main/check-runs`, {
        timeout: 5000,
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      })

      console.log("GitHub API response headers:", response.headers);
      const checksRes = await response.json<{ check_runs: Array<{ status: string; conclusion: string }> }>();

      console.log("GitHub API response payload:", JSON.stringify(checksRes, null, 2));

      if (!checksRes || !checksRes.check_runs) {
        throw new Error("Invalid response: check_runs array is missing");
      }

      checksRes.check_runs.forEach((check) => {
        console.log(`Status: ${check.status}, Conclusion: ${check.conclusion}`);
      })

      const allChecksComplete = checksRes.check_runs.every(
        (check) => check.status === "completed",
      )
      const allChecksPassing = checksRes.check_runs.every(
        (check) => check.conclusion === "success" || check.conclusion === "skipped",
      )

      if (!allChecksComplete || !allChecksPassing) {
        return {
          ok: false,
          error: {
            message: "Not all CI checks are passing",
          },
        }
      }

      return { ok: true }
    } catch (err: any) {
      console.error("Error during health check:", err.message || err)
      return {
        ok: false,
        error: {
          message: err.toString(),
        },
      }
    }
  }
