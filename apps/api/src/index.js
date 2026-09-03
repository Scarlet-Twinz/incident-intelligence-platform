import Fastify from "fastify";
import cors from "@fastify/cors";
import { pool, testDatabaseConnection } from "./db/index.js";
import { classifyIncident } from "./ai/classifier.js";
import { testRedisConnection } from "./redis/index.js";
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
    }
    catch (error) {
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
    }
    catch (error) {
        app.log.error(error);
        return {
            status: "error",
            redis: "disconnected",
        };
    }
});
app.get("/incidents", async () => {
    const result = await pool.query(`SELECT
      id,
      title,
      description,
      service,
      severity,
      status,
      category,
      classification_confidence,
      classification_reasoning,
      created_at,
      updated_at
    FROM incidents
    ORDER BY created_at DESC`);
    return {
        incidents: result.rows,
    };
});
app.post("/incidents", async (request, reply) => {
    const { title, description, service, severity = "MEDIUM", } = request.body;
    if (!title?.trim() || !description?.trim() || !service?.trim()) {
        return reply.code(400).send({
            error: "title, description, and service are required",
        });
    }
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanService = service.trim();
    const classification = classifyIncident(cleanTitle, cleanDescription);
    const result = await pool.query(`INSERT INTO incidents (
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
      created_at,
      updated_at`, [
        cleanTitle,
        cleanDescription,
        cleanService,
        severity,
        classification.category,
        classification.confidence,
        classification.reasoning,
    ]);
    return reply.code(201).send({
        incident: result.rows[0],
    });
});
app.post("/ai/classify", async (request, reply) => {
    const { title, description } = request.body;
    if (!title?.trim() || !description?.trim()) {
        return reply.code(400).send({
            error: "title and description are required",
        });
    }
    const classification = classifyIncident(title.trim(), description.trim());
    return {
        classification,
    };
});
const port = Number(process.env.PORT ?? 4000);
try {
    await app.listen({
        port,
        host: "0.0.0.0",
    });
    console.log(`API running on http://localhost:${port}`);
}
catch (error) {
    app.log.error(error);
    await pool.end();
    process.exit(1);
}
