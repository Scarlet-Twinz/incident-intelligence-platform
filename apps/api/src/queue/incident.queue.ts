import { Queue } from "bullmq";

export const incidentQueue = new Queue("incident-processing", {
  connection: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6381),
  },
});
