import { askOllama } from "./ollama.js";

export type IncidentPriority = {
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
};

function normalizePriority(value: unknown): IncidentPriority["priority"] {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (
    normalized === "CRITICAL" ||
    normalized === "HIGH" ||
    normalized === "MEDIUM" ||
    normalized === "LOW"
  ) {
    return normalized;
  }

  return "MEDIUM";
}

function fallbackPriority(input: {
  title: string;
  description: string;
  service: string;
  severity: string;
  category: string;
}): IncidentPriority {
  const text =
    `${input.title} ${input.description} ${input.service} ${input.category}`
      .toLowerCase();

  if (
    input.severity.toUpperCase() === "CRITICAL" ||
    text.includes("all customers") ||
    text.includes("complete outage") ||
    text.includes("data loss") ||
    text.includes("security breach")
  ) {
    return {
      priority: "CRITICAL",
      reasoning:
        "The incident contains signals indicating severe operational impact or a potentially critical service disruption.",
    };
  }

  if (
    input.severity.toUpperCase() === "HIGH" ||
    text.includes("payment") ||
    text.includes("authentication") ||
    text.includes("production outage") ||
    text.includes("failed transactions")
  ) {
    return {
      priority: "HIGH",
      reasoning:
        "The incident affects an important operational capability and may have significant customer or service impact.",
    };
  }

  if (input.severity.toUpperCase() === "LOW") {
    return {
      priority: "LOW",
      reasoning:
        "The incident has been marked with low severity and does not contain strong signals of widespread operational impact.",
    };
  }

  return {
    priority: "MEDIUM",
    reasoning:
      "The incident appears operationally relevant but does not contain enough evidence to classify it as critical or high priority.",
  };
}

export async function detectIncidentPriority(input: {
  title: string;
  description: string;
  service: string;
  severity: string;
  category: string;
}): Promise<IncidentPriority> {
  const prompt = `
Analyze the operational priority of this incident.

Title: ${input.title}
Description: ${input.description}
Service: ${input.service}
Severity: ${input.severity}
Category: ${input.category}

Determine how urgently an engineering team should investigate this incident.

Priority levels:

CRITICAL:
Immediate attention required. Potential major outage, severe customer impact, security incident, data loss, or critical production failure.

HIGH:
Significant operational or customer impact. Should be investigated urgently.

MEDIUM:
Meaningful operational issue that should be investigated but does not appear immediately critical.

LOW:
Limited impact, informational issue, or minor operational problem.

Return ONLY valid JSON in exactly this format:

{
  "priority": "CRITICAL | HIGH | MEDIUM | LOW",
  "reasoning": "Brief factual explanation"
}

Do not invent facts that are not present.
`.trim();

  try {
    const response = await askOllama([
      {
        role: "system",
        content:
          "You are VANTA, an operational intelligence system. Analyze incidents conservatively and return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const cleaned = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      priority?: unknown;
      reasoning?: unknown;
    };

    const priority = normalizePriority(parsed.priority);
    const reasoning = String(parsed.reasoning ?? "").trim();

    if (!reasoning) {
      return fallbackPriority(input);
    }

    return {
      priority,
      reasoning,
    };
  } catch (error) {
    console.error("AI priority detection failed:", error);

    return fallbackPriority(input);
  }
}