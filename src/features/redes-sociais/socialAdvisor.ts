import { createAuthenticatedAgentHeaders, getAgentEndpoint } from "@/features/assistente/llmEndpoint";
import { getSession } from "@/lib/access";

export type SocialAdvisorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "social_advisor_messages_v1";
const MODEL = "openai/gpt-oss-20b";

function scopeKey(): string {
  const profile = getSession()?.profileName?.trim() || "owner";
  return `${STORAGE_KEY}:${profile}`;
}

function readMessages(): SocialAdvisorMessage[] {
  try {
    const raw = localStorage.getItem(scopeKey());
    return raw ? (JSON.parse(raw) as SocialAdvisorMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: SocialAdvisorMessage[]): void {
  localStorage.setItem(scopeKey(), JSON.stringify(messages.slice(-30)));
}

function salonContext(): string {
  try {
    const config = JSON.parse(localStorage.getItem("salon_config") || "{}");
    const links = JSON.parse(localStorage.getItem("rosa_social_links") || "[]") as Array<{ platform?: string; name?: string; url?: string }>;
    const registeredLinks = links.length
      ? links.map((link) => `${link.platform || "Rede"}: ${link.name || "perfil"} (${link.url || "sem link"})`).join("\n")
      : "Nenhum link de rede foi cadastrado ainda.";
    return `Salão: ${config.salonName || "Salão Rosa de Sarom"}\nRedes cadastradas:\n${registeredLinks}`;
  } catch {
    return "Salão: Salão Rosa de Sarom\nRedes cadastradas: não disponíveis.";
  }
}

const SYSTEM_PROMPT = `Você é o Conselheiro de Redes Sociais de um salão de beleza.

Sua função é orientar o proprietário e a equipe de forma prática sobre:
- novas mensagens, comentários, menções e avaliações;
- como responder com educação, rapidez e clareza;
- como transformar conversas em oportunidades de agendamento sem pressionar o cliente;
- ideias de conteúdo, fotos, vídeos, antes e depois, bastidores e depoimentos;
- frequência possível de publicação, consistência e melhoria gradual;
- privacidade, autorização para publicar imagens e proteção de dados dos clientes;
- como lidar com críticas, reclamações e comentários difíceis;
- como organizar uma rotina simples de acompanhamento das redes.

REGRAS IMPORTANTES:
1. Você não tem acesso em tempo real ao Instagram, Facebook, WhatsApp, Google ou qualquer rede. Nunca diga que viu uma mensagem, comentário, métrica ou notificação. Quando necessário, peça que o usuário copie o texto, descreva o caso ou abra o link da rede.
2. Você não publica, responde, exclui comentários nem envia mensagens. Apenas aconselha. Não invente que executou uma ação.
3. Não peça senhas ou tokens. Oriente o usuário a abrir o link da rede cadastrado.
4. Quando houver dúvida sobre agenda, horários ou cadastro de cliente, explique que a operação deve ser feita pelo agente de agendamento/pelo módulo Agenda, sem simular resultado.
5. Responda em português brasileiro, com linguagem simples e objetiva. Priorize passos práticos e exemplos de resposta.
6. Para cada situação, quando possível, entregue: leitura do caso, ação recomendada e um texto pronto para responder.

CONTEXTO DO APP:
${salonContext()}`;

function makeMessage(role: SocialAdvisorMessage["role"], content: string): SocialAdvisorMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content, createdAt: new Date().toISOString() };
}

export function loadSocialAdvisorMessages(): SocialAdvisorMessage[] {
  return readMessages();
}

export function clearSocialAdvisorMessages(): void {
  localStorage.removeItem(scopeKey());
}

export async function sendSocialAdvisorMessage(text: string): Promise<SocialAdvisorMessage> {
  const message = text.trim();
  if (!message) throw new Error("Digite uma pergunta ou descreva uma situação das redes.");

  const history = readMessages().slice(-12);
  const endpoint = getAgentEndpoint(import.meta.env.PROD ? "/api/personal-agent" : undefined);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: await createAuthenticatedAgentHeaders(endpoint, ""),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message },
      ],
      temperature: 0.35,
      max_tokens: 1200,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload?.error === "string" ? payload.error : `HTTP ${response.status}`;
    throw new Error(`Não foi possível consultar o Conselheiro de Redes Sociais: ${detail}`);
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("O Conselheiro de Redes Sociais não retornou uma resposta válida.");

  const userMessage = makeMessage("user", message);
  const assistantMessage = makeMessage("assistant", content.trim());
  saveMessages([...history, userMessage, assistantMessage]);
  return assistantMessage;
}
