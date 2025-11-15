import { useMemo } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DollarSign } from "lucide-react"
import type { RevenueRecord } from "@/codegen/graphql"
import { formatDate } from "@/utils/dateUtils"

type DailyBreakdown = {
  date: string
  revenue: number
  profit: number
  count: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

export interface BreakdownViewProps {
  revenueRecords: RevenueRecord[]
  startDate?: string
  endDate?: string
  onBack: () => void
}

export function BreakdownView({
  revenueRecords,
  startDate,
  endDate,
  onBack,
}: BreakdownViewProps) {
  // Calculate daily breakdown
  const dailyBreakdown = useMemo(() => {
    if (!revenueRecords.length) return []

    const breakdownMap = new Map<string, DailyBreakdown>()

    revenueRecords.forEach((record) => {
      const date = new Date(record.createdAt).toISOString().split("T")[0]
      const existing = breakdownMap.get(date)

      if (existing) {
        existing.revenue += record.totalRevenue
        existing.profit += record.totalProfit
        existing.count += 1
      } else {
        breakdownMap.set(date, {
          date,
          revenue: record.totalRevenue,
          profit: record.totalProfit,
          count: 1,
        })
      }
    })

    // Sort by date descending
    return Array.from(breakdownMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [revenueRecords])

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue Breakdown</h1>
          <p className="text-sm text-muted-foreground">
            Daily revenue breakdown
            {startDate && endDate && (
              <>
                {" "}
                ({formatDate(startDate)} - {formatDate(endDate)})
              </>
            )}
          </p>
        </div>
      </div>

      {/* Breakdown Content */}
      {dailyBreakdown.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DollarSign />
            </EmptyMedia>
            <EmptyTitle>No revenue data found</EmptyTitle>
            <EmptyDescription>
              No revenue records available for the selected period.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>
              Revenue breakdown by day
              {startDate && endDate && (
                <>
                  {" "}
                  ({formatDate(startDate)} - {formatDate(endDate)})
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyBreakdown.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{formatDate(day.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.count} record{day.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(day.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profit: {formatCurrency(day.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
