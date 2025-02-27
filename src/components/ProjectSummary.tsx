
import { Clock, Euro } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserStory } from "@/types/project";

interface ProjectSummaryProps {
  features: UserStory[];
}

const calculateTotals = (features: UserStory[]) => {
  return features.reduce((acc, feature) => {
    if (feature.estimation) {
      return {
        hours: acc.hours + feature.estimation.hours,
        cost: acc.cost + feature.estimation.cost
      };
    }
    return acc;
  }, { hours: 0, cost: 0 });
};

export function ProjectSummary({ features }: ProjectSummaryProps) {
  const totals = calculateTotals(features);

  return (
    <Card className="p-8 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom duration-700 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-violet-600 to-teal-600 dark:from-rose-400 dark:via-violet-400 dark:to-teal-400 bg-clip-text text-transparent m-0">
          Project Summary
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-violet-500/10 dark:bg-violet-500/20 px-4 py-2 rounded-full">
            <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
              {totals.hours}h
            </span>
            <span className="text-sm text-violet-600/70 dark:text-violet-400/70">
              Total Hours
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-2 rounded-full">
            <Euro className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {totals.cost}€
            </span>
            <span className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
              Total Cost
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
