import { MapPin, Banknote, ArrowUpRight } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";

export function JobCard({ job, action }) {
  return (
    <Card className="border-border/70 shadow-none transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-800">
            {job.initials}
          </div>
          {action}
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{job.company}</span>
          {job.featured && <Badge variant="secondary">Nổi bật</Badge>}
        </div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          {job.title}
          <ArrowUpRight aria-hidden="true" className="ml-1 inline size-4 text-emerald-600" />
        </h2>
        <p className="mb-5 min-h-15 text-sm leading-6 text-muted-foreground">{job.description}</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <Banknote className="size-4" aria-hidden="true" />
            {job.salary}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{job.type}</p>
      </CardContent>
    </Card>
  );
}
