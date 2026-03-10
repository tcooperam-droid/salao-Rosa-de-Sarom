/**
 * ConfiguracoesPage — Configurações gerais do salão.
 */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Building2, Clock, Bell, Palette, Save } from "lucide-react";

interface SalonConfig {
  salonName: string;
  ownerName: string;
  phone: string;
  address: string;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  notifyWhatsapp: boolean;
  notifyEmail: boolean;
  autoConfirm: boolean;
  accentColor: string;
}

const DEFAULT_CONFIG: SalonConfig = {
  salonName: "Salão Bella",
  ownerName: "",
  phone: "",
  address: "",
  openTime: "08:00",
  closeTime: "20:00",
  slotDuration: 30,
  notifyWhatsapp: false,
  notifyEmail: false,
  autoConfirm: false,
  accentColor: "#ec4899",
};

const ACCENT_COLORS = [
  "#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#3b82f6", "#84cc16", "#f97316", "#6366f1",
];

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<SalonConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("salon_config");
      if (saved) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem("salon_config", JSON.stringify(config));
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (field: keyof SalonConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Configurações</h2>
          <p className="text-sm text-muted-foreground">Configurações gerais do salão</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />{loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Salon info */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />Dados do Salão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nome do salão</Label>
              <Input value={config.salonName} onChange={e => updateConfig("salonName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Proprietário(a)</Label>
              <Input value={config.ownerName} onChange={e => updateConfig("ownerName", e.target.value)} placeholder="Nome do proprietário" />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={config.phone} onChange={e => updateConfig("phone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Endereço</Label>
            <Textarea value={config.address} onChange={e => updateConfig("address", e.target.value)} placeholder="Endereço completo" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Abertura</Label>
              <Input type="time" value={config.openTime} onChange={e => updateConfig("openTime", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fechamento</Label>
              <Input type="time" value={config.closeTime} onChange={e => updateConfig("closeTime", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Intervalo de slots (min)</Label>
              <Input type="number" min="5" step="5" value={config.slotDuration} onChange={e => updateConfig("slotDuration", parseInt(e.target.value) || 30)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificação por WhatsApp</p>
              <p className="text-xs text-muted-foreground">Enviar lembretes de agendamento via WhatsApp</p>
            </div>
            <Switch checked={config.notifyWhatsapp} onCheckedChange={v => updateConfig("notifyWhatsapp", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificação por E-mail</p>
              <p className="text-xs text-muted-foreground">Enviar confirmações por e-mail</p>
            </div>
            <Switch checked={config.notifyEmail} onCheckedChange={v => updateConfig("notifyEmail", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-confirmar agendamentos</p>
              <p className="text-xs text-muted-foreground">Confirmar automaticamente novos agendamentos</p>
            </div>
            <Switch checked={config.autoConfirm} onCheckedChange={v => updateConfig("autoConfirm", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cor principal</Label>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => updateConfig("accentColor", c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${config.accentColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-border bg-card/30">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Settings className="w-4 h-4" />
            <div>
              <p><strong>Salão Bella</strong> v1.0 — Sistema de Gestão para Salões de Beleza</p>
              <p className="text-xs mt-0.5">Dados armazenados localmente no navegador. Funcionalidades de notificação requerem integração com serviços externos.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
