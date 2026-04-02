import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Milestone {
  week: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  title: string;
  tasks: string[];
}

interface TimelineCardProps {
  milestone: Milestone;
  isCurrent: boolean;
}

export function TimelineCard({ milestone, isCurrent }: TimelineCardProps) {
  const Icon = milestone.icon;

  return (
    <div className="relative pl-20">
      {/* Badge */}
      <div
        className={`absolute left-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all border border-black/4 ${
          isCurrent ? "scale-110 ring-4 ring-white" : ""
        }`}
        style={{ backgroundColor: milestone.color }}
      >
        <Icon size={26} color="#2D3436" strokeWidth={1.8} />
      </div>

      {/* Week Badge */}
      <Badge
        className="absolute left-16 top-0 rounded-lg text-sm border border-black/4 text-[#2D3436] font-medium"
        style={{ backgroundColor: milestone.color }}
      >
        {milestone.week}주
      </Badge>

      {/* Card */}
      <Card
        className={`rounded-xl shadow-sm mt-10 transition-all border ${
          isCurrent ? "ring-2 ring-offset-2 border-black/4" : "border-black/4"
        }`}
        style={
          isCurrent
            ? ({ "--tw-ring-color": milestone.color } as React.CSSProperties)
            : {}
        }
      >
        <CardContent className="p-5">
          <h3 className="mb-3">{milestone.title}</h3>
          <ul className="space-y-2">
            {milestone.tasks.map((task, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: milestone.color }}
                />
                {task}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
