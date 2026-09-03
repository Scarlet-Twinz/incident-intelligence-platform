import { Worker } from "bullmq";
import { pool } from "./db/index.js";
import { summarizeIncident } from "./ai/summarizer.js";
import { detectIncidentPriority } from "./ai/priority.js";
import { detectDuplicateIncident } from "./ai/duplicate.js";

const worker = new Worker(
  "incident-processing",
  async (job) => {
    console.log("Processing incident job:", job.id);
    console.log("Incident data:", job.data);

    const {
      incidentId,
      title,
      description,
      service,
      severity,
      category,
    } = job.data;

    try {
      console.log(`Generating AI summary for incident ${incidentId}...`);

      const summary = await summarizeIncident({
        title,
        description,
        service,
        severity,
        category,
      });

      console.log(`AI summary generated for incident ${incidentId}`);

      console.log(`Detecting AI priority for incident ${incidentId}...`);

      const priorityResult = await detectIncidentPriority({
        title,
        description,
        service,
        severity,
        category,
      });

      console.log(
        `AI priority detected for incident ${incidentId}: ${priorityResult.priority}`
      );

      console.log(`Checking duplicate incidents for ${incidentId}...`);

      const duplicateResult = await detectDuplicateIncident({
        incidentId,
        title,
        description,
        service,
        category,
      });

      console.log(
        `Duplicate analysis for ${incidentId}: ${
          duplicateResult.duplicateOf ?? "No duplicate"
        }`
      );

      await pool.query(
        `UPDATE incidents
         SET
           ai_summary = $1,
           ai_processed_at = NOW(),
           priority = $2,
           priority_reasoning = $3,
           duplicate_of = $4,
           duplicate_confidence = $5,
           duplicate_reasoning = $6,
           updated_at = NOW()
         WHERE id = $7`,
        [
          summary,
          priorityResult.priority,
          priorityResult.reasoning,
          duplicateResult.duplicateOf,
          duplicateResult.confidence,
          duplicateResult.reasoning,
          incidentId,
        ]
      );

      console.log(`AI analysis saved for incident ${incidentId}`);
      console.log("Incident processing completed:", job.id);

      return {
        processed: true,
        jobId: job.id,
        incidentId,
        aiSummaryGenerated: true,
        priorityDetected: true,
        priority: priorityResult.priority,
        duplicateChecked: true,
        duplicateOf: duplicateResult.duplicateOf,
      };
    } catch (error) {
      console.error(
        `AI processing failed for incident ${incidentId}:`,
        error
      );

      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6381),
    },

    // Qwen can take longer than BullMQ's default lock duration.
    lockDuration: 120000,
    lockRenewTime: 30000,
  }
);

worker.on("completed", (job) => {
  console.log(`Worker completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Worker failed job ${job?.id}:`, error);
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("VANTA background worker started");