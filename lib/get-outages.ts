import type { Outage, StatusCheck } from "./types"

export const getOutages = (checks: StatusCheck[]) => {
  const outages: Array<Outage> = []

  // Group checks by service
  const serviceChecks = new Map<string, StatusCheck[]>()
  for (const check of checks) {
    for (const serviceCheck of check.checks) {
      if (!serviceChecks.has(serviceCheck.service)) {
        serviceChecks.set(serviceCheck.service, [])
      }
      serviceChecks.get(serviceCheck.service)?.push({
        ...check,
        checks: [serviceCheck],
      })
    }
  }

  // Find outage periods for each service
  for (const [service, checks] of serviceChecks) {
    let currentOutage: { start: Date; end: Date } | null = null

    checks.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    for (const check of checks) {
      const timestamp = new Date(check.timestamp)
      const hasError = check.checks[0].status === "error"

      if (hasError && !currentOutage) {
        // Start new outage
        currentOutage = {
          start: timestamp,
          end: timestamp,
        }
      } else if (!hasError && currentOutage) {
        // End current outage
        currentOutage.end = timestamp
        outages.push({
          service,
          start: currentOutage.start,
          end: currentOutage.end,
          duration: currentOutage.end.getTime() - currentOutage.start.getTime(),
          isOngoing: false,
        })
        currentOutage = null
      } else if (currentOutage) {
        // Update end time of ongoing outage
        currentOutage.end = timestamp
      }
    }

    // Handle ongoing outage
    if (currentOutage) {
      outages.push({
        service,
        start: currentOutage.start,
        end: currentOutage.end,
        duration: currentOutage.end.getTime() - currentOutage.start.getTime(),
        isOngoing: true,
      })
    }
  }

  return outages
}
