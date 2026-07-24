import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Cargando..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-ink-soft">
      <Loader2 size={28} className="animate-spin text-primary-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
