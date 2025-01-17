import { readFileSync } from "node:fs";
import type { StatusCheck } from "../lib/types";
import type { Serve } from "bun";

// Match the 2-week retention policy from run-checks-and-write-log.ts
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function getRecentLogs(): StatusCheck[] {
  try {
    const rawContent = readFileSync("./statuses.jsonl", "utf-8").trim();
    if (!rawContent) return [];
    
    const lines = rawContent.split("\n");
    const now = Date.now();

    // Parse lines and filter to last 2 weeks
    const allLogs: StatusCheck[] = lines
      .filter((line: string) => line.trim() !== "")  // Skip empty lines
      .map((line: string) => JSON.parse(line))
      .filter((entry: StatusCheck) => {
        const entryTime = new Date(entry.timestamp).getTime();
        return now - entryTime <= TWO_WEEKS_MS;
      });

    return allLogs;
  } catch (error) {
    console.error("Error reading status logs:", error);
    return [];
  }
}

Bun.serve({
  port: 3000,
  fetch(req: Request) {
    try {
      const url = new URL(req.url);
      
      // Only handle /status.json endpoint
      if (url.pathname === "/status.json") {
        const recentLogs = getRecentLogs();
        return new Response(JSON.stringify(recentLogs, null, 2), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" // Allow cross-origin requests
          }
        });
      }

      // 404 for all other routes
      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Server error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
});

console.log("Status server running on http://localhost:3000/status.json");
