/**
 * agentMedia.ts — Capacidades multimídia do Agente:
 *   - describeImage: análise de imagem (vision)
 *   - searchWeb: pesquisa na internet
 *   - transcribeAudio: voz → texto (Whisper)
 *   - speakWithOpenAI: texto → voz (OpenAI TTS)
 */

const LLM_ENDPOINT = "/api/llm";
const STT_ENDPOINT = "/api/stt";
const TTS_ENDPOINT = "/api/tts";
const SEARCH_ENDPOINT = "/api/search";

// ─── Vision ────────────────────────────────────────────────

export async function describeImage(
  imageDataUrl: string,
  prompt?: string,
): Promise<string> {
  const userPrompt =
    prompt?.trim() ||
    "Analise esta imagem e descreva o que vê em português brasileiro. Se for um comprovante, recibo, agenda ou documento, extraia as informações relevantes.";

  const res = await fetch(LLM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que analisa imagens enviadas em um sistema de gestão de salão de beleza. Responda em português brasileiro, de forma objetiva.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Falha ao analisar imagem: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "Não consegui analisar a imagem.";
}

// ─── Web Search ────────────────────────────────────────────

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string, limit = 5): Promise<WebResult[]> {
  const res = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) {
    throw new Error(`Falha na pesquisa: ${res.status}`);
  }
  const data = await res.json();
  return data.results ?? [];
}

/** Pesquisa + sintetiza uma resposta com base nos resultados */
export async function searchAndSummarize(query: string): Promise<string> {
  const results = await searchWeb(query, 5);
  if (results.length === 0) {
    return "Não encontrei resultados para sua pesquisa.";
  }

  const context = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`)
    .join("\n\n");

  const res = await fetch(LLM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      max_tokens: 600,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que responde perguntas usando resultados de pesquisa na web. Responda em português brasileiro, de forma direta e cite as fontes pelo número [1], [2] etc. quando relevante.",
        },
        {
          role: "user",
          content: `Pergunta: ${query}\n\nResultados da pesquisa:\n${context}\n\nResponda com base nesses resultados.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return `Encontrei estes resultados:\n\n${results
      .slice(0, 3)
      .map((r) => `• ${r.title} — ${r.url}`)
      .join("\n")}`;
  }

  const data = await res.json();
  const summary = data?.choices?.[0]?.message?.content ?? "";
  const sources = results
    .slice(0, 3)
    .map((r, i) => `[${i + 1}] ${r.url}`)
    .join("\n");
  return `${summary}\n\n📎 Fontes:\n${sources}`;
}

// ─── STT (voz → texto) ─────────────────────────────────────

export async function transcribeAudio(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  const res = await fetch(STT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio: base64,
      mimeType: blob.type || "audio/webm",
      language: "pt",
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Falha na transcrição: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.text ?? "").trim();
}

// ─── TTS (texto → voz com OpenAI) ──────────────────────────

let currentAudio: HTMLAudioElement | null = null;

export async function speakWithOpenAI(
  text: string,
  voice = "nova",
  onEnd?: () => void,
): Promise<void> {
  // Limpa markdown/blocos antes de falar
  const clean = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[[0-9]+\]/g, "")
    .replace(/📎[\s\S]*$/, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n+/g, ". ")
    .trim();
  if (!clean) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  // Tenta TTS de alta qualidade no servidor; se falhar, usa voz do navegador.
  try {
    const res = await fetch(TTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, voice }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      speakBrowser(clean, onEnd);
    };
    await audio.play();
  } catch {
    speakBrowser(clean, onEnd);
  }
}

function speakBrowser(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "pt-BR";
    utt.rate = 1.05;
    utt.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
    const fem = ptVoices.find((v) =>
      /female|feminina|francisca|vitoria|vitória|luciana|renata|google/i.test(v.name),
    ) ?? ptVoices[0];
    if (fem) utt.voice = fem;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
  } catch {
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try { currentAudio.pause(); } catch {}
    currentAudio = null;
  }
  try { window.speechSynthesis?.cancel(); } catch {}
}

// ─── Helpers ──────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip data URL prefix
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
