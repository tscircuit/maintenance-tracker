import type { StatusCheck } from "./types"

export function calculateUptime(checks: StatusCheck[], service: string): number {
  const serviceChecks = checks.flatMap((check) =>
    check.checks.filter((c) => c.service === service),
  )
  if (serviceChecks.length === 0) {
    return 0
  }
  const successfulChecks = serviceChecks.filter((check) => check.status === "ok")
  return Number((successfulChecks.length / serviceChecks.length * 100).toFixed(2))
}
