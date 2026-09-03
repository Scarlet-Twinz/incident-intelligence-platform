import { Worker } from "bullmq";
const worker = new Worker("incident-processing", async (job) => {
    console.log("Processing incident job:", job.id);
    console.log("Incident data:", job.data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Incident processing completed:", job.id);
    return {
        processed: true,
        jobId: job.id,
    };
}, {
    connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6381),
    },
});
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
