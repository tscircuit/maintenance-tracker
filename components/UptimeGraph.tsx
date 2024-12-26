import React from "react"
import { renderToString } from "react-dom/server"
import { getOutages } from "../lib/get-outages"
import type { StatusCheck } from "lib/types"

export function UptimeGraph({ checks }: { checks: StatusCheck[] }) {
  const services = checks[0].checks.map((check) => check.service)

  // Create a map of hour strings to checks for efficient lookup
  const hourChecksMap = new Map<string, StatusCheck[]>()
  const hours: string[] = []

  // Build the map and hours array in a single pass through checks
  for (const check of checks) {
    const date = new Date(check.timestamp)
    const hourKey = `${date.toLocaleDateString()} ${date.getHours()}:00`

    if (!hourChecksMap.has(hourKey)) {
      hourChecksMap.set(hourKey, [])
      hours.push(hourKey)
    }
    hourChecksMap.get(hourKey)!.push(check)
  }

  // Sort hours once
  hours.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  console.log("rendering uptime graph...", hours.length)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Uptime History</h3>
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service} className="relative">
            <div className="text-sm font-medium mb-1">{service}</div>
            <div className="grid grid-flow-col auto-cols-fr gap-px w-full">
              {hours.map((hour) => {
                const hourChecks = hourChecksMap.get(hour) || []
                const serviceChecks = hourChecks.flatMap((check) =>
                  check.checks.filter((c) => c.service === service),
                )
                const hasError = serviceChecks.some(
                  (check) => check.status === "error",
                )
                const allErrors = serviceChecks.every(
                  (check) => check.status === "error",
                )

                return (
                  <div
                    key={hour}
                    className={`h-8 w-full ${
                      allErrors
                        ? "bg-red-200"
                        : hasError
                          ? "bg-yellow-200"
                          : "bg-green-200"
                    }`}
                    title={`${hour}\n${hourChecks
                      .map(
                        (check) =>
                          `${new Date(check.timestamp).toLocaleString()}: ${check.checks.find((c) => c.service === service)?.status === "error" ? "Issues Detected" : "Operational"}`,
                      )
                      .join("\n")}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
