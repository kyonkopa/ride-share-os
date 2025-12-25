import { useState, useRef, useCallback, useEffect } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
}

interface PullToRefreshState {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  })

  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const elementRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || state.isRefreshing) return

      // Check if we're at the top of the page
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || 0

      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY
        currentY.current = startY.current
        setState((prev) => ({ ...prev, isPulling: true, pullDistance: 0 }))
      }
    },
    [disabled, state.isRefreshing]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || !state.isPulling || state.isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, currentY.current - startY.current)

      // Only allow pull down, not up
      if (distance > 0) {
        e.preventDefault()
        setState((prev) => ({ ...prev, pullDistance: distance }))
      }
    },
    [disabled, state.isPulling, state.isRefreshing]
  )

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !state.isPulling) return

    if (state.pullDistance >= threshold) {
      setState((prev) => ({ ...prev, isRefreshing: true, isPulling: false }))
      try {
        await onRefresh()
      } catch (error) {
        console.error("Pull to refresh error:", error)
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
        })
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
      })
    }
  }, [disabled, state.isPulling, state.pullDistance, threshold, onRefresh])

  useEffect(() => {
    if (disabled) return

    // Attach listeners to document for better mobile support
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ...state,
    elementRef,
    pullProgress: Math.min(state.pullDistance / threshold, 1),
  }
}
