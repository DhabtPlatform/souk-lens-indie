"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn-style Switch (button-based, logical-direction aware via .souk-switch in globals.css)
const Switch = React.forwardRef<HTMLButtonElement, {
  checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string; "aria-label"?: string;
}>(({ checked = false, onCheckedChange, disabled, className, ...props }, ref) => (
  <button
    ref={ref} type="button" role="switch" aria-checked={checked} data-checked={checked ? "true" : "false"} disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      "souk-switch inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-6",
      checked ? "bg-accent" : "bg-input", className
    )} {...props}
  >
    <span className="souk-switch-thumb pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0" />
  </button>
));
Switch.displayName = "Switch";
export { Switch };
