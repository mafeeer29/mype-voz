import { APP_CONFIG } from "../../config/appConfig";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 bg-surface-elevated/95 backdrop-blur border-b border-line">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {APP_CONFIG.name.charAt(0)}
          </div>
          <div>
            <p className="text-base font-bold text-ink leading-tight">
              {APP_CONFIG.name}
            </p>
            <p className="text-xs text-ink-muted leading-tight">
              {APP_CONFIG.slogan}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
