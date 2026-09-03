import { Redis } from "ioredis";
export const redis = new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6381),
});
redis.on("connect", () => {
    console.log("Redis connected");
});
redis.on("error", (error) => {
    console.error("Redis error:", error);
});
export async function testRedisConnection() {
    return redis.ping();
}
