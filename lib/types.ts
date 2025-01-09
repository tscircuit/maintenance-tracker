export interface StatusCheck {
  timestamp: string
  checks: {
    service: string
    status: "ok" | "error" | "rate-limit"
    error?: string
  }[]
}

export interface Outage {
  service: string
  start: Date
  end: Date
  duration: number
  isOngoing: boolean
}
