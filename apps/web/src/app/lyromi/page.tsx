"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "What are the most serious incidents right now?",
  "Which incidents need immediate attention?",
  "Give me a summary of the current incident situation.",
  "Which services are experiencing the most problems?",
];

export default function LyromiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello. I’m LYROMI, the AI Operational Assistant inside VANTA. I can analyze your current incidents, priorities, services, assignments, and AI summaries. What would you like to know?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();

    if (!message || isStreaming) {
      return;
    }

    setInput("");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    const assistantId = crypto.randomUUID();

    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      if (!response.ok) {
        let errorMessage = "LYROMI could not process the request.";

        try {
          const errorData = await response.json();

          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("LYROMI returned no streaming response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split("\n");

        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine) {
            continue;
          }

          try {
            const chunk = JSON.parse(trimmedLine) as {
              message?: {
                content?: string;
              };
              done?: boolean;
            };

            const token = chunk.message?.content ?? "";

            if (token) {
              assistantContent += token;

              setMessages((current) =>
                current.map((item) =>
                  item.id === assistantId
                    ? {
                        ...item,
                        content: assistantContent,
                      }
                    : item
                )
              );
            }
          } catch {
            // Ignore incomplete/non-JSON stream fragments.
          }
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer.trim()) as {
            message?: {
              content?: string;
            };
          };

          const token = chunk.message?.content ?? "";

          if (token) {
            assistantContent += token;

            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content: assistantContent,
                    }
                  : item
              )
            );
          }
        } catch {
          // Stream ended with no additional complete JSON object.
        }
      }

      if (!assistantContent.trim()) {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content:
                    "I could not generate an operational response from the available incident data.",
                }
              : item
          )
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "LYROMI could not process the request.";

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: `Unable to reach LYROMI: ${errorMessage}`,
              }
            : item
        )
      );
    } finally {
      setIsStreaming(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
              <span className="text-lg font-bold text-cyan-300">
                L
              </span>
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                LYROMI
              </h1>

              <p className="text-xs text-slate-400">
                AI Operational Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-medium text-emerald-300">
              ONLINE
            </span>
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4 lg:block">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                VANTA
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Operational intelligence for understanding and responding
                to incidents.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">
                  LIVE CONTEXT
                </span>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                LYROMI receives the latest incident information from VANTA
                when you ask a question.
              </p>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Suggested questions
              </p>

              <div className="space-y-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => void sendMessage(question)}
                    className="w-full rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2.5 text-left text-xs leading-5 text-slate-400 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[calc(100vh-130px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1626] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Operational Assistant
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Ask LYROMI about your current incident environment.
                  </p>
                </div>

                {isStreaming && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />
                    </span>

                    LYROMI is analyzing
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="mx-auto max-w-4xl space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[78%] ${
                        message.role === "user"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                        {message.role === "user" ? "YOU" : "LYROMI"}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                          message.role === "user"
                            ? "rounded-br-md border border-cyan-400/20 bg-cyan-400/10 text-cyan-50"
                            : "rounded-bl-md border border-white/10 bg-white/[0.035] text-slate-200"
                        }`}
                      >
                        {message.content ||
                          (isStreaming &&
                          message.role === "assistant" ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />
                            </span>
                          ) : null)}
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#081321] p-4 sm:p-5">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-4xl items-center gap-3"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    disabled={isStreaming}
                    placeholder="Ask LYROMI about your incidents..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3.5 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    ↵
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Send message"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </form>

              <p className="mx-auto mt-3 max-w-4xl text-[10px] text-slate-600">
                LYROMI uses the operational data currently available in
                VANTA. It does not invent incidents or claim actions it has
                not performed.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}