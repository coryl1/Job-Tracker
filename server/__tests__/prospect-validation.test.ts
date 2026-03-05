import { validateProspect, buildPhaseHistory, shouldRecordPhase, validatePhaseDate } from "../prospect-helpers";

describe("prospect creation validation", () => {
  test("rejects a blank company name", () => {
    const result = validateProspect({
      companyName: "",
      roleTitle: "Software Engineer",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Company name is required");
  });

  test("rejects a blank role title", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Role title is required");
  });
});

describe("salary validation", () => {
  test("accepts a valid salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: 90000,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts zero salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: 0,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts omitted salary (undefined)", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts null salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: null,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("accepts empty string salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: "",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects a negative salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: -50000,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Salary cannot be negative");
  });

  test("rejects a non-integer salary", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: 90000.5,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Salary must be a whole number");
  });

  test("rejects a non-numeric salary string", () => {
    const result = validateProspect({
      companyName: "Google",
      roleTitle: "Software Engineer",
      salary: "abc",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Salary must be a whole number");
  });
});

describe("phase history - automatic date stamping", () => {
  test("records a new phase with date when phase is not in history", () => {
    const history: Record<string, string> = {};
    const updated = buildPhaseHistory(history, "Bookmarked", "2026-03-05");

    expect(updated["Bookmarked"]).toBe("2026-03-05");
  });

  test("records multiple phases with their respective dates", () => {
    let history: Record<string, string> = {};
    history = buildPhaseHistory(history, "Bookmarked", "2026-03-05");
    history = buildPhaseHistory(history, "Applied", "2026-03-08");
    history = buildPhaseHistory(history, "Phone Screen", "2026-03-10");

    expect(history["Bookmarked"]).toBe("2026-03-05");
    expect(history["Applied"]).toBe("2026-03-08");
    expect(history["Phone Screen"]).toBe("2026-03-10");
  });
});

describe("phase history - non-overwriting of existing dates", () => {
  test("does not overwrite an existing phase date when card re-enters phase", () => {
    let history: Record<string, string> = { "Applied": "2026-03-05" };
    history = buildPhaseHistory(history, "Applied", "2026-03-15");

    expect(history["Applied"]).toBe("2026-03-05");
  });

  test("shouldRecordPhase returns false for existing phase", () => {
    const history = { "Bookmarked": "2026-03-01", "Applied": "2026-03-05" };

    expect(shouldRecordPhase(history, "Applied")).toBe(false);
    expect(shouldRecordPhase(history, "Bookmarked")).toBe(false);
  });

  test("shouldRecordPhase returns true for new phase", () => {
    const history = { "Bookmarked": "2026-03-01" };

    expect(shouldRecordPhase(history, "Applied")).toBe(true);
    expect(shouldRecordPhase(history, "Phone Screen")).toBe(true);
  });
});

describe("phase history - manual date edits", () => {
  test("validatePhaseDate accepts valid YYYY-MM-DD format", () => {
    expect(validatePhaseDate("2026-03-05")).toBe(true);
    expect(validatePhaseDate("2025-12-31")).toBe(true);
    expect(validatePhaseDate("2026-01-01")).toBe(true);
  });

  test("validatePhaseDate rejects invalid formats", () => {
    expect(validatePhaseDate("03-05-2026")).toBe(false);
    expect(validatePhaseDate("2026/03/05")).toBe(false);
    expect(validatePhaseDate("March 5")).toBe(false);
    expect(validatePhaseDate("")).toBe(false);
    expect(validatePhaseDate("not-a-date")).toBe(false);
  });

  test("manual override can change a date by re-assigning in a map", () => {
    const history: Record<string, string> = { "Applied": "2026-03-05" };
    history["Applied"] = "2026-03-10";

    expect(history["Applied"]).toBe("2026-03-10");
  });
});

describe("phase history - persistence validation", () => {
  test("phase history map preserves all entries after multiple operations", () => {
    let history: Record<string, string> = {};
    history = buildPhaseHistory(history, "Bookmarked", "2026-03-01");
    history = buildPhaseHistory(history, "Applied", "2026-03-05");
    history = buildPhaseHistory(history, "Bookmarked", "2026-03-20");
    history = buildPhaseHistory(history, "Interviewing", "2026-03-15");

    expect(Object.keys(history)).toHaveLength(3);
    expect(history["Bookmarked"]).toBe("2026-03-01");
    expect(history["Applied"]).toBe("2026-03-05");
    expect(history["Interviewing"]).toBe("2026-03-15");
  });

  test("buildPhaseHistory returns a new object without mutating original", () => {
    const original = { "Bookmarked": "2026-03-01" };
    const updated = buildPhaseHistory(original, "Applied", "2026-03-05");

    expect(original).toEqual({ "Bookmarked": "2026-03-01" });
    expect(updated).toEqual({ "Bookmarked": "2026-03-01", "Applied": "2026-03-05" });
  });
});
