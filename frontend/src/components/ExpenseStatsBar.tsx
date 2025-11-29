import { useState, useEffect } from "react"
import { BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import NumberFlow from "@number-flow/react"

export type ExpenseStats = {
  totalAmount: number
  categoryTotals: Record<string, number>
}

interface ExpenseStatsBarProps {
  stats: ExpenseStats | null | undefined
  loading: boolean
  periodLabel: string
  onBreakdownClick: () => void
}

export function ExpenseStatsBar({
  stats,
  loading,
  periodLabel,
  onBreakdownClick,
}: ExpenseStatsBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  // Extract totalAmount to avoid unnecessary re-renders when stats object reference changes
  const totalAmount = stats?.totalAmount

  useEffect(() => {
    if (totalAmount !== undefined) {
      setAnimatedValue(0)

      // After 100ms, set to the actual value
      const timer = setTimeout(() => {
        setAnimatedValue(totalAmount)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [totalAmount])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Spinner />
          <span className="ml-2">Loading expense stats...</span>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary">
            <span className="mr-1">GHS</span>
            <NumberFlow value={animatedValue} />
          </p>
          <Button variant="outline" onClick={onBreakdownClick}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Breakdown
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
