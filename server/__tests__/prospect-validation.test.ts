import { validateProspect } from "../prospect-helpers";

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
