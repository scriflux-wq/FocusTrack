import { Timer } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-surface p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Timer className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">FocusTrack</h1>
          <p className="text-sm text-muted-foreground">
            Tu tiempo, con claridad.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
