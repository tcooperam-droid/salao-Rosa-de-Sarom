/**
 * AgendaPage — Grade de horários por funcionário com drag-and-drop.
 * Design: Glass Dashboard. Adaptado de tRPC para localStorage store.
 * Suporta groupId para agrupar serviços do mesmo cliente.
 */
import { useState, useMemo, useRef, useCallback, useEffect, memo } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Calendar, RefreshCw, Clock, Link2 } from "lucide-react";
import AppointmentModal from "@/components/AppointmentModal";
import { cn } from "@/lib/utils";
import {
  employeesStore, servicesStore, appointmentsStore,
  type Appointment,
} from "@/lib/store";

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const MIN_COL_WIDTH = 120;
const SNAP_MINUTES = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeToPixels(date: Date): number {
  return (date.getHours() + date.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT;
}

function durationToPixels(start: Date, end: Date): number {
  return ((end.getTime() - start.getTime()) / 3_600_000) * HOUR_HEIGHT;
}

function snapToGrid(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

const STATUS_BORDER: Record<string, string> = {
  scheduled:   "border-l-blue-400",
  confirmed:   "border-l-emerald-400",
  in_progress: "border-l-amber-400",
  completed:   "border-l-green-400",
  cancelled:   "border-l-red-400",
  no_show:     "border-l-gray-400",
};

// ─── AppointmentBlock ─────────────────────────────────────────────────────────
const AppointmentBlock = memo(function AppointmentBlock({
  appt,
  color,
  isGrouped,
  onClick,
  onDragStart,
}: {
  appt: Appointment;
  color: string;
  isGrouped: boolean;
  onClick: () => void;
  onDragStart: (appt: Appointment, y: number, x: number) => void;
}) {
  const start  = new Date(appt.startTime);
  const end    = new Date(appt.endTime);
  const top    = timeToPixels(start);
  const height = Math.max(durationToPixels(start, end), 28);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart(appt, e.clientY, e.clientX);
  }, [appt, onDragStart]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute",
        top: `${top}px`,
        height: `${height}px`,
        left: "3px",
        right: "3px",
        backgroundColor: color + "25",
        borderLeft: `3px solid ${color}`,
        zIndex: 10,
        touchAction: "none",
      }}
      className={cn(
        "rounded-md px-2 py-1 cursor-grab active:cursor-grabbing select-none overflow-hidden",
        "hover:brightness-110 transition-all",
        STATUS_BORDER[appt.status] ?? "border-l-gray-400"
      )}
    >
      <div className="flex items-center gap-1">
        {/* Se tem exatamente 1 serviço, mostra o nome do serviço em destaque */}
        {appt.services?.length === 1 ? (
          <p className="text-xs font-semibold truncate flex-1" style={{ color }}>
            {appt.services[0].name}
          </p>
        ) : (
          <p className="text-xs font-semibold truncate flex-1" style={{ color }}>
            {appt.clientName ?? "Sem nome"}
          </p>
        )}
        {isGrouped && (
          <Link2 className="w-2.5 h-2.5 flex-shrink-0 opacity-70" style={{ color }} />
        )}
      </div>
      {/* Nome do cliente (secundário) */}
      {height > 36 && (
        <p className="text-[10px] text-muted-foreground truncate leading-tight">
          {appt.clientName ?? "Sem nome"}
        </p>
      )}
      {height > 52 && (
        <p className="text-xs text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {format(start, "HH:mm")}–{format(end, "HH:mm")}
        </p>
      )}
      {height > 70 && appt.totalPrice != null && (
        <p className="text-xs text-muted-foreground">
          R$ {appt.totalPrice.toFixed(2)}
        </p>
      )}
    </div>
  );
});

// ─── EmployeeColumn ───────────────────────────────────────────────────────────
const EmployeeColumn = memo(function EmployeeColumn({
  employee,
  appointments,
  serviceMap,
  groupIds,
  isDragOver,
  onColumnClick,
  onAppointmentClick,
  onDragStart,
}: {
  employee: { id: number; name: string; color: string };
  appointments: Appointment[];
  serviceMap: Map<number, { color: string }>;
  groupIds: Set<string>;
  isDragOver: boolean;
  onColumnClick: (empId: number, hour: number, minute: number) => void;
  onAppointmentClick: (appt: Appointment) => void;
  onDragStart: (appt: Appointment, y: number, x: number) => void;
}) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;
    const snapped = snapToGrid(totalMinutes);
    const hour = Math.floor(snapped / 60);
    const minute = snapped % 60;
    onColumnClick(employee.id, hour, minute);
  }, [employee.id, onColumnClick]);

  return (
    <div
      className={cn(
        "relative border-l border-border transition-colors",
        isDragOver && "bg-primary/8"
      )}
      style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px`, width: `${MIN_COL_WIDTH}px` }}
      onClick={handleClick}
    >
      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
        <div key={i} className="absolute w-full border-t border-border/30"
          style={{ top: `${i * HOUR_HEIGHT}px` }} />
      ))}
      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
        <div key={`h${i}`} className="absolute w-full border-t border-border/10 border-dashed"
          style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
      ))}
      {appointments.map(appt => {
        const firstSvcId = appt.services?.[0]?.serviceId;
        const color = firstSvcId
          ? (serviceMap.get(firstSvcId)?.color ?? employee.color)
          : employee.color;
        const isGrouped = !!(appt.groupId && groupIds.has(appt.groupId));
        return (
          <AppointmentBlock
            key={appt.id}
            appt={appt}
            color={color}
            isGrouped={isGrouped}
            onClick={() => onAppointmentClick(appt)}
            onDragStart={onDragStart}
          />
        );
      })}
    </div>
  );
});

// ─── DragGhost ────────────────────────────────────────────────────────────────
function DragGhost({ appt, x, y }: { appt: Appointment; x: number; y: number }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x - 60,
        top: y - 20,
        zIndex: 9999,
        pointerEvents: "none",
        minWidth: 120,
      }}
      className="bg-card border border-primary rounded-md px-3 py-2 shadow-2xl text-sm font-medium opacity-90"
    >
      {appt.clientName ?? "Sem nome"}
    </div>
  );
}

// ─── AgendaPage ───────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [selectedDate, setSelectedDate]   = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingAppt, setEditingAppt]     = useState<Appointment | null>(null);
  const [defaultEmpId, setDefaultEmpId]   = useState<number | undefined>();
  const [defaultHour, setDefaultHour]     = useState(9);
  const [defaultMinute, setDefaultMinute] = useState(0);
  const [groupClientName, setGroupClientName] = useState<string | undefined>();
  const [groupId, setGroupId]             = useState<string | undefined>();
  const [refreshKey, setRefreshKey]       = useState(0);

  // Drag state
  const [dragging, setDragging]           = useState<Appointment | null>(null);
  const [dragPos, setDragPos]             = useState({ x: 0, y: 0 });
  const [dragOverEmpId, setDragOverEmpId] = useState<number | null>(null);
  const dragStartY  = useRef(0);
  const dragStartX  = useRef(0);
  const gridRef     = useRef<HTMLDivElement>(null);

  const employees = useMemo(() => employeesStore.list(true), [refreshKey]);
  const appointments = useMemo(() => appointmentsStore.list({ date: selectedDate }), [selectedDate, refreshKey]);
  const servicesData = useMemo(() => servicesStore.list(true), [refreshKey]);

  const serviceMap = useMemo(
    () => new Map(servicesData.map(s => [s.id, { color: s.color }])),
    [servicesData]
  );

  const apptsByEmployee = useMemo(() =>
    employees.reduce((acc, emp) => {
      acc[emp.id] = appointments.filter(a => a.employeeId === emp.id);
      return acc;
    }, {} as Record<number, Appointment[]>),
    [employees, appointments]
  );

  // Detect real groups (groupId appearing in 2+ appointments)
  const groupIds = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.groupId) counts[a.groupId] = (counts[a.groupId] ?? 0) + 1;
    });
    return new Set(
      Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k)
    );
  }, [appointments]);

  const currentDate   = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const formattedDate = format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  // ── Find employee column at X ─────────────────────────────────────────────
  const getEmpAtX = useCallback((clientX: number): number | null => {
    if (!gridRef.current) return null;
    const cols = Array.from(gridRef.current.querySelectorAll<HTMLElement>("[data-emp-id]"));
    for (let i = 0; i < cols.length; i++) {
      const rect = cols[i].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return parseInt(cols[i].dataset.empId ?? "0", 10);
      }
    }
    return null;
  }, []);

  // ── Global pointer events while dragging ──────────────────────────────────
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
      setDragOverEmpId(getEmpAtX(e.clientX));
    };

    const onUp = (e: PointerEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      const deltaMin = snapToGrid((deltaY / HOUR_HEIGHT) * 60);
      const targetEmpId = getEmpAtX(e.clientX) ?? dragging.employeeId;

      const oldStart = new Date(dragging.startTime);
      const newStart = new Date(oldStart.getTime() + deltaMin * 60000);
      const dur      = new Date(dragging.endTime).getTime() - oldStart.getTime();
      const newEnd   = new Date(newStart.getTime() + dur);

      if (newStart.getHours() < START_HOUR || newEnd.getHours() > END_HOUR) {
        toast.error("Horário fora do expediente");
      } else if (deltaMin !== 0 || targetEmpId !== dragging.employeeId) {
        appointmentsStore.move(dragging.id, targetEmpId, newStart.toISOString(), newEnd.toISOString());
        toast.success("Agendamento reagendado!");
        setRefreshKey(k => k + 1);
      }

      setDragging(null);
      setDragOverEmpId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, getEmpAtX]);

  // ── Drag start ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((appt: Appointment, y: number, x: number) => {
    setDragging(appt);
    setDragPos({ x, y });
    dragStartY.current = y;
    dragStartX.current = x;
  }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openNew = useCallback((empId: number, hour: number, minute = 0) => {
    setEditingAppt(null);
    setDefaultEmpId(empId);
    setDefaultHour(hour);
    setDefaultMinute(minute);
    setGroupClientName(undefined);
    setGroupId(undefined);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((appt: Appointment) => {
    setEditingAppt(appt);
    setGroupClientName(undefined);
    setGroupId(undefined);
    setModalOpen(true);
  }, []);

  // Called from AppointmentModal when user clicks "Adicionar outro serviço"
  const openGroupAdd = useCallback((clientName: string, existingGroupId: string) => {
    setEditingAppt(null);
    setDefaultEmpId(undefined);
    setDefaultHour(9);
    setDefaultMinute(0);
    setGroupClientName(clientName);
    setGroupId(existingGroupId);
    setRefreshKey(k => k + 1);
    setModalOpen(true);
  }, []);

  const navigateDate = (dir: number) =>
    setSelectedDate(format(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1), "yyyy-MM-dd"));

  const completedCount = appointments.filter(a => a.status === "completed").length;

  return (
    <div className="flex flex-col h-full" style={{ userSelect: dragging ? "none" : undefined }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 border-b border-border bg-card/30 backdrop-blur-sm flex-wrap">
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)} className="h-8 w-8 bg-transparent">
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium capitalize truncate max-w-[160px] md:max-w-none">
              {formattedDate}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)} className="h-8 w-8 bg-transparent">
            <ChevronRight className="w-3 h-3" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            className="text-xs h-8 hidden md:inline-flex bg-transparent"
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setRefreshKey(k => k + 1)} className="h-8 w-8" title="Atualizar">
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Badge variant="secondary" className="text-xs hidden md:inline-flex">
            {completedCount}/{appointments.length}
          </Badge>
          <Button
            size="sm"
            onClick={() => { setEditingAppt(null); setDefaultEmpId(undefined); setGroupClientName(undefined); setGroupId(undefined); setModalOpen(true); }}
            className="gap-1 h-8 text-xs md:text-sm"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden md:inline">Novo Agendamento</span>
            <span className="md:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="flex min-w-max">

          {/* Time column — sticky left */}
          <div className="w-10 md:w-14 flex-shrink-0 sticky left-0 bg-background z-20 border-r border-border">
            <div className="h-10 md:h-12 border-b border-border sticky top-0 bg-background z-20" />
            <div style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px`, position: "relative" }}>
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                <div key={i} className="absolute w-full flex justify-end pr-1 md:pr-2"
                  style={{ top: `${i * HOUR_HEIGHT - 8}px` }}>
                  <span className="text-xs text-muted-foreground">
                    {String(START_HOUR + i).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Employee columns */}
          {employees.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-1">Nenhum funcionário cadastrado</p>
                <p className="text-sm">Cadastre funcionários para visualizar a agenda</p>
              </div>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp.id} className="flex-shrink-0" style={{ width: `${MIN_COL_WIDTH}px` }}>
                {/* Employee header — sticky top */}
                <div className="h-10 md:h-12 border-b border-border flex items-center justify-center gap-1.5 px-2 sticky top-0 bg-card/50 backdrop-blur-sm z-10">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: emp.color }} />
                  <span className="text-xs md:text-sm font-medium truncate">{emp.name.split(" ")[0]}</span>
                </div>

                {/* Droppable zone wrapper — identified by data-emp-id */}
                <div data-emp-id={emp.id}>
                  <EmployeeColumn
                    employee={emp}
                    appointments={apptsByEmployee[emp.id] ?? []}
                    serviceMap={serviceMap}
                    groupIds={groupIds}
                    isDragOver={dragOverEmpId === emp.id}
                    onColumnClick={openNew}
                    onAppointmentClick={openEdit}
                    onDragStart={handleDragStart}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Drag ghost follows pointer ── */}
      {dragging && <DragGhost appt={dragging} x={dragPos.x} y={dragPos.y} />}

      {/* ── Modal ── */}
      <AppointmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAppt(null); }}
        appointment={editingAppt}
        defaultEmployeeId={defaultEmpId}
        defaultHour={defaultHour}
        defaultMinute={defaultMinute}
        selectedDate={selectedDate}
        groupClientName={groupClientName}
        groupId={groupId}
        onSuccess={() => {
          setRefreshKey(k => k + 1);
          setModalOpen(false);
          setEditingAppt(null);
        }}
        onAddGroupService={openGroupAdd}
      />
    </div>
  );
}
