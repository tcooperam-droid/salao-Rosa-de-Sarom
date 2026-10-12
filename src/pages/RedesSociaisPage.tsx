import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Lightbulb,
  Link2,
  Loader2,
  MessageCircle,
  Music2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSession } from "@/lib/access";
import { clearSocialAdvisorMessages, loadSocialAdvisorMessages, sendSocialAdvisorMessage, type SocialAdvisorMessage } from "@/features/redes-sociais/socialAdvisor";

const LINKS_KEY = "rosa_social_links";

type Platform = "Instagram" | "Facebook" | "WhatsApp" | "Google" | "TikTok" | "YouTube" | "Outra";
type SocialLink = { id: string; platform: Platform; name: string; url: string };
type Tip = { id: string; title: string; text: string; category: string };

const DEFAULT_TIPS: Tip[] = [
  { id: "tip-answer", title: "Responda mensagens e comentários", text: "Verifique as redes todos os dias, responda com educação e leve dúvidas sobre horário ou preço para o WhatsApp ou para a Agenda.", category: "Atendimento" },
  { id: "tip-comment", title: "Transforme comentários em relacionamento", text: "Agradeça elogios, esclareça dúvidas publicamente e convide a pessoa a conversar no canal adequado quando o assunto for particular.", category: "Relacionamento" },
  { id: "tip-post", title: "Mostre resultados com autorização", text: "Publique antes e depois, bastidores e serviços realizados somente com autorização do cliente e sem expor dados pessoais.", category: "Conteúdo" },
  { id: "tip-routine", title: "Mantenha uma rotina possível", text: "Publique com regularidade, use fotos bem iluminadas e destaque o serviço, o resultado e a forma de agendar.", category: "Crescimento" },
];

function readLinks(): SocialLink[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    return raw ? (JSON.parse(raw) as SocialLink[]) : [];
  } catch {
    return [];
  }
}

function saveLinks(links: SocialLink[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function makeId(): string {
  return `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function platformIcon(platform: Platform) {
  const className = "size-5";
  if (platform === "Instagram") return <Instagram className={className} />;
  if (platform === "Facebook") return <Facebook className={className} />;
  if (platform === "WhatsApp") return <MessageCircle className={className} />;
  if (platform === "Google") return <Search className={className} />;
  if (platform === "TikTok") return <Music2 className={className} />;
  if (platform === "YouTube") return <Youtube className={className} />;
  return <Globe className={className} />;
}

const SUGGESTIONS = [
  "Recebi um comentário perguntando o preço. Como devo responder?",
  "Crie uma rotina simples para desenvolver o Instagram do salão.",
  "Como responder uma reclamação sem piorar a situação?",
  "Que tipo de publicação posso fazer esta semana?",
];

function AdvisorBubble({ message }: { message: SocialAdvisorMessage }) {
  const isUser = message.role === "user";
  return <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}><div className={`max-w-[min(94%,760px)] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser ? "bg-primary text-primary-foreground" : "border bg-card text-card-foreground"}`}><div className="leading-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:ml-4 [&_strong]:font-semibold">{isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <Streamdown>{message.content}</Streamdown>}</div></div></div>;
}

export default function RedesSociaisPage() {
  const session = getSession();
  const canManage = session?.role === "owner" || session?.role === "manager";
  const [links, setLinks] = useState<SocialLink[]>(readLinks);
  const [messages, setMessages] = useState<SocialAdvisorMessage[]>(loadSocialAdvisorMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);

  const tips = useMemo(() => DEFAULT_TIPS, []);

  useEffect(() => {
    const refresh = () => setLinks(readLinks());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const openLinkForm = (link?: SocialLink) => {
    setEditingLink(link ?? null);
    setLinkDialog(true);
  };

  const saveLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const platform = String(form.get("platform") || "Outra") as Platform;
    const name = String(form.get("name") || "").trim();
    const url = String(form.get("url") || "").trim();
    if (!name || !validUrl(url)) {
      toast.error("Informe um nome e um link válido começando com http:// ou https://.");
      return;
    }
    const next = editingLink ? links.map((item) => item.id === editingLink.id ? { ...item, platform, name, url } : item) : [{ id: makeId(), platform, name, url }, ...links];
    setLinks(next);
    saveLinks(next);
    setLinkDialog(false);
    toast.success(editingLink ? "Link atualizado." : "Rede adicionada.");
  };

  const removeLink = (id: string) => {
    const next = links.filter((item) => item.id !== id);
    setLinks(next);
    saveLinks(next);
    toast.success("Link removido.");
  };

  const askAdvisor = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    try {
      const answer = await sendSocialAdvisorMessage(question);
      setMessages(loadSocialAdvisorMessages());
      if (!answer.content) setError("O conselheiro não retornou uma orientação.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível consultar o Conselheiro de Redes Sociais.");
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void askAdvisor(input);
  };

  const clearAdvisor = () => {
    clearSocialAdvisorMessages();
    setMessages([]);
    setError(null);
    toast.success("Conversa do conselheiro limpa.");
  };

  return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-primary"><Link2 className="size-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Comunicação</span></div><h1 className="mt-2 text-2xl font-bold tracking-tight">Redes sociais</h1><p className="mt-1 text-sm text-muted-foreground">Acesse seus perfis e converse com o Conselheiro de Redes Sociais.</p></div>{canManage && <Button className="gap-2 self-start sm:self-auto" onClick={() => openLinkForm()}><Plus className="size-4" />Adicionar rede</Button>}</div>

    <Card className="overflow-hidden border-primary/20"><CardHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-background"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-xl"><MessageCircle className="size-5 text-primary" />Conselheiro de Redes Sociais</CardTitle><CardDescription className="mt-2 max-w-3xl">Oriente-se sobre mensagens, comentários, menções, reclamações, publicações e formas práticas de desenvolver as redes do salão.</CardDescription></div><Badge variant="outline" className="hidden sm:inline-flex">Agente especializado</Badge></div></CardHeader><CardContent className="p-0"><div className="max-h-[520px] min-h-[230px] space-y-4 overflow-y-auto p-4 md:p-6">{messages.length === 0 && <div className="mx-auto max-w-2xl space-y-5 py-6 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lightbulb className="size-7" /></div><div><h2 className="text-lg font-semibold">Como posso orientar?</h2><p className="mt-2 text-sm text-muted-foreground">Descreva uma mensagem, comentário ou situação da rede. O conselheiro sugere o que fazer e pode preparar uma resposta.</p></div><div className="grid gap-2 text-left sm:grid-cols-2">{SUGGESTIONS.map((suggestion) => <button type="button" key={suggestion} onClick={() => setInput(suggestion)} className="rounded-xl border bg-background p-3 text-sm transition hover:border-primary/50 hover:bg-primary/5">{suggestion}</button>)}</div></div>}{messages.map((message) => <AdvisorBubble key={message.id} message={message} />)}{sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Analisando a situação…</div>}{error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}</div><form onSubmit={submit} className="border-t bg-muted/20 p-3 md:p-4"><div className="flex items-end gap-2"><Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askAdvisor(input); } }} placeholder="Ex.: recebi um comentário e não sei como responder…" disabled={sending} className="min-h-12 resize-none" rows={2} /><Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Enviar pergunta ao conselheiro" className="size-12 shrink-0"><Send className="size-4" /></Button></div><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[11px] text-muted-foreground">Enter envia · Shift+Enter quebra linha</p>{messages.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={clearAdvisor}>Limpar conversa</Button>}</div></form></CardContent></Card>

    <section className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Links das redes</h2><p className="text-sm text-muted-foreground">Abra rapidamente os perfis para conferir mensagens, comentários e menções.</p></div><Badge variant="secondary">{links.length} {links.length === 1 ? "rede" : "redes"}</Badge></div>{links.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Link2 className="size-6" /></div><div><p className="font-medium">Nenhuma rede cadastrada</p><p className="mt-1 text-sm text-muted-foreground">Cadastre os links para abrir os perfis quando o conselheiro recomendar uma ação.</p></div>{canManage && <Button variant="outline" className="gap-2" onClick={() => openLinkForm()}><Plus className="size-4" />Cadastrar primeiro link</Button>}</CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{links.map((link) => <Card key={link.id} className="transition hover:border-primary/40"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{platformIcon(link.platform)}</div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{link.platform}</p><p className="truncate font-semibold">{link.name}</p></div><div className="flex items-center gap-1"><Button size="icon" variant="ghost" asChild aria-label={`Abrir ${link.name}`}><a href={link.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>{canManage && <><Button size="icon" variant="ghost" aria-label={`Editar ${link.name}`} onClick={() => openLinkForm(link)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Excluir ${link.name}`} onClick={() => removeLink(link.id)}><Trash2 className="size-4" /></Button></>}</div></CardContent></Card>)}</div>}</section>

    <section className="space-y-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Lightbulb className="size-5 text-primary" />Orientações para desenvolver as redes</h2><p className="text-sm text-muted-foreground">Boas práticas que o conselheiro também usa para orientar a equipe.</p></div><div className="grid gap-3 sm:grid-cols-2">{tips.map((tip) => <Card key={tip.id}><CardContent className="flex gap-3 p-4"><div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Lightbulb className="size-4" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{tip.title}</h3><Badge variant="outline" className="text-[10px]">{tip.category}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{tip.text}</p></div></CardContent></Card>)}</div></section>

    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" /><span>O conselheiro não acessa as redes em tempo real, não lê mensagens automaticamente e não publica por você. Para analisar uma situação, copie a mensagem ou comentário e, se necessário, abra o perfil pelo link cadastrado.</span></div>

    <Dialog open={linkDialog} onOpenChange={setLinkDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingLink ? "Editar rede" : "Adicionar rede"}</DialogTitle></DialogHeader><form onSubmit={saveLink} className="space-y-4"><div className="grid gap-2"><Label htmlFor="platform">Rede</Label><select id="platform" name="platform" defaultValue={editingLink?.platform ?? "Instagram"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="WhatsApp">WhatsApp</option><option value="Google">Google</option><option value="TikTok">TikTok</option><option value="YouTube">YouTube</option><option value="Outra">Outra</option></select></div><div className="grid gap-2"><Label htmlFor="name">Nome do perfil</Label><Input id="name" name="name" defaultValue={editingLink?.name ?? ""} placeholder="Ex.: Instagram Rosa de Sarom" autoFocus /></div><div className="grid gap-2"><Label htmlFor="url">Link</Label><Input id="url" name="url" type="url" defaultValue={editingLink?.url ?? ""} placeholder="https://..." /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}
