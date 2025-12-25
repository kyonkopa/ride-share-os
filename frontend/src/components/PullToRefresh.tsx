import type { ReactNode } from "react"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void> | void
  disabled?: boolean
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className = "",
}: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, pullProgress } =
    usePullToRefresh({
      onRefresh,
      threshold,
      disabled,
    })

  const shouldShowIndicator = isPulling || isRefreshing
  const opacity = Math.min(pullProgress, 1)
  const rotation = pullProgress * 180

  return (
    <div className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      {shouldShowIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-200"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
            opacity,
          }}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <Loader2
              className={`h-6 w-6 text-primary transition-transform duration-200 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: isRefreshing
                  ? "rotate(0deg)"
                  : `rotate(${rotation}deg)`,
              }}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {isRefreshing ? "Refreshing..." : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: shouldShowIndicator
            ? `translateY(${Math.min(pullDistance, threshold)}px)`
            : "translateY(0)",
          transition: isRefreshing
            ? "transform 0.2s ease-out"
            : "transform 0.1s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}
