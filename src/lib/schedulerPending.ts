import type { ActionPayload } from "./agentContracts";

export type PendingActionType = "conflict" | "professional" | "confirmation" | "override";

function normalizeProfessionalName(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function matchProfessional<T extends { name: string }>(
  input: string,
  professionals: T[],
): { match: T | null; candidates: T[] } {
  const normalizedInput = normalizeProfessionalName(input);
  if (!normalizedInput) return { match: null, candidates: [] };

  const exact = professionals.find((professional) =>
    normalizeProfessionalName(professional.name) === normalizedInput
  );
  if (exact) return { match: exact, candidates: [exact] };

  const candidates = professionals.filter((professional) => {
    const name = normalizeProfessionalName(professional.name);
    return name.includes(normalizedInput) || normalizedInput.includes(name);
  });
  return { match: candidates.length === 1 ? candidates[0] : null, candidates };
}

export function pendingActionForResult(
  action: ActionPayload,
  result: string,
): { action: ActionPayload; type: PendingActionType } | null {
  let type: PendingActionType;
  let paramsPatch: Record<string, unknown> = {};

  if (result.startsWith("CONFIRMACAO:")) {
    type = "confirmation";
    paramsPatch = { confirmed: true };
  } else if (result.startsWith("CONFLITO:")) {
    type = "conflict";
    paramsPatch = { forceConflict: true };
  } else if (result.startsWith("AGUARDANDO_PROFISSIONAL:")) {
    type = "professional";
  } else if (result.startsWith("FORA_HORARIO:")) {
    type = "override";
    paramsPatch = { forceSchedule: true };
  } else {
    return null;
  }

  return {
    action: {
      ...action,
      params: { ...action.params, ...paramsPatch },
    } as ActionPayload,
    type,
  };
}

export function isRetryablePendingResult(result: string): boolean {
  return result.startsWith('Erro ao executar "') || result.startsWith("Erro ao processar ação:");
}

export function isPendingPromptResult(result: string): boolean {
  return result.startsWith("CONFIRMACAO:")
    || result.startsWith("CONFLITO:")
    || result.startsWith("AGUARDANDO_PROFISSIONAL:")
    || result.startsWith("FORA_HORARIO:");
}

export function shouldClearPendingAction(result: string): boolean {
  return !isPendingPromptResult(result) && !isRetryablePendingResult(result);
}
