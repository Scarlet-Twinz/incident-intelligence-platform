import { pool } from "../db/index.js";
import { askOllama } from "./ollama.js";

export type DuplicateResult = {
  duplicateOf: string | null;
  confidence: number;
  reasoning: string;
};

export async function detectDuplicateIncident(input: {
  incidentId: string;
  title: string;
  description: string;
  service: string;
  category: string;
}): Promise<DuplicateResult> {
  const result = await pool.query(
    `SELECT
      id,
      title,
      description,
      service,
      category
    FROM incidents
    WHERE id <> $1
    ORDER BY created_at DESC
    LIMIT 10`,
    [input.incidentId]
  );

  if (result.rows.length === 0) {
    return {
      duplicateOf: null,
      confidence: 0,
      reasoning: "No previous incidents are available for comparison.",
    };
  }

  const candidates = result.rows
    .map(
      (incident, index) => `
Candidate ${index + 1}
ID: ${incident.id}
Title: ${incident.title}
Description: ${incident.description}
Service: ${incident.service}
Category: ${incident.category}
`
    )
    .join("\n");

  const prompt = `
Determine whether the new incident is a duplicate of one of the previous incidents.

NEW INCIDENT
ID: ${input.incidentId}
Title: ${input.title}
Description: ${input.description}
Service: ${input.service}
Category: ${input.category}

PREVIOUS INCIDENTS
${candidates}

A duplicate means the incidents describe substantially the same underlying operational problem.

Return ONLY valid JSON:

{
  "duplicateOf": "incident UUID or null",
  "confidence": 0.0,
  "reasoning": "Brief factual explanation"
}

Rules:
- Only select an incident if there is meaningful evidence they describe the same problem.
- Do not mark incidents as duplicates merely because they use the same service or category.
- confidence must be between 0 and 1.
- If no strong duplicate exists, use null and confidence 0.
- Do not invent facts.
`.trim();

  try {
    const response = await askOllama([
      {
        role: "system",
        content:
          "You are VANTA, an operational intelligence system specializing in incident correlation. Return only valid JSON.",
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
      duplicateOf?: unknown;
      confidence?: unknown;
      reasoning?: unknown;
    };

    const duplicateOf =
      typeof parsed.duplicateOf === "string" &&
      result.rows.some((row) => row.id === parsed.duplicateOf)
        ? parsed.duplicateOf
        : null;

    const confidenceNumber = Number(parsed.confidence ?? 0);

    const confidence = Math.max(
      0,
      Math.min(1, Number.isFinite(confidenceNumber) ? confidenceNumber : 0)
    );

    const reasoning =
      String(parsed.reasoning ?? "").trim() ||
      "No strong duplicate relationship was identified.";

    if (!duplicateOf || confidence < 0.7) {
      return {
        duplicateOf: null,
        confidence: duplicateOf ? confidence : 0,
        reasoning,
      };
    }

    return {
      duplicateOf,
      confidence,
      reasoning,
    };
  } catch (error) {
    console.error("AI duplicate detection failed:", error);

    return {
      duplicateOf: null,
      confidence: 0,
      reasoning: "Duplicate analysis could not be completed.",
    };
  }
}