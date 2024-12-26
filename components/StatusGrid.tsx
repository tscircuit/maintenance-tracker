import type { StatusCheck } from "lib/types"

function calculateUptime(checks: StatusCheck[], service: string): number {
  const serviceChecks = checks.flatMap((check) =>
    check.checks.filter((c) => c.service === service),
  )
  const successfulChecks = serviceChecks.filter(
    (check) => check.status === "ok",
  )
  return (successfulChecks.length / serviceChecks.length) * 100
}

export function StatusGrid({ checks }: { checks: StatusCheck[] }) {
  const latestCheck = checks[checks.length - 1]
  const services = latestCheck.checks.map((check) => check.service)
  console.log("rendering status grid...")

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {services.map((service) => {
        const uptime = calculateUptime(checks, service)
        const latest = latestCheck.checks.find((c) => c.service === service)

        return (
          <div key={service} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">{service}</h3>
            <div className="flex items-center mb-4">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${latest?.status === "ok" ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>{latest?.status === "ok" ? "Operational" : "Error"}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{uptime.toFixed(2)}%</div>
            <div className="text-sm text-gray-600">Uptime (14 days)</div>
          </div>
        )
      })}
    </div>
  )
}
