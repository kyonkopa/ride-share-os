import { useMemo } from "react"
import { ArrowLeft, Receipt } from "lucide-react"
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
import { formatDate } from "@/utils/dateUtils"

type ExpenseStats = {
  totalAmount: number
  categoryTotals: Record<string, number>
}

export interface ExpenseBreakdownViewProps {
  stats: ExpenseStats | null | undefined
  startDate?: string
  endDate?: string
  onBack: () => void
}

// Generate a color palette for categories
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
  "#a4de6c",
  "#d0ed57",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#f0932b",
  "#eb4d4b",
  "#6c5ce7",
  "#a29bfe",
  "#fd79a8",
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

function formatCategoryName(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export function ExpenseBreakdownView({
  stats,
  startDate,
  endDate,
  onBack,
}: ExpenseBreakdownViewProps) {
  const chartData = useMemo(() => {
    if (!stats || !stats.categoryTotals) return []

    const entries = Object.entries(stats.categoryTotals)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount], index) => ({
        name: formatCategoryName(category),
        value: amount,
        color: COLORS[index % COLORS.length],
        percentage: (amount / stats.totalAmount) * 100,
      }))
      .sort((a, b) => b.value - a.value)

    return entries
  }, [stats])

  type TooltipProps = {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      payload: {
        name: string
        value: number
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
            {formatCurrency(data.value)} ({data.payload.percentage.toFixed(1)}%)
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
          <h1 className="text-2xl font-bold">Expense Breakdown</h1>
          <p className="text-sm text-muted-foreground">
            Category distribution of expenses
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
      {!stats || chartData.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>No expense data found</EmptyTitle>
            <EmptyDescription>
              No expense records available for the selected period.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>
                Visual breakdown of expenses by category
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
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const percentage =
                          (entry.value / stats.totalAmount) * 100
                        return percentage > 5 ? `${percentage.toFixed(1)}%` : ""
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
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

          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
              <CardDescription>
                Detailed breakdown of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chartData.map((item, index) => (
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
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
