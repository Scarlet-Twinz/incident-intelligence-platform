import Fastify from "fastify";
import cors from "@fastify/cors";
import { pool, testDatabaseConnection } from "./db/index.js";
import { classifyIncident } from "./ai/classifier.js";
import { streamOllama } from "./ai/ollama.js";
import { testRedisConnection } from "./redis/index.js";
import { incidentQueue } from "./queue/incident.queue.js";
import {
  addClient,
  broadcastEvent,
  getClientCount,
} from "./realtime/events.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "incident-intelligence-api",
  };
});

app.get("/health/database", async () => {
  try {
    const result = await testDatabaseConnection();

    return {
      status: "ok",
      database: "connected",
      time: result.now,
    };
  } catch (error) {
    app.log.error(error);

    return {
      status: "error",
      database: "disconnected",
    };
  }
});

app.get("/health/redis", async () => {
  try {
    const result = await testRedisConnection();

    return {
      status: "ok",
      redis: "connected",
      response: result,
    };
  } catch (error) {
    app.log.error(error);

    return {
      status: "error",
      redis: "disconnected",
    };
  }
});

app.get("/health/realtime", async () => {
  return {
    status: "ok",
    realtime: "connected",
    clients: getClientCount(),
  };
});

app.get("/realtime", async (_request, reply) => {
  reply.hijack();

  const response = reply.raw;

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  response.write(
    `event: connected\ndata: ${JSON.stringify({
      status: "connected",
    })}\n\n`
  );

  addClient(response);

  const heartbeat = setInterval(() => {
    try {
      response.write(
        `event: heartbeat\ndata: ${JSON.stringify({
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  response.on("close", () => {
    clearInterval(heartbeat);
  });
});

app.get("/incidents", async () => {
  const result = await pool.query(
    `SELECT
      id,
      title,
      description,
      service,
      severity,
      status,
      category,
      classification_confidence,
      classification_reasoning,
      priority,
      priority_reasoning,
      duplicate_of,
      duplicate_confidence,
      duplicate_reasoning,
      assignee,
      assigned_at,
      ai_summary,
      ai_processed_at,
      created_at,
      updated_at
    FROM incidents
    ORDER BY created_at DESC`
  );

  return {
    incidents: result.rows,
  };
});

app.get("/analytics", async () => {
  const [
    totalResult,
    openResult,
    priorityResult,
    severityResult,
    categoryResult,
    serviceResult,
    assignmentResult,
    aiResult,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM incidents`
    ),

    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM incidents
       WHERE status = 'OPEN'`
    ),

    pool.query(
      `SELECT priority, COUNT(*)::int AS count
       FROM incidents
       GROUP BY priority
       ORDER BY
         CASE priority
           WHEN 'CRITICAL' THEN 1
           WHEN 'HIGH' THEN 2
           WHEN 'MEDIUM' THEN 3
           WHEN 'LOW' THEN 4
           ELSE 5
         END`
    ),

    pool.query(
      `SELECT severity, COUNT(*)::int AS count
       FROM incidents
       GROUP BY severity
       ORDER BY count DESC`
    ),

    pool.query(
      `SELECT category, COUNT(*)::int AS count
       FROM incidents
       GROUP BY category
       ORDER BY count DESC`
    ),

    pool.query(
      `SELECT service, COUNT(*)::int AS count
       FROM incidents
       GROUP BY service
       ORDER BY count DESC`
    ),

    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE assignee IS NOT NULL)::int AS assigned,
         COUNT(*) FILTER (WHERE assignee IS NULL)::int AS unassigned
       FROM incidents`
    ),

    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ai_processed_at IS NOT NULL)::int AS processed,
         COUNT(*) FILTER (WHERE ai_processed_at IS NULL)::int AS pending
       FROM incidents`
    ),
  ]);

  const priorityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const row of priorityResult.rows) {
    if (row.priority in priorityCounts) {
      priorityCounts[
        row.priority as keyof typeof priorityCounts
      ] = row.count;
    }
  }

  return {
    analytics: {
      totalIncidents: totalResult.rows[0].total,
      openIncidents: openResult.rows[0].total,

      priority: priorityCounts,

      severity: severityResult.rows,

      categories: categoryResult.rows,

      services: serviceResult.rows,

      assignment: {
        assigned: assignmentResult.rows[0].assigned,
        unassigned: assignmentResult.rows[0].unassigned,
      },

      aiProcessing: {
        processed: aiResult.rows[0].processed,
        pending: aiResult.rows[0].pending,
      },
    },
  };
});

app.post<{
  Body: {
    title: string;
    description: string;
    service: string;
    severity?: string;
  };
}>("/incidents", async (request, reply) => {
  const {
    title,
    description,
    service,
    severity = "MEDIUM",
  } = request.body;

  if (!title?.trim() || !description?.trim() || !service?.trim()) {
    return reply.code(400).send({
      error: "title, description, and service are required",
    });
  }

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  const cleanService = service.trim();

  const classification = classifyIncident(
    cleanTitle,
    cleanDescription
  );

  const result = await pool.query(
    `INSERT INTO incidents (
      title,
      description,
      service,
      severity,
      category,
      classification_confidence,
      classification_reasoning
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      title,
      description,
      service,
      severity,
      status,
      category,
      classification_confidence,
      classification_reasoning,
      priority,
      priority_reasoning,
      duplicate_of,
      duplicate_confidence,
      duplicate_reasoning,
      assignee,
      assigned_at,
      ai_summary,
      ai_processed_at,
      created_at,
      updated_at`,
    [
      cleanTitle,
      cleanDescription,
      cleanService,
      severity,
      classification.category,
      classification.confidence,
      classification.reasoning,
    ]
  );

  const incident = result.rows[0];

  const job = await incidentQueue.add("process-incident", {
    incidentId: incident.id,
    title: incident.title,
    description: incident.description,
    service: incident.service,
    severity: incident.severity,
    category: incident.category,
  });

  broadcastEvent("incident.created", {
    incident,
    jobId: job.id,
  });

  return reply.code(201).send({
    incident,
    job: {
      id: job.id,
      status: "queued",
    },
  });
});

app.patch<{
  Params: {
    id: string;
  };
  Body: {
    assignee?: string | null;
  };
}>("/incidents/:id/assignment", async (request, reply) => {
  const { id } = request.params;
  const assignee = request.body.assignee?.trim() || null;

  const result = await pool.query(
    `UPDATE incidents
     SET
       assignee = $1,
       assigned_at = CASE
         WHEN $1 IS NULL THEN NULL
         ELSE NOW()
       END,
       updated_at = NOW()
     WHERE id = $2
     RETURNING
       id,
       title,
       assignee,
       assigned_at,
       updated_at`,
    [assignee, id]
  );

  if (result.rowCount === 0) {
    return reply.code(404).send({
      error: "Incident not found",
    });
  }

  const incident = result.rows[0];

  broadcastEvent("incident.assigned", {
    incident,
  });

  return {
    incident,
  };
});

app.post<{
  Body: {
    title: string;
    description: string;
  };
}>("/ai/classify", async (request, reply) => {
  const { title, description } = request.body;

  if (!title?.trim() || !description?.trim()) {
    return reply.code(400).send({
      error: "title and description are required",
    });
  }

  const classification = classifyIncident(
    title.trim(),
    description.trim()
  );

  return {
    classification,
  };
});

/*
 * LYROMI — AI Operational Assistant
 *
 * Streams Qwen responses from Ollama directly to the client.
 */
app.post<{
  Body: {
    message: string;
  };
}>("/ai/chat", async (request, reply) => {
  const message = request.body?.message?.trim();

  if (!message) {
    return reply.code(400).send({
      error: "message is required",
    });
  }

  try {
    const incidentResult = await pool.query(
      `SELECT
        id,
        title,
        description,
        service,
        severity,
        status,
        category,
        priority,
        assignee,
        ai_summary,
        created_at
      FROM incidents
      ORDER BY created_at DESC
      LIMIT 20`
    );

    const incidents = incidentResult.rows;

    const context =
      incidents.length > 0
        ? incidents
            .map(
              (incident) => `
Incident ID: ${incident.id}
Title: ${incident.title}
Description: ${incident.description}
Service: ${incident.service}
Severity: ${incident.severity}
Status: ${incident.status}
Category: ${incident.category}
Priority: ${incident.priority}
Assignee: ${incident.assignee ?? "Unassigned"}
AI Summary: ${incident.ai_summary ?? "AI analysis pending"}
Created: ${incident.created_at}
`
            )
            .join("\n")
        : "No incidents currently exist.";

    const systemPrompt = `
You are LYROMI, the AI Operational Assistant inside VANTA.

VANTA is an operational intelligence platform used by engineering teams to understand and respond to incidents.

Your job is to analyze the operational data provided to you and answer the user's question clearly and concisely.

Rules:
- Use the incident data provided as your source of truth.
- Do not invent incidents, metrics, causes, or events.
- If the available data does not answer the question, say so.
- Prioritize CRITICAL and HIGH priority incidents when discussing urgency.
- Mention specific incident titles and services when useful.
- Keep responses concise and operationally useful.
- Do not claim that you performed an action unless the system actually performed it.
- You are an operational assistant, not a generic conversational chatbot.

CURRENT VANTA INCIDENT DATA:

${context}
`.trim();

    const ollamaResponse = await streamOllama([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ]);

    if (!ollamaResponse.body) {
      throw new Error(
        "Ollama returned no streaming response body"
      );
    }

    reply.hijack();

    const response = reply.raw;

    response.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
      "Access-Control-Allow-Origin": "*",
    });

    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, {
          stream: true,
        });

        if (chunk) {
          response.write(chunk);
        }
      }

      const finalChunk = decoder.decode();

      if (finalChunk) {
        response.write(finalChunk);
      }
    } finally {
      reader.releaseLock();
    }

    response.end();
  } catch (error) {
    console.error("LYROMI chat failed:", error);

    if (!reply.raw.headersSent) {
      return reply.code(500).send({
        error: "LYROMI could not process the request",
      });
    }

    reply.raw.end();
  }
});

const port = Number(process.env.PORT ?? 4000);

try {
  await app.listen({
    port,
    host: "0.0.0.0",
  });

  console.log(`API running on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}