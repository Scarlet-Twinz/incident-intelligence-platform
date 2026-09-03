export type OllamaMessage = {
  role: "system" | "user";
  content: string;
};

const OLLAMA_API_URL =
  process.env.OLLAMA_URL ??
  "http://127.0.0.1:11434/api/chat";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ??
  "qwen2.5:3b-instruct";

export async function askOllama(
  messages: OllamaMessage[]
): Promise<string> {
  const response = await fetch(OLLAMA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    message?: {
      content?: string;
    };
  };

  return data.message?.content?.trim() ?? "";
}

export async function streamOllama(
  messages: OllamaMessage[]
): Promise<Response> {
  const response = await fetch(OLLAMA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: {
        temperature: 0.2,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama streaming request failed (${response.status}): ${errorText}`
    );
  }

  return response;
}