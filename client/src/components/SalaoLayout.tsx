/**
 * Design: Glass Dashboard — Sidebar translúcida com navegação vertical.
 * Tema escuro, accent rosa, backdrop-blur nas superfícies.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Calendar,
  Users,
  UserCheck,
  Scissors,
  Wrench,
  DollarSign,
  BarChart2,
  Settings,
  History,
  Database,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  indent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/ferramentas-clientes", label: "Ferramentas", icon: Wrench, indent: true },
  { path: "/funcionarios", label: "Funcionários", icon: UserCheck },
  { path: "/servicos", label: "Serviços", icon: Scissors },
  { path: "/caixa",           label: "Caixa",        icon: DollarSign },
  { path: "/caixa/dashboard", label: "Dashboard",    icon: BarChart2,  indent: true },
  { path: "/relatorios", label: "Relatórios", icon: BarChart2 },
  { path: "/historico",              label: "Histórico",    icon: History    },
  { path: "/historico/agendamentos", label: "Agendamentos", icon: CalendarCheck, indent: true },
  { path: "/backup", label: "Backup", icon: Database },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

// ─── SalonLogo ────────────────────────────────────────────────────────────────
// Adapta o container à proporção real da imagem.
// Limites: max 120px wide, max 48px tall (sidebar tem 224px de largura).
// Sem logo: quadrado 32×32 com ícone de tesoura.
function SalonLogo({ src, size = "md" }: { src: string; size?: "md" | "sm" }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const maxW = size === "sm" ? 80  : 120;
  const maxH = size === "sm" ? 32  : 48;

  const onLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    let w = maxH * ratio;
    let h = maxH;
    if (w > maxW) { w = maxW; h = maxW / ratio; }
    setDims({ w: Math.round(w), h: Math.round(h) });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width:  dims ? dims.w : (size === "sm" ? 24 : 32),
        height: dims ? dims.h : (size === "sm" ? 24 : 32),
        transition: "width 0.2s, height 0.2s",
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt="logo"
        onLoad={onLoad}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

function loadSalonBranding() {
  try {
    const saved = localStorage.getItem("salon_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.salonName || "Salão Bella",
        logo: parsed.logoUrl || "",
      };
    }
  } catch { /* ignore */ }
  return { name: "Salão Bella", logo: "" };
}

function loadBackground(): React.CSSProperties {
  try {
    const saved = localStorage.getItem("salon_config");
    if (!saved) return {};
    const c = JSON.parse(saved);
    if (c.bgType === "solid" && c.bgColor)
      return { backgroundColor: c.bgColor };
    if (c.bgType === "gradient" && c.bgGradientFrom && c.bgGradientTo)
      return { background: `linear-gradient(${c.bgGradientDir || "135deg"}, ${c.bgGradientFrom}, ${c.bgGradientTo})` };
    if (c.bgType === "image" && c.bgImageUrl)
      return { backgroundImage: `url(${c.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
  } catch { /* ignore */ }
  return {};
}

interface SalaoLayoutProps {
  children: React.ReactNode;
}

export default function SalaoLayout({ children }: SalaoLayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme, switchable } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState(loadSalonBranding);
  const [bgStyle, setBgStyle] = useState(loadBackground);

  // Atualiza nome/logo e fundo imediatamente quando Configurações salvar
  useEffect(() => {
    const onUpdate = () => {
      setBranding(loadSalonBranding());
      setBgStyle(loadBackground());
    };
    window.addEventListener("salon_config_updated", onUpdate);
    return () => window.removeEventListener("salon_config_updated", onUpdate);
  }, []);

  const navigate = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={bgStyle}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 flex flex-col h-full w-56",
          "bg-card/80 backdrop-blur-xl border-r border-border",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {branding.logo ? (
              <SalonLogo src={branding.logo} size="md" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span
              className="truncate max-w-[120px]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >{branding.name}</span>
          </div>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon, indent }) => {
            const active = location === path || location.startsWith(path + "/");
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg font-medium transition-all duration-200 group",
                  indent ? "px-3 py-2 pl-10 text-xs" : "px-3 py-2.5 text-sm",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    indent ? "w-3.5 h-3.5" : "w-4 h-4",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle */}
        {switchable && (
          <div className="p-3 border-t border-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
            </button>
          </div>
        )}

        {/* Version */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground/50">Salão Bella v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-lg">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {branding.logo ? (
              <SalonLogo src={branding.logo} size="sm" />
            ) : (
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shadow-sm shadow-primary/25">
                <Scissors className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
            <span
              className="truncate max-w-[140px]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >{branding.name}</span>
          </div>
          {switchable && (
            <div className="ml-auto">
              <button
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
