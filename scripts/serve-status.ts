import { readFileSync } from "node:fs"
import type { StatusCheck } from "../lib/types"
import type { Serve } from "bun"
import { calculateUptime } from "../lib/calculate-uptime"

// Match the 2-week retention policy from run-checks-and-write-log.ts
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

async function getRecentLogs(): Promise<StatusCheck[]> {
  try {
    const content = await Bun.file("./statuses.jsonl").text()
    const checks: StatusCheck[] = content
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))

    // Filter to last 2 weeks
    const now = Date.now()
    return checks.filter((entry) => {
      const entryTime = new Date(entry.timestamp).getTime()
      return now - entryTime <= TWO_WEEKS_MS
    })
  } catch (error) {
    console.error("Error reading status logs:", error)
    return []
  }
}

Bun.serve({
  port: 3000,
  async fetch(req: Request) {
    try {
      const url = new URL(req.url)

      // Only handle /status.json endpoint
      if (url.pathname === "/status.json") {
        const recentLogs = await getRecentLogs()

        // Get unique services from the most recent check
        const latestCheck = recentLogs[recentLogs.length - 1]
        if (!latestCheck) {
          return new Response(JSON.stringify({}), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          })
        }

        // Get sorted list of services for consistent ordering
        const services = [
          ...new Set(latestCheck.checks.map((check) => check.service)),
        ].sort()

        // Calculate uptime percentages for each service
        const uptimePercentages: { [key: string]: number } = {}
        for (const service of services) {
          uptimePercentages[service] = calculateUptime(recentLogs, service)
        }

        return new Response(JSON.stringify(uptimePercentages, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow cross-origin requests
          },
        })
      }

      // 404 for all other routes
      return new Response("Not Found", { status: 404 })
    } catch (error) {
      console.error("Server error:", error)
      return new Response("Internal Server Error", { status: 500 })
    }
  },
})

console.log("Status server running on http://localhost:3000/status.json")
