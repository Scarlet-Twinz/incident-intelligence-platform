import { askOllama } from "./ollama.js";

export async function summarizeIncident(input: {
  title: string;
  description: string;
  service: string;
  severity: string;
  category: string;
}): Promise<string> {
  const prompt = `
Analyze the following operational incident.

Title: ${input.title}
Description: ${input.description}
Service: ${input.service}
Severity: ${input.severity}
Category: ${input.category}

Write a concise operational summary.

Include:
- What happened
- The likely operational impact
- The most important thing an engineer should investigate next

Do not invent facts that are not present.
Keep the response under 120 words.
`.trim();

  return askOllama([
    {
      role: "system",
      content:
        "You are VANTA, an operational intelligence assistant. Give concise, factual incident analysis for engineering teams.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);
}