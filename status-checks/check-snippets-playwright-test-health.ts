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
        .json<{
          check_runs: Array<{
            status: string
            conclusion: string
            name: string
            completed_at: string
            check_suite: { id: number }
          }>
        }>()

      // Log the full check runs payload for investigation
      console.log("Fetched check runs payload:", JSON.stringify(checksRes, null, 2))

      // Log details for each check run
      type CheckRun = {
        status: string
        conclusion: string
        name: string
        completed_at: string
        check_suite: { id: number }
      }

      checksRes.check_runs.forEach((run: CheckRun, idx: number) => {
        console.log(
          `Check #${idx}: name=${run.name}, status=${run.status}, conclusion=${run.conclusion}, ` +
          `suiteID=${run.check_suite.id}, completedAt=${run.completed_at}`
        )
      })

      const allChecksComplete = checksRes.check_runs.every(
        (check: CheckRun) => check.status === "completed",
      )
      const allChecksPassing = checksRes.check_runs.every(
        (check: CheckRun) => check.conclusion === "success",
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
