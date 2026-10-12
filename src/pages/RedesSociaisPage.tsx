import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Facebook, Globe, Instagram, Link2, MessageCircle, Music2, Pencil, Plus, Search, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession } from "@/lib/access";

const LINKS_KEY = "rosa_social_links";
type Platform = "Instagram" | "Facebook" | "WhatsApp" | "Google" | "TikTok" | "YouTube" | "Outra";
type SocialLink = { id: string; platform: Platform; name: string; url: string };

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

export default function RedesSociaisPage() {
  const session = getSession();
  const canManage = session?.role === "owner" || session?.role === "manager";
  const [links, setLinks] = useState<SocialLink[]>(readLinks);
  const [linkDialog, setLinkDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);

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
    const next = editingLink
      ? links.map((item) => item.id === editingLink.id ? { ...item, platform, name, url } : item)
      : [{ id: makeId(), platform, name, url }, ...links];
    setLinks(next);
    saveLinks(next);
    setLinkDialog(false);
    toast.success(editingLink ? "Link atualizado." : "Link adicionado.");
  };

  const removeLink = (id: string) => {
    const next = links.filter((item) => item.id !== id);
    setLinks(next);
    saveLinks(next);
    toast.success("Link removido.");
  };

  return <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-primary"><Link2 className="size-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Acesso rápido</span></div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Links das redes sociais</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse rapidamente os perfis oficiais do salão.</p>
      </div>
      {canManage && <Button className="gap-2 self-start sm:self-auto" onClick={() => openLinkForm()}><Plus className="size-4" />Adicionar link</Button>}
    </div>

    <Card>
      <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Link2 className="size-5 text-primary" />Redes cadastradas</CardTitle><CardDescription className="mt-1">Os links são salvos neste navegador e não exigem senhas ou integração com as redes.</CardDescription></div><Badge variant="secondary">{links.length} {links.length === 1 ? "link" : "links"}</Badge></div></CardHeader>
      <CardContent>{links.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Link2 className="size-6" /></div><div><p className="font-medium">Nenhum link cadastrado</p><p className="mt-1 text-sm text-muted-foreground">Adicione o Instagram, WhatsApp, Google ou outra rede do salão.</p></div>{canManage && <Button variant="outline" className="gap-2" onClick={() => openLinkForm()}><Plus className="size-4" />Cadastrar primeiro link</Button>}</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{links.map((link) => <Card key={link.id} className="transition hover:border-primary/40"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{platformIcon(link.platform)}</div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{link.platform}</p><p className="truncate font-semibold">{link.name}</p></div><div className="flex items-center gap-1"><Button size="icon" variant="ghost" asChild aria-label={`Abrir ${link.name}`}><a href={link.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>{canManage && <><Button size="icon" variant="ghost" aria-label={`Editar ${link.name}`} onClick={() => openLinkForm(link)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Excluir ${link.name}`} onClick={() => removeLink(link.id)}><Trash2 className="size-4" /></Button></>}</div></CardContent></Card>)}</div>}</CardContent>
    </Card>

    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">Esta seção serve apenas como atalho para os links cadastrados. Não há agente de IA, leitura automática de mensagens, métricas ou publicação pelas redes.</div>

    <Dialog open={linkDialog} onOpenChange={setLinkDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingLink ? "Editar link" : "Adicionar link"}</DialogTitle></DialogHeader><form onSubmit={saveLink} className="space-y-4"><div className="grid gap-2"><Label htmlFor="platform">Rede</Label><select id="platform" name="platform" defaultValue={editingLink?.platform ?? "Instagram"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="WhatsApp">WhatsApp</option><option value="Google">Google</option><option value="TikTok">TikTok</option><option value="YouTube">YouTube</option><option value="Outra">Outra</option></select></div><div className="grid gap-2"><Label htmlFor="name">Nome do perfil</Label><Input id="name" name="name" defaultValue={editingLink?.name ?? ""} placeholder="Ex.: Instagram Rosa de Sarom" autoFocus /></div><div className="grid gap-2"><Label htmlFor="url">Link</Label><Input id="url" name="url" type="url" defaultValue={editingLink?.url ?? ""} placeholder="https://..." /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setLinkDialog(false)}>Cancelar</Button><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}
