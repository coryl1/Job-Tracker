import { STATUSES, INTEREST_LEVELS } from "@shared/schema";

export function getNextStatus(currentStatus: string): string {
  const terminalStatuses = ["Offer", "Rejected", "Withdrawn"];
  if (terminalStatuses.includes(currentStatus)) {
    return currentStatus;
  }
  const index = STATUSES.indexOf(currentStatus as (typeof STATUSES)[number]);
  if (index === -1 || index >= STATUSES.length - 1) {
    return currentStatus;
  }
  const next = STATUSES[index + 1];
  if (next === "Rejected" || next === "Withdrawn") {
    return currentStatus;
  }
  return next;
}

export function validateProspect(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.companyName || typeof data.companyName !== "string" || data.companyName.trim() === "") {
    errors.push("Company name is required");
  }

  if (!data.roleTitle || typeof data.roleTitle !== "string" || data.roleTitle.trim() === "") {
    errors.push("Role title is required");
  }

  if (data.status !== undefined) {
    if (!STATUSES.includes(data.status as (typeof STATUSES)[number])) {
      errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
    }
  }

  if (data.interestLevel !== undefined) {
    if (!INTEREST_LEVELS.includes(data.interestLevel as (typeof INTEREST_LEVELS)[number])) {
      errors.push(`Interest level must be one of: ${INTEREST_LEVELS.join(", ")}`);
    }
  }

  if (data.salary !== undefined && data.salary !== null && data.salary !== "") {
    const salaryNum = Number(data.salary);
    if (isNaN(salaryNum) || !Number.isInteger(salaryNum)) {
      errors.push("Salary must be a whole number");
    } else if (salaryNum < 0) {
      errors.push("Salary cannot be negative");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isTerminalStatus(status: string): boolean {
  return status === "Rejected" || status === "Withdrawn" || status === "Offer";
}

export type PhaseHistoryMap = Record<string, string>;

export function buildPhaseHistory(existingHistory: PhaseHistoryMap, newPhase: string, date: string): PhaseHistoryMap {
  if (existingHistory[newPhase]) {
    return existingHistory;
  }
  return { ...existingHistory, [newPhase]: date };
}

export function shouldRecordPhase(existingHistory: PhaseHistoryMap, phase: string): boolean {
  return !(phase in existingHistory);
}

export function validatePhaseDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
