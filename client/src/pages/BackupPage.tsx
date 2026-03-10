/**
 * BackupPage — Exportar e importar dados em JSON, limpar dados.
 */
import { useState, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Database, Download, Upload, Trash2, CheckCircle, AlertTriangle, RefreshCw,
} from "lucide-react";

const STORAGE_KEYS = [
  "employees", "employees_counter",
  "services", "services_counter",
  "clients", "clients_counter",
  "appointments", "appointments_counter",
  "cash_sessions", "cash_sessions_counter",
  "audit_logs", "audit_logs_counter",
  "salao_bella_seeded",
];

export default function BackupPage() {
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    try {
      const data: Record<string, any> = {};
      STORAGE_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) data[key] = val;
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salao-bella-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar backup");
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== "object") throw new Error("Formato inválido");
        Object.entries(data).forEach(([key, value]) => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, value as string);
          }
        });
        toast.success("Backup importado! Recarregando...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error("Arquivo de backup inválido");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAllData = () => {
    setClearing(true);
    try {
      STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      toast.success("Todos os dados foram removidos! Recarregando...");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Erro ao limpar dados");
    } finally {
      setClearing(false);
      setClearOpen(false);
    }
  };

  const getDataSummary = () => {
    const count = (key: string) => {
      try { return JSON.parse(localStorage.getItem(key) ?? "[]").length; } catch { return 0; }
    };
    return [
      { label: "Funcionários", count: count("employees") },
      { label: "Serviços", count: count("services") },
      { label: "Clientes", count: count("clients") },
      { label: "Agendamentos", count: count("appointments") },
      { label: "Sessões de Caixa", count: count("cash_sessions") },
      { label: "Logs de Auditoria", count: count("audit_logs") },
    ];
  };

  const summary = getDataSummary();
  const totalRecords = summary.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Backup & Dados</h2>
        <p className="text-sm text-muted-foreground">Exportar, importar e gerenciar dados do sistema</p>
      </div>

      {/* Summary */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />Resumo dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {summary.map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm">{s.label}</span>
                <Badge variant="secondary" className="text-xs">{s.count}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Total: <strong className="text-foreground">{totalRecords}</strong> registros armazenados localmente</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={exportData}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Exportar Backup</h3>
            <p className="text-xs text-muted-foreground">Baixar todos os dados em formato JSON</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold">Importar Backup</h3>
            <p className="text-xs text-muted-foreground">Restaurar dados de um arquivo JSON</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 hover:border-red-500/30 transition-colors cursor-pointer" onClick={() => setClearOpen(true)}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-semibold">Limpar Dados</h3>
            <p className="text-xs text-muted-foreground">Remover todos os dados do sistema</p>
          </CardContent>
        </Card>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importData} />

      {/* Info */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Armazenamento Local</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os dados são armazenados no navegador (localStorage). Limpar o cache do navegador
                pode apagar os dados. Faça backups regulares para evitar perda de informações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear confirmation */}
      <Dialog open={clearOpen} onOpenChange={v => !v && setClearOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Limpar todos os dados?</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação vai remover <strong className="text-foreground">{totalRecords} registros</strong> permanentemente.
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">Atenção: esta ação não pode ser desfeita. Faça um backup antes.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)} disabled={clearing}>Cancelar</Button>
            <Button variant="destructive" onClick={clearAllData} disabled={clearing} className="gap-2">
              {clearing ? <><RefreshCw className="w-4 h-4 animate-spin" />Limpando...</> : <><Trash2 className="w-4 h-4" />Limpar Tudo</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
