import type { HealthCheckFunction } from "./types"
import ky from "ky"

const repo = "tscircuit/snippets"

export const checkSnippetsPlaywrightTestHealth: HealthCheckFunction =
  async () => {
    try {
      const checksRes = await ky
        .get(`https://api.github.com/repos/${repo}/commits/main/check-runs`, {
          timeout: 5000,
        })
        .json<{ check_runs: Array<{ status: string; conclusion: string }> }>()

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
    } catch (err) {
      return {
        ok: false,
        error: {
          message: err.toString(),
        },
      }
    }
  }
