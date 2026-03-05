import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProspectSchema, STATUSES, INTEREST_LEVELS } from "@shared/schema";
import type { InsertProspect, Prospect, PhaseHistoryEntry } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock } from "lucide-react";

type ProspectWithHistory = Prospect & { phaseHistory?: PhaseHistoryEntry[] };

interface EditProspectFormProps {
  prospect: ProspectWithHistory;
  onSuccess?: () => void;
}

export function EditProspectForm({ prospect, onSuccess }: EditProspectFormProps) {
  const { toast } = useToast();
  const phaseEntries = prospect.phaseHistory || [];

  const form = useForm<InsertProspect>({
    resolver: zodResolver(insertProspectSchema),
    defaultValues: {
      companyName: prospect.companyName,
      roleTitle: prospect.roleTitle,
      jobUrl: prospect.jobUrl ?? "",
      status: prospect.status as InsertProspect["status"],
      interestLevel: prospect.interestLevel as InsertProspect["interestLevel"],
      notes: prospect.notes ?? "",
      salary: prospect.salary ?? undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProspect) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.status !== prospect.status) {
        const now = new Date();
        payload.phaseDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      }
      await apiRequest("PATCH", `/api/prospects/${prospect.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Prospect updated" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update prospect", variant: "destructive" });
    },
  });

  const dateMutation = useMutation({
    mutationFn: async ({ phase, date }: { phase: string; date: string }) => {
      await apiRequest("PUT", `/api/prospects/${prospect.id}/phase-history`, { phase, date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Phase date updated" });
    },
    onError: () => {
      toast({ title: "Failed to update phase date", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Google" {...field} data-testid="input-edit-company-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Product Manager" {...field} data-testid="input-edit-role-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job URL (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-edit-job-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 90000"
                  data-testid="input-edit-salary"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      field.onChange(null);
                    } else {
                      const num = Number(val);
                      field.onChange(Number.isFinite(num) ? num : val);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} data-testid={`option-edit-status-${s}`}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interestLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-interest">
                      <SelectValue placeholder="Select interest" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INTEREST_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} data-testid={`option-edit-interest-${level}`}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-edit-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {phaseEntries.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="w-3.5 h-3.5" />
              Phase History
            </div>
            <div className="space-y-1.5">
              {phaseEntries
                .sort((a, b) => {
                  const ai = STATUSES.indexOf(a.phase as typeof STATUSES[number]);
                  const bi = STATUSES.indexOf(b.phase as typeof STATUSES[number]);
                  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                })
                .map((entry) => (
                  <PhaseHistoryDateEditor
                    key={entry.id}
                    entry={entry}
                    onSave={(date) => dateMutation.mutate({ phase: entry.phase, date })}
                    isSaving={dateMutation.isPending}
                  />
                ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-save-prospect">
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
}

function PhaseHistoryDateEditor({
  entry,
  onSave,
  isSaving,
}: {
  entry: PhaseHistoryEntry;
  onSave: (date: string) => void;
  isSaving: boolean;
}) {
  const [localDate, setLocalDate] = useState(entry.date);
  const hasChanged = localDate !== entry.date;

  return (
    <div
      className="flex items-center gap-2"
      data-testid={`phase-edit-${entry.phase.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{entry.phase}</span>
      <Input
        type="date"
        value={localDate}
        onChange={(e) => setLocalDate(e.target.value)}
        className="h-7 text-xs flex-1"
        data-testid={`input-phase-date-${entry.phase.replace(/\s+/g, "-").toLowerCase()}`}
      />
      {hasChanged && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2"
          onClick={() => onSave(localDate)}
          disabled={isSaving}
          data-testid={`button-save-phase-date-${entry.phase.replace(/\s+/g, "-").toLowerCase()}`}
        >
          Save
        </Button>
      )}
    </div>
  );
}
