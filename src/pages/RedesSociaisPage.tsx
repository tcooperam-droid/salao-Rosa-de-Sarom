import { useMemo, useState, type FormEvent } from "react";
import {
  Bell,
  Check,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Lightbulb,
  Link2,
  MessageCircle,
  Music2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSession } from "@/lib/access";

const LINKS_KEY = "rosa_social_links";
const NOTICES_KEY = "rosa_social_notices";
const TIPS_KEY = "rosa_social_tips";

type Platform = "Instagram" | "Facebook" | "WhatsApp" | "Google" | "TikTok" | "YouTube" | "Outra";

type SocialLink = {
  id: string;
  platform: Platform;
  name: string;
  url: string;
};

type Notice = {
  id: string;
  platform: Platform;
  kind: "mensagem" | "comentário" | "menção" | "publicação" | "outro";
  title: string;
  text: string;
  date: string;
  status: "novo" | "em_andamento" | "resolvido";
  actionUrl?: string;
};

type Tip = {
  id: string;
  title: string;
  text: string;
  category: string;
};

const DEFAULT_TIPS: Tip[] = [
  { id: "tip-answer", title: "Responda mensagens e comentários", text: "Verifique as redes todos os dias, responda com educação e leve dúvidas sobre horário ou preço para o WhatsApp ou para a agenda.", category: "Atendimento" },
  { id: "tip-comment", title: "Transforme comentários em relacionamento", text: "Agradeça elogios, esclareça dúvidas publicamente e convide a pessoa a conversar no canal adequado quando o assunto for particular.", category: "Relacionamento" },
  { id: "tip-post", title: "Mostre resultados com autorização", text: "Publique antes e depois, bastidores e serviços realizados somente com autorização do cliente e sem expor dados pessoais.", category: "Conteúdo" },
  { id: "tip-routine", title: "Mantenha uma rotina possível", text: "Publique com regularidade, use fotos bem iluminadas e destaque o serviço, o resultado e a forma de agendar.", category: "Crescimento" },
];

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function saveList<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeNotice(item: Partial<Notice> & { priority?: "normal" | "importante" }): Notice {
  return {
    id: item.id || makeId("notice"),
    platform: item.platform || "Outra",
    kind: item.kind || "outro",
    title: item.title || "Atualização da rede",
    text: item.text || "",
    date: item.date || "",
    status: item.status || (item.priority === "importante" ? "novo" : "em_andamento"),
    actionUrl: item.actionUrl || "",
  };
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RedesSociaisPage() {
  const session = getSession();
  const canManage = session?.role === "owner" || session?.role === "manager";
  const [links, setLinks] = useState<SocialLink[]>(() => readList<SocialLink>(LINKS_KEY, []));
  const [notices, setNotices] = useState<Notice[]>(() => readList<Partial<Notice>>(NOTICES_KEY, []).map(normalizeNotice));
  const [customTips, setCustomTips] = useState<Tip[]>(() => readList<Tip>(TIPS_KEY, []));
  const [linkDialog, setLinkDialog] = useState(false);
  const [noticeDialog, setNoticeDialog] = useState(false);
  const [tipDialog, setTipDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);

  const tips = useMemo(() => [...customTips, ...DEFAULT_TIPS], [customTips]);

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
    const next = editingLink
      ? links.map(item => item.id === editingLink.id ? { ...item, platform, name, url } : item)
      : [{ id: makeId("link"), platform, name, url }, ...links];
    setLinks(next);
    saveList(LINKS_KEY, next);
    setLinkDialog(false);
    toast.success(editingLink ? "Link atualizado." : "Rede adicionada.");
  };

  const removeLink = (id: string) => {
    const next = links.filter(item => item.id !== id);
    setLinks(next);
    saveList(LINKS_KEY, next);
    toast.success("Link removido.");
  };

  const openNoticeForm = (notice?: Notice) => {
    setEditingNotice(notice ?? null);
    setNoticeDialog(true);
  };

  const saveNotice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const platform = String(form.get("platform") || "Outra") as Platform;
    const kind = String(form.get("kind") || "outro") as Notice["kind"];
    const title = String(form.get("title") || "").trim();
    const text = String(form.get("text") || "").trim();
    const date = String(form.get("date") || "");
    const status = String(form.get("status") || "novo") as Notice["status"];
    const actionUrl = String(form.get("actionUrl") || "").trim();
    if (!title || !text) {
      toast.error("Informe o título e o texto da atualização.");
      return;
    }
    if (actionUrl && !validUrl(actionUrl)) {
      toast.error("O link da atualização precisa começar com http:// ou https://.");
      return;
    }
    const notice = { platform, kind, title, text, date, status, actionUrl };
    const next = editingNotice
      ? notices.map(item => item.id === editingNotice.id ? { ...item, ...notice } : item)
      : [{ id: makeId("notice"), ...notice }, ...notices];
    setNotices(next);
    saveList(NOTICES_KEY, next);
    setNoticeDialog(false);
    toast.success(editingNotice ? "Atualização editada." : "Atualização registrada.");
  };

  const removeNotice = (id: string) => {
    const next = notices.filter(item => item.id !== id);
    setNotices(next);
    saveList(NOTICES_KEY, next);
    toast.success("Aviso removido.");
  };

  const openTipForm = (tip?: Tip) => {
    setEditingTip(tip ?? null);
    setTipDialog(true);
  };

  const saveTip = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const text = String(form.get("text") || "").trim();
    const category = String(form.get("category") || "Geral").trim();
    if (!title || !text) {
      toast.error("Informe o título e o texto da dica.");
      return;
    }
    const next = editingTip
      ? customTips.map(item => item.id === editingTip.id ? { ...item, title, text, category } : item)
      : [{ id: makeId("tip"), title, text, category }, ...customTips];
    setCustomTips(next);
    saveList(TIPS_KEY, next);
    setTipDialog(false);
    toast.success(editingTip ? "Dica atualizada." : "Dica criada.");
  };

  const removeTip = (id: string) => {
    const next = customTips.filter(item => item.id !== id);
    setCustomTips(next);
    saveList(TIPS_KEY, next);
    toast.success("Dica removida.");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><Link2 className="size-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Comunicação</span></div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Redes sociais</h1>
          <p className="mt-1 text-sm text-muted-foreground">Links rápidos, atualizações para acompanhar e orientações para desenvolver as redes.</p>
        </div>
        {canManage && <Button className="gap-2 self-start sm:self-auto" onClick={() => openLinkForm()}><Plus className="size-4" />Adicionar rede</Button>}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Links das redes</h2><p className="text-sm text-muted-foreground">Acesse os perfis cadastrados sem procurar o endereço toda vez.</p></div><Badge variant="secondary">{links.length} {links.length === 1 ? "rede" : "redes"}</Badge></div>
        {links.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Link2 className="size-6" /></div><div><p className="font-medium">Nenhuma rede cadastrada</p><p className="mt-1 text-sm text-muted-foreground">Adicione o Instagram, WhatsApp, Facebook ou qualquer outro perfil do salão.</p></div>{canManage && <Button variant="outline" className="gap-2" onClick={() => openLinkForm()}><Plus className="size-4" />Cadastrar primeiro link</Button>}</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(link => <Card key={link.id} className="group transition hover:border-primary/40"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{platformIcon(link.platform)}</div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{link.platform}</p><p className="truncate font-semibold">{link.name}</p></div><div className="flex items-center gap-1"><Button size="icon" variant="ghost" asChild aria-label={`Abrir ${link.name}`}><a href={link.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>{canManage && <><Button size="icon" variant="ghost" aria-label={`Editar ${link.name}`} onClick={() => openLinkForm(link)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Excluir ${link.name}`} onClick={() => removeLink(link.id)}><Trash2 className="size-4" /></Button></>}</div></CardContent></Card>)}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Bell className="size-5 text-amber-500" />Atualizações das redes</h2><p className="text-sm text-muted-foreground">Registre o que precisa ser acompanhado: mensagens, comentários, menções e publicações.</p></div>{canManage && <Button size="sm" variant="outline" className="gap-2" onClick={() => openNoticeForm()}><Plus className="size-4" />Registrar atualização</Button>}</div>{notices.length === 0 ? <Card className="border-dashed"><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma atualização registrada. Inclua uma mensagem, comentário ou menção para não esquecer o acompanhamento.</CardContent></Card> : <div className="space-y-3">{notices.map(notice => <Card key={notice.id} className={notice.status === "novo" ? "border-amber-500/40" : notice.status === "resolvido" ? "opacity-75" : ""}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{notice.title}</h3><Badge variant="outline">{notice.platform}</Badge><Badge className={notice.status === "novo" ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15" : notice.status === "resolvido" ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15" : ""}>{notice.status === "em_andamento" ? "Em andamento" : notice.status === "resolvido" ? "Resolvido" : "Novo"}</Badge></div><p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{notice.kind}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{notice.text}</p>{notice.date && <p className="mt-3 text-xs text-muted-foreground">Registrado em {new Date(`${notice.date}T12:00:00`).toLocaleDateString("pt-BR")}</p>}{notice.actionUrl && <Button variant="link" className="h-auto px-0 pt-2 text-sm" asChild><a href={notice.actionUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 size-3.5" />Abrir rede e acompanhar</a></Button>}</div>{canManage && <div className="flex shrink-0"><Button size="icon" variant="ghost" aria-label="Editar atualização" onClick={() => openNoticeForm(notice)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Excluir atualização" onClick={() => removeNotice(notice.id)}><Trash2 className="size-4" /></Button></div>}</div></CardContent></Card>)}</div>}</section>

        <section className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Lightbulb className="size-5 text-primary" />Orientações para desenvolver as redes</h2><p className="text-sm text-muted-foreground">Boas práticas para responder, publicar e fortalecer o relacionamento com clientes.</p></div>{canManage && <Button size="sm" variant="outline" className="gap-2" onClick={() => openTipForm()}><Plus className="size-4" />Nova dica</Button>}</div><div className="space-y-3">{tips.map(tip => <Card key={tip.id}><CardContent className="p-4"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Lightbulb className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{tip.title}</h3><Badge variant="outline" className="text-[10px]">{tip.category}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{tip.text}</p></div>{canManage && customTips.some(item => item.id === tip.id) && <div className="flex shrink-0"><Button size="icon" variant="ghost" aria-label="Editar orientação" onClick={() => openTipForm(tip)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Excluir orientação" onClick={() => removeTip(tip.id)}><Trash2 className="size-4" /></Button></div>}</div></CardContent></Card>)}</div></section>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><Check className="size-4 shrink-0 text-primary" /><span>Esta central não lê as redes automaticamente. Registre aqui o que precisa ser acompanhado e abra o link da rede para responder ou tomar providências.</span></div>

      <Dialog open={linkDialog} onOpenChange={setLinkDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingLink ? "Editar rede" : "Adicionar rede"}</DialogTitle></DialogHeader><form onSubmit={saveLink} className="space-y-4"><div className="grid gap-2"><Label htmlFor="platform">Rede</Label><select id="platform" name="platform" defaultValue={editingLink?.platform ?? "Instagram"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="WhatsApp">WhatsApp</option><option value="Google">Google</option><option value="TikTok">TikTok</option><option value="YouTube">YouTube</option><option value="Outra">Outra</option></select></div><div className="grid gap-2"><Label htmlFor="name">Nome do perfil</Label><Input id="name" name="name" defaultValue={editingLink?.name ?? ""} placeholder="Ex.: Instagram Rosa de Sarom" autoFocus /></div><div className="grid gap-2"><Label htmlFor="url">Link</Label><Input id="url" name="url" type="url" defaultValue={editingLink?.url ?? ""} placeholder="https://..." /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={noticeDialog} onOpenChange={setNoticeDialog}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingNotice ? "Editar atualização" : "Registrar atualização"}</DialogTitle></DialogHeader><form onSubmit={saveNotice} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="notice-platform">Rede</Label><select id="notice-platform" name="platform" defaultValue={editingNotice?.platform ?? "Instagram"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="WhatsApp">WhatsApp</option><option value="Google">Google</option><option value="TikTok">TikTok</option><option value="YouTube">YouTube</option><option value="Outra">Outra</option></select></div><div className="grid gap-2"><Label htmlFor="notice-kind">Tipo de atualização</Label><select id="notice-kind" name="kind" defaultValue={editingNotice?.kind ?? "mensagem"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="mensagem">Nova mensagem</option><option value="comentário">Novo comentário</option><option value="menção">Nova menção</option><option value="publicação">Publicação para acompanhar</option><option value="outro">Outra atualização</option></select></div></div><div className="grid gap-2"><Label htmlFor="notice-title">Título</Label><Input id="notice-title" name="title" defaultValue={editingNotice?.title ?? ""} placeholder="Ex.: Responder comentário sobre horário" autoFocus /></div><div className="grid gap-2"><Label htmlFor="notice-text">O que aconteceu ou precisa ser feito</Label><Textarea id="notice-text" name="text" defaultValue={editingNotice?.text ?? ""} placeholder="Descreva a mensagem, comentário ou ação necessária..." rows={4} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="notice-date">Data</Label><Input id="notice-date" name="date" type="date" defaultValue={editingNotice?.date ?? ""} /></div><div className="grid gap-2"><Label htmlFor="notice-status">Status</Label><select id="notice-status" name="status" defaultValue={editingNotice?.status ?? "novo"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="novo">Novo</option><option value="em_andamento">Em andamento</option><option value="resolvido">Resolvido</option></select></div></div><div className="grid gap-2"><Label htmlFor="actionUrl">Link para acompanhar (opcional)</Label><Input id="actionUrl" name="actionUrl" type="url" defaultValue={editingNotice?.actionUrl ?? ""} placeholder="https://..." /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setNoticeDialog(false)}>Cancelar</Button><Button type="submit">Salvar atualização</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={tipDialog} onOpenChange={setTipDialog}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingTip ? "Editar dica" : "Nova dica"}</DialogTitle></DialogHeader><form onSubmit={saveTip} className="space-y-4"><div className="grid gap-2"><Label htmlFor="tip-title">Título</Label><Input id="tip-title" name="title" defaultValue={editingTip?.title ?? ""} placeholder="Ex.: Crie uma rotina de publicações" autoFocus /></div><div className="grid gap-2"><Label htmlFor="tip-text">Dica</Label><Textarea id="tip-text" name="text" defaultValue={editingTip?.text ?? ""} placeholder="Escreva a orientação..." rows={4} /></div><div className="grid gap-2"><Label htmlFor="category">Categoria</Label><Input id="category" name="category" defaultValue={editingTip?.category ?? "Geral"} placeholder="Ex.: Atendimento, Conteúdo ou Organização" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setTipDialog(false)}>Cancelar</Button><Button type="submit">Salvar dica</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}
