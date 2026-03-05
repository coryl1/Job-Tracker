import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Prospect, PhaseHistoryEntry } from "@shared/schema";
import { STATUSES, INTEREST_LEVELS } from "@shared/schema";

type ProspectWithHistory = Prospect & { phaseHistory?: PhaseHistoryEntry[] };
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

type InterestFilter = "All" | typeof INTEREST_LEVELS[number];

const filterOptions: InterestFilter[] = ["All", ...INTEREST_LEVELS];

const filterColors: Record<InterestFilter, string> = {
  All: "bg-secondary text-secondary-foreground",
  High: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Low: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

function KanbanColumn({
  status,
  prospects,
  isLoading,
}: {
  status: string;
  prospects: ProspectWithHistory[];
  isLoading: boolean;
}) {
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("All");

  const filteredProspects =
    interestFilter === "All"
      ? prospects
      : prospects.filter((p) => p.interestLevel === interestFilter);

  const statusSlug = status.replace(/\s+/g, "-").toLowerCase();

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[320px] w-full bg-muted/40 rounded-md"
      data-testid={`column-${statusSlug}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div className={`w-2 h-2 rounded-full ${columnColors[status] || "bg-gray-400"}`} />
        <h3 className="text-sm font-semibold truncate">{status}</h3>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center no-default-active-elevate"
          data-testid={`badge-count-${statusSlug}`}
        >
          {filteredProspects.length}
        </Badge>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/30">
        <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
        {filterOptions.map((level) => (
          <button
            key={level}
            onClick={() => setInterestFilter(level)}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
              interestFilter === level
                ? filterColors[level] + " border-current/20"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
            }`}
            data-testid={`filter-${statusSlug}-${level.toLowerCase()}`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </>
          ) : filteredProspects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center" data-testid={`empty-${statusSlug}`}>
              <p className="text-xs text-muted-foreground">
                {interestFilter === "All" ? "No prospects" : `No ${interestFilter.toLowerCase()} interest prospects`}
              </p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <ProspectCard key={prospect.id} prospect={prospect} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: prospects, isLoading } = useQuery<ProspectWithHistory[]>({
    queryKey: ["/api/prospects"],
  });

  const groupedByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = (prospects ?? []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, ProspectWithHistory[]>,
  );

  const totalCount = prospects?.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-tight" data-testid="text-app-title">
                  JobTrackr
                </h1>
                <p className="text-xs text-muted-foreground" data-testid="text-prospect-count">
                  {totalCount} prospect{totalCount !== 1 ? "s" : ""} tracked
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-prospect">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Prospect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Prospect</DialogTitle>
                </DialogHeader>
                <AddProspectForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              prospects={groupedByStatus[status] || []}
              isLoading={isLoading}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
