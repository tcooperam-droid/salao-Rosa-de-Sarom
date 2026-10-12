import { describe, expect, it } from "vitest";
import {
  isPendingPromptResult,
  isRetryablePendingResult,
  matchProfessional,
  pendingActionForResult,
  shouldClearPendingAction,
} from "./schedulerPending";

const action = {
  type: "agendar" as const,
  params: { clientName: "Maria", serviceId: 3, date: "2026-11-10", time: "14:00" },
};

describe("schedulerPending", () => {
  it("guarda a confirmação e os dados necessários para concluí-la", () => {
    expect(pendingActionForResult(action, "CONFIRMACAO:Confira o agendamento")).toEqual({
      action: { ...action, params: { ...action.params, confirmed: true } },
      type: "confirmation",
    });
  });

  it("guarda a permissão explícita de conflito sem confirmar por conta própria", () => {
    expect(pendingActionForResult(action, "CONFLITO:Horário ocupado")).toEqual({
      action: { ...action, params: { ...action.params, forceConflict: true } },
      type: "conflict",
    });
  });

  it("mantém o pedido enquanto aguarda profissional ou autorização de horário", () => {
    expect(pendingActionForResult(action, "AGUARDANDO_PROFISSIONAL:Ana")).toEqual({
      action,
      type: "professional",
    });
    expect(pendingActionForResult(action, "FORA_HORARIO:fora do expediente")).toEqual({
      action: { ...action, params: { ...action.params, forceSchedule: true } },
      type: "override",
    });
  });

  it("marca erros transitórios para permitir nova tentativa", () => {
    expect(isRetryablePendingResult('Erro ao executar "agendar": timeout')).toBe(true);
    expect(isRetryablePendingResult("Erro ao processar ação: timeout")).toBe(true);
    expect(isRetryablePendingResult("HOLD_EXPIRED: confirmação expirada")).toBe(false);
    expect(pendingActionForResult(action, "Agendamento criado com sucesso")).toBeNull();
  });

  it("distingue novas perguntas pendentes de resultados finais", () => {
    expect(isPendingPromptResult("CONFIRMACAO:confirme")).toBe(true);
    expect(isPendingPromptResult("CONFLITO:ocupado")).toBe(true);
    expect(isPendingPromptResult("AGUARDANDO_PROFISSIONAL:Ana")).toBe(true);
    expect(isPendingPromptResult("Agendamento criado com sucesso")).toBe(false);
  });

  it("só limpa uma ação quando o resultado é terminal", () => {
    expect(shouldClearPendingAction("Agendamento criado com sucesso")).toBe(true);
    expect(shouldClearPendingAction("HOLD_EXPIRED: confirme novamente")).toBe(true);
    expect(shouldClearPendingAction("CONFIRMACAO:confirme")).toBe(false);
    expect(shouldClearPendingAction('Erro ao executar "agendar": timeout')).toBe(false);
  });

  it("seleciona profissionais sem diferenciar acentos e mantém ambiguidades explícitas", () => {
    const professionals = [{ id: 1, name: "Ana Paula" }, { id: 2, name: "Ana Clara" }];
    expect(matchProfessional("Ana Paula", professionals).match?.id).toBe(1);
    expect(matchProfessional("Ana", professionals)).toEqual({ match: null, candidates: professionals });
    expect(matchProfessional("Pessoa desconhecida", professionals)).toEqual({ match: null, candidates: [] });
    expect(matchProfessional("Ana Clara", professionals).match?.id).toBe(2);
  });
});
