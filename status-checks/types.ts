export type HealthCheckFunction = () => Promise<
  | { ok: true }
  | {
      ok: false
      error: {
        message: string
      }
    }
>
