import React from "react"
import { renderToString } from "react-dom/server"
import { getOutages } from "../lib/get-outages"
import type { StatusCheck } from "lib/types"
import { StatusGrid } from "components/StatusGrid"
import { UptimeGraph } from "components/UptimeGraph"
import { OutageTable } from "components/OutageTable"
import { calculateUptime } from "../lib/calculate-uptime"

async function generateSite() {
  console.log("reading statuses...")
  const content = await Bun.file("./statuses.jsonl").text()
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
  const now = Date.now()
  
  const checks: StatusCheck[] = content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .filter((entry) => {
      const entryTime = new Date(entry.timestamp).getTime()
      return now - entryTime <= TWO_WEEKS_MS
    })
  console.log("found", checks.length, "checks")

  console.log("computing service outages...")
  const outages = getOutages(checks)
  console.log("found", outages.length, "outages")

  console.log("rendering html...")
  const html = renderToString(
    <html lang="en">
      <head>
        <title>tscircuit Maintenance Tracker</title>
        <script src="https://cdn.tailwindcss.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">
            tscircuit Maintenance Tracker
          </h1>
          <StatusGrid checks={checks} />
          <UptimeGraph checks={checks} />
          <OutageTable outages={outages} />
        </div>
      </body>
    </html>,
  )

  console.log("writing to ./public/index.html...")
  await Bun.write("./public/index.html", `<!DOCTYPE html>${html}`)

  // Calculate uptime percentages for status.json
  console.log("generating status.json...")
  const latestCheck = checks[checks.length - 1]
  const services = latestCheck.checks.map((check) => check.service)
  const uptimePercentages: { [key: string]: number } = {}

  for (const service of services) {
    uptimePercentages[service] = calculateUptime(checks, service)
  }

  console.log("writing to ./public/status.json...")
  await Bun.write("./public/status.json", JSON.stringify(uptimePercentages, null, 2))
}

generateSite().catch(console.error)
