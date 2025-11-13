import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineErrorAlertProps {
  message: string
  variant?: "error" | "warning"
  className?: string
}

export function InlineErrorAlert({
  message,
  variant = "error",
  className,
}: InlineErrorAlertProps) {
  const isError = variant === "error"

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-md",
        isError
          ? "bg-red-50 border border-red-200"
          : "bg-yellow-50 border border-yellow-200",
        className
      )}
    >
      <AlertCircle
        className={cn("h-4 w-4", isError ? "text-red-600" : "text-yellow-600")}
      />
      <p
        className={cn("text-sm", isError ? "text-red-600" : "text-yellow-600")}
      >
        {message}
      </p>
    </div>
  )
}
