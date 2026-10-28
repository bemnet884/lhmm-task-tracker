import { Play } from "lucide-react";

export function Logo({
  text = true,
  className = "",
}: {
  text?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Play className="h-4 w-4 fill-current" />
      </span>
      {text && <span className="font-semibold tracking-tight">Media Team Tracker</span>}
    </span>
  );
}