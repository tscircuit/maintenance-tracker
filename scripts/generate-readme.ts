import fs from "node:fs"

async function generateReadme() {
  const content = await Bun.file("./statuses.jsonl").text()
  const lines = content.trim().split("\n")
  const lastCheck = JSON.parse(lines[lines.length - 1])

  const readmeContent = await Bun.file("./README.md").text()

  const statusTable = `| Service               | Current Status |
| --------------------- | -------------- |
${lastCheck.checks
  .map(
    (check: any) =>
      `| \`${check.service}\` | ${
        check.status === "ok"
          ? "✅ Operational"
          : `❌ ${check.error || "Error"}`
      } |`,
  )
  .join("\n")}`

  const newContent = readmeContent.replace(
    /<!-- START_STATUS_TABLE -->[\s\S]*<!-- END_STATUS_TABLE -->/,
    `<!-- START_STATUS_TABLE -->\n\n${statusTable}\n\n<!-- END_STATUS_TABLE -->`,
  )

  await Bun.write("./README.md", newContent)
}

generateReadme().catch(console.error)
