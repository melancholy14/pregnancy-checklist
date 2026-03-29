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
        className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isCurrent ? "scale-110 ring-4 ring-white" : ""
        }`}
        style={{ backgroundColor: milestone.color }}
      >
        <Icon size={28} color="#4A4A4A" strokeWidth={2} />
      </div>

      {/* Week Badge */}
      <Badge
        className="absolute left-16 top-0 rounded-full text-sm shadow-sm border-0 text-[#4A4A4A]"
        style={{ backgroundColor: milestone.color }}
      >
        {milestone.week}주
      </Badge>

      {/* Card */}
      <Card
        className={`rounded-2xl shadow-md mt-10 transition-all border-0 ${
          isCurrent ? "ring-2 ring-offset-2" : ""
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
                className="flex items-start gap-2 text-sm text-gray-600"
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
