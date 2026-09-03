export type IncidentClassification = {
  category: string;
  confidence: number;
  reasoning: string;
};

export function classifyIncident(
  title: string,
  description: string
): IncidentClassification {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes("payment") ||
    text.includes("checkout") ||
    text.includes("transaction") ||
    text.includes("billing")
  ) {
    return {
      category: "PAYMENT",
      confidence: 0.94,
      reasoning: "Incident contains payment or transaction-related signals.",
    };
  }

  if (
    text.includes("auth") ||
    text.includes("login") ||
    text.includes("authentication") ||
    text.includes("password") ||
    text.includes("token")
  ) {
    return {
      category: "AUTHENTICATION",
      confidence: 0.93,
      reasoning:
        "Incident contains authentication, login, credential, or token-related signals.",
    };
  }

  if (
    text.includes("database") ||
    text.includes("postgres") ||
    text.includes("sql") ||
    text.includes("query") ||
    text.includes("db")
  ) {
    return {
      category: "DATABASE",
      confidence: 0.92,
      reasoning:
        "Incident contains database, SQL, PostgreSQL, or query-related signals.",
    };
  }

  if (
    text.includes("network") ||
    text.includes("gateway") ||
    text.includes("dns") ||
    text.includes("connection") ||
    text.includes("timeout")
  ) {
    return {
      category: "NETWORK",
      confidence: 0.89,
      reasoning:
        "Incident contains network, gateway, connection, DNS, or timeout signals.",
    };
  }

  if (
    text.includes("server") ||
    text.includes("cpu") ||
    text.includes("memory") ||
    text.includes("disk") ||
    text.includes("container") ||
    text.includes("worker")
  ) {
    return {
      category: "INFRASTRUCTURE",
      confidence: 0.88,
      reasoning:
        "Incident contains infrastructure or compute-resource signals.",
    };
  }

  return {
    category: "GENERAL",
    confidence: 0.65,
    reasoning: "No specific operational category could be determined.",
  };
}