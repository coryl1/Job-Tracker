import { type Prospect, type InsertProspect, type PhaseHistoryEntry, type InsertPhaseHistory, prospects, phaseHistory } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getAllProspects(): Promise<Prospect[]>;
  getProspect(id: number): Promise<Prospect | undefined>;
  createProspect(data: InsertProspect): Promise<Prospect>;
  updateProspect(id: number, data: Partial<InsertProspect>): Promise<Prospect | undefined>;
  deleteProspect(id: number): Promise<boolean>;
  getPhaseHistory(prospectId: number): Promise<PhaseHistoryEntry[]>;
  getAllPhaseHistory(): Promise<PhaseHistoryEntry[]>;
  addPhaseEntry(data: InsertPhaseHistory): Promise<PhaseHistoryEntry>;
  updatePhaseEntryDate(prospectId: number, phase: string, date: string): Promise<PhaseHistoryEntry | undefined>;
  getPhaseEntry(prospectId: number, phase: string): Promise<PhaseHistoryEntry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getAllProspects(): Promise<Prospect[]> {
    return await db.select().from(prospects).orderBy(desc(prospects.createdAt));
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    const [result] = await db.select().from(prospects).where(eq(prospects.id, id));
    return result;
  }

  async createProspect(data: InsertProspect): Promise<Prospect> {
    const [result] = await db.insert(prospects).values(data).returning();
    return result;
  }

  async updateProspect(id: number, data: Partial<InsertProspect>): Promise<Prospect | undefined> {
    const [result] = await db
      .update(prospects)
      .set(data)
      .where(eq(prospects.id, id))
      .returning();
    return result;
  }

  async deleteProspect(id: number): Promise<boolean> {
    const result = await db.delete(prospects).where(eq(prospects.id, id)).returning();
    return result.length > 0;
  }

  async getPhaseHistory(prospectId: number): Promise<PhaseHistoryEntry[]> {
    return await db.select().from(phaseHistory).where(eq(phaseHistory.prospectId, prospectId));
  }

  async getAllPhaseHistory(): Promise<PhaseHistoryEntry[]> {
    return await db.select().from(phaseHistory);
  }

  async addPhaseEntry(data: InsertPhaseHistory): Promise<PhaseHistoryEntry> {
    const [result] = await db.insert(phaseHistory).values(data).returning();
    return result;
  }

  async updatePhaseEntryDate(prospectId: number, phase: string, date: string): Promise<PhaseHistoryEntry | undefined> {
    const [result] = await db
      .update(phaseHistory)
      .set({ date })
      .where(and(eq(phaseHistory.prospectId, prospectId), eq(phaseHistory.phase, phase)))
      .returning();
    return result;
  }

  async getPhaseEntry(prospectId: number, phase: string): Promise<PhaseHistoryEntry | undefined> {
    const [result] = await db
      .select()
      .from(phaseHistory)
      .where(and(eq(phaseHistory.prospectId, prospectId), eq(phaseHistory.phase, phase)));
    return result;
  }
}

export const storage = new DatabaseStorage();
