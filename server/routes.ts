import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProspectSchema, STATUSES, INTEREST_LEVELS } from "@shared/schema";

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/prospects", async (_req, res) => {
    const [prospects, allHistory] = await Promise.all([
      storage.getAllProspects(),
      storage.getAllPhaseHistory(),
    ]);

    const historyByProspect = new Map<number, typeof allHistory>();
    for (const entry of allHistory) {
      const arr = historyByProspect.get(entry.prospectId) || [];
      arr.push(entry);
      historyByProspect.set(entry.prospectId, arr);
    }

    const result = prospects.map((p) => ({
      ...p,
      phaseHistory: historyByProspect.get(p.id) || [],
    }));

    res.json(result);
  });

  app.post("/api/prospects", async (req, res) => {
    const parsed = insertProspectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map((e) => e.message).join(", ") });
    }

    const prospect = await storage.createProspect(parsed.data);

    const initialDate = req.body.initialPhaseDate || todayDateString();
    const phaseEntry = await storage.addPhaseEntry({
      prospectId: prospect.id,
      phase: prospect.status,
      date: initialDate,
    });

    res.status(201).json({
      ...prospect,
      phaseHistory: [phaseEntry],
    });
  });

  app.patch("/api/prospects/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid prospect ID" });
    }

    const existing = await storage.getProspect(id);
    if (!existing) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    const body = req.body;
    const updates: Record<string, unknown> = {};

    if (body.companyName !== undefined) updates.companyName = body.companyName;
    if (body.roleTitle !== undefined) updates.roleTitle = body.roleTitle;
    if (body.jobUrl !== undefined) updates.jobUrl = body.jobUrl;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (body.salary !== undefined) {
      if (body.salary === null || body.salary === "") {
        updates.salary = null;
      } else {
        const salaryNum = Number(body.salary);
        if (!Number.isInteger(salaryNum) || salaryNum < 0) {
          return res.status(400).json({ message: "Salary must be a non-negative whole number" });
        }
        updates.salary = salaryNum;
      }
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
      }
      updates.status = body.status;

      if (body.status !== existing.status) {
        const existingEntry = await storage.getPhaseEntry(id, body.status);
        if (!existingEntry) {
          const phaseDate = body.phaseDate || todayDateString();
          await storage.addPhaseEntry({
            prospectId: id,
            phase: body.status,
            date: phaseDate,
          });
        }
      }
    }

    if (body.interestLevel !== undefined || body.interest_level !== undefined) {
      const level = body.interestLevel ?? body.interest_level;
      if (!INTEREST_LEVELS.includes(level)) {
        return res.status(400).json({ message: `Interest level must be one of: ${INTEREST_LEVELS.join(", ")}` });
      }
      updates.interestLevel = level;
    }

    const updated = await storage.updateProspect(id, updates);
    const history = await storage.getPhaseHistory(id);

    res.json({ ...updated, phaseHistory: history });
  });

  app.put("/api/prospects/:id/phase-history", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid prospect ID" });
    }

    const existing = await storage.getProspect(id);
    if (!existing) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    const { phase, date } = req.body;
    if (!phase || !date) {
      return res.status(400).json({ message: "Phase and date are required" });
    }

    if (!STATUSES.includes(phase)) {
      return res.status(400).json({ message: `Phase must be one of: ${STATUSES.join(", ")}` });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
    }

    const existingEntry = await storage.getPhaseEntry(id, phase);
    let entry;
    if (existingEntry) {
      entry = await storage.updatePhaseEntryDate(id, phase, date);
    } else {
      entry = await storage.addPhaseEntry({ prospectId: id, phase, date });
    }

    res.json(entry);
  });

  app.get("/api/prospects/:id/phase-history", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid prospect ID" });
    }

    const history = await storage.getPhaseHistory(id);
    res.json(history);
  });

  app.delete("/api/prospects/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid prospect ID" });
    }

    const deleted = await storage.deleteProspect(id);
    if (!deleted) {
      return res.status(404).json({ message: "Prospect not found" });
    }

    res.status(204).send();
  });

  return httpServer;
}
