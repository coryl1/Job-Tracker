import { buildPhaseHistory, shouldRecordPhase, validatePhaseDate } from "../prospect-helpers";

describe("phase history API behavior simulation", () => {
  describe("auto date stamping on create", () => {
    test("initial phase should be recorded with provided date", () => {
      const history: Record<string, string> = {};
      const initialPhase = "Bookmarked";
      const initialDate = "2026-03-05";

      const result = buildPhaseHistory(history, initialPhase, initialDate);

      expect(result[initialPhase]).toBe(initialDate);
      expect(Object.keys(result)).toHaveLength(1);
    });

    test("initial phase defaults to Bookmarked status", () => {
      const history: Record<string, string> = {};
      const result = buildPhaseHistory(history, "Bookmarked", "2026-03-01");

      expect(result["Bookmarked"]).toBeDefined();
      expect(shouldRecordPhase(result, "Bookmarked")).toBe(false);
    });
  });

  describe("auto date stamping on phase change", () => {
    test("changing to Applied from Bookmarked records Applied date", () => {
      const history: Record<string, string> = { "Bookmarked": "2026-03-01" };

      expect(shouldRecordPhase(history, "Applied")).toBe(true);

      const updated = buildPhaseHistory(history, "Applied", "2026-03-05");
      expect(updated["Applied"]).toBe("2026-03-05");
      expect(updated["Bookmarked"]).toBe("2026-03-01");
    });

    test("full pipeline progression records each phase", () => {
      let history: Record<string, string> = {};
      const phases = [
        { phase: "Bookmarked", date: "2026-03-01" },
        { phase: "Applied", date: "2026-03-05" },
        { phase: "Phone Screen", date: "2026-03-10" },
        { phase: "Interviewing", date: "2026-03-15" },
        { phase: "Offer", date: "2026-03-20" },
      ];

      for (const { phase, date } of phases) {
        if (shouldRecordPhase(history, phase)) {
          history = buildPhaseHistory(history, phase, date);
        }
      }

      expect(Object.keys(history)).toHaveLength(5);
      expect(history["Bookmarked"]).toBe("2026-03-01");
      expect(history["Applied"]).toBe("2026-03-05");
      expect(history["Phone Screen"]).toBe("2026-03-10");
      expect(history["Interviewing"]).toBe("2026-03-15");
      expect(history["Offer"]).toBe("2026-03-20");
    });
  });

  describe("non-overwriting on re-entry", () => {
    test("moving back to Applied does not change original Applied date", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
        "Phone Screen": "2026-03-10",
      };

      expect(shouldRecordPhase(history, "Applied")).toBe(false);

      const updated = buildPhaseHistory(history, "Applied", "2026-03-20");
      expect(updated["Applied"]).toBe("2026-03-05");
    });

    test("moving back to Bookmarked preserves original date", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
      };

      const updated = buildPhaseHistory(history, "Bookmarked", "2026-04-01");
      expect(updated["Bookmarked"]).toBe("2026-03-01");
    });

    test("new phase is still recorded even after re-entry of old phases", () => {
      let history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
      };

      history = buildPhaseHistory(history, "Applied", "2026-03-15");
      expect(history["Applied"]).toBe("2026-03-05");

      expect(shouldRecordPhase(history, "Interviewing")).toBe(true);
      history = buildPhaseHistory(history, "Interviewing", "2026-03-16");
      expect(history["Interviewing"]).toBe("2026-03-16");
    });
  });

  describe("manual date edits", () => {
    test("date can be manually changed by direct assignment (simulates PUT)", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
      };

      history["Applied"] = "2026-03-08";
      expect(history["Applied"]).toBe("2026-03-08");
      expect(history["Bookmarked"]).toBe("2026-03-01");
    });

    test("override does not affect other phase entries", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
        "Phone Screen": "2026-03-10",
      };

      history["Applied"] = "2026-03-12";

      expect(history["Bookmarked"]).toBe("2026-03-01");
      expect(history["Applied"]).toBe("2026-03-12");
      expect(history["Phone Screen"]).toBe("2026-03-10");
    });

    test("validates date format before accepting", () => {
      expect(validatePhaseDate("2026-03-05")).toBe(true);
      expect(validatePhaseDate("2026-12-31")).toBe(true);
      expect(validatePhaseDate("not-a-date")).toBe(false);
      expect(validatePhaseDate("03/05/2026")).toBe(false);
      expect(validatePhaseDate("")).toBe(false);
    });
  });

  describe("persistence after refresh simulation", () => {
    test("serialized history survives JSON round-trip (simulates DB persistence)", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
        "Phone Screen": "2026-03-10",
      };

      const serialized = JSON.stringify(history);
      const deserialized = JSON.parse(serialized);

      expect(deserialized["Bookmarked"]).toBe("2026-03-01");
      expect(deserialized["Applied"]).toBe("2026-03-05");
      expect(deserialized["Phone Screen"]).toBe("2026-03-10");
      expect(Object.keys(deserialized)).toHaveLength(3);
    });

    test("phase history array format round-trips correctly (simulates API response)", () => {
      const apiResponse = [
        { id: 1, prospectId: 1, phase: "Bookmarked", date: "2026-03-01" },
        { id: 2, prospectId: 1, phase: "Applied", date: "2026-03-05" },
      ];

      const serialized = JSON.stringify(apiResponse);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toHaveLength(2);
      expect(deserialized[0].phase).toBe("Bookmarked");
      expect(deserialized[0].date).toBe("2026-03-01");
      expect(deserialized[1].phase).toBe("Applied");
      expect(deserialized[1].date).toBe("2026-03-05");
    });

    test("history entries with manually overridden dates persist correctly", () => {
      const history: Record<string, string> = {
        "Bookmarked": "2026-03-01",
        "Applied": "2026-03-05",
      };

      history["Applied"] = "2026-03-12";

      const serialized = JSON.stringify(history);
      const restored = JSON.parse(serialized);

      expect(restored["Applied"]).toBe("2026-03-12");
      expect(restored["Bookmarked"]).toBe("2026-03-01");
    });
  });
});
