import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: { rpc: vi.fn() },
}));

vi.mock("./store", () => ({
  clientsStore: {
    ensureLoaded: vi.fn(async () => [{ id: 1, name: "Maria Silva" }]),
  },
  employeesStore: {
    list: vi.fn(() => [{ id: 2, name: "Ana Paula" }]),
  },
  servicesStore: {
    list: vi.fn(() => [{ id: 3, name: "Corte", durationMinutes: 30 }]),
  },
}));

import { supabase } from "./supabase";
import { employeesStore } from "./store";
import { executeScheduleServer } from "./schedulerExecutor";

const rpc = vi.mocked(supabase.rpc);

function result(code: string, ok = true, extra: Record<string, unknown> = {}) {
  return {
    data: {
      ok,
      code,
      client_name: "Maria Silva",
      service_name: "Corte",
      service_duration: 30,
      appointment_id: 90,
      ...extra,
    },
    error: null,
  } as never;
}

const appointment = {
  clientName: "Maria Silva",
  serviceId: 3,
  employeeId: 2,
  date: "2026-11-10",
  time: "14:00",
};

describe("executeScheduleServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a hold first, then confirms it after explicit approval", async () => {
    rpc
      .mockResolvedValueOnce(result("HOLD_CREATED"))
      .mockResolvedValueOnce(result("CONFIRMED"));

    const response = await executeScheduleServer({ ...appointment, confirmed: true }, true);

    expect(response).toContain("Agendamento criado com sucesso");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "scheduler_reserve_appointment",
      expect.objectContaining({ p_confirm: false, p_force_conflict: false }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "scheduler_reserve_appointment",
      expect.objectContaining({ p_confirm: true, p_force_conflict: false }),
    );
  });

  it("creates and confirms a forced hold only after conflict approval", async () => {
    rpc
      .mockResolvedValueOnce(result("HOLD_CREATED"))
      .mockResolvedValueOnce(result("CONFIRMED"));

    const response = await executeScheduleServer(
      { ...appointment, confirmed: true, forceConflict: true },
      true,
    );

    expect(response).toContain("Agendamento criado com sucesso");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "scheduler_reserve_appointment",
      expect.objectContaining({ p_confirm: false, p_force_conflict: true }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "scheduler_reserve_appointment",
      expect.objectContaining({ p_confirm: true, p_force_conflict: true }),
    );
  });

  it("does not confirm when revalidation still finds an unauthorized conflict", async () => {
    rpc.mockResolvedValueOnce(result("CONFLICT", false, { message: "O horário está ocupado." }));

    const response = await executeScheduleServer({ ...appointment, confirmed: true }, true);

    expect(response).toContain("CONFLITO:");
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("returns a structured prompt when the professional has not been chosen", async () => {
    vi.mocked(employeesStore.list).mockReturnValueOnce([]);

    const response = await executeScheduleServer(
      { ...appointment, employeeId: undefined },
      false,
    );

    expect(response).toBe("AGUARDANDO_PROFISSIONAL:");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces RPC failures so the pending action can be retried", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "temporary failure" },
    } as never);

    await expect(executeScheduleServer(appointment, false)).rejects.toThrow(
      "Falha no executor transacional: temporary failure",
    );
  });
});
