import type { ServerResponse } from "node:http";

const clients = new Set<ServerResponse>();

export function addClient(response: ServerResponse) {
  clients.add(response);

  response.on("close", () => {
    clients.delete(response);
  });
}

export function broadcastEvent(
  event: string,
  data: unknown
) {
  const payload =
    `event: ${event}\n` +
    `data: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount() {
  return clients.size;
}