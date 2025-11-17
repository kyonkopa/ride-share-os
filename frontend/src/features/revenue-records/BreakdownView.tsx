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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { DollarSign } from "lucide-react"
import type { RevenueRecord } from "@/codegen/graphql"
import { formatDate } from "@/utils/dateUtils"

type DailyBreakdown = {
  date: string
  revenue: number
  profit: number
  count: number
}

// Generate a color palette for sources
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

function formatSourceName(source: string): string {
  return source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export interface BreakdownViewProps {
  revenueRecords: RevenueRecord[]
  startDate?: string
  endDate?: string
  onBack: () => void
  sourceTotals?: Record<string, { revenue: number; profit: number }>
  totalRevenue?: number
}

export function BreakdownView({
  revenueRecords,
  startDate,
  endDate,
  onBack,
  sourceTotals: sourceTotalsProp,
  totalRevenue: totalRevenueProp,
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

  // Use source breakdown from props
  const sourceBreakdown = useMemo(() => {
    if (!sourceTotalsProp || !totalRevenueProp) {
      return { chartData: [], totalRevenue: 0 }
    }

    const chartData = Object.entries(sourceTotalsProp)
      .filter(([, data]) => data.revenue > 0)
      .map(([source, data], index) => ({
        name: formatSourceName(source),
        value: data.revenue,
        profit: data.profit,
        color: COLORS[index % COLORS.length],
        percentage:
          totalRevenueProp > 0 ? (data.revenue / totalRevenueProp) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)

    return { chartData, totalRevenue: totalRevenueProp }
  }, [sourceTotalsProp, totalRevenueProp])

  type TooltipProps = {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      payload: {
        name: string
        value: number
        profit: number
        percentage: number
        color: string
      }
    }>
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.value)} (
            {data.payload.percentage.toFixed(1)}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Profit: {formatCurrency(data.payload.profit)}
          </p>
        </div>
      )
    }
    return null
  }

  type LegendProps = {
    payload?: Array<{
      value: string
      color: string
      payload: {
        name: string
        value: number
        profit: number
        percentage: number
        color: string
      }
    }>
  }

  const CustomLegend = ({ payload }: LegendProps) => {
    return (
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {payload?.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.value} ({entry.payload.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    )
  }

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
      {dailyBreakdown.length === 0 && sourceBreakdown.chartData.length === 0 ? (
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
        <div className="space-y-4">
          {/* Source Breakdown Pie Chart */}
          {sourceBreakdown.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>
                  Visual breakdown of revenue by source
                  {startDate && endDate && (
                    <>
                      {" "}
                      ({formatDate(startDate)} - {formatDate(endDate)})
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceBreakdown.chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => {
                          const percentage =
                            (entry.value / sourceBreakdown.totalRevenue) * 100
                          return percentage > 5
                            ? `${percentage.toFixed(1)}%`
                            : ""
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceBreakdown.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Details List */}
          {sourceBreakdown.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of revenue by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sourceBreakdown.chartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(item.value)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.percentage.toFixed(1)}% • Profit:{" "}
                          {formatCurrency(item.profit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Breakdown */}
          {dailyBreakdown.length > 0 && (
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
      )}
    </div>
  )
}
