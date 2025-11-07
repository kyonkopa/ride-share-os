import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { useRevenueRecords } from "@/features/revenue-records/useRevenueRecords"
import { useRevenueStats } from "@/features/revenue-records/useRevenueStats"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { DollarSign, ArrowLeft, BarChart3 } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { cn } from "@/lib/utils"
import type { RevenueRecord } from "@/codegen/graphql"
import NumberFlow from "@number-flow/react"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface RevenueRecordCardProps {
  record: RevenueRecord
}

function RevenueRecordCard({ record }: RevenueRecordCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>{formatCurrency(record.totalRevenue)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Profit: {formatCurrency(record.totalProfit)}</div>
          <div>Driver: {record.driver.fullName}</div>
          <div>
            Vehicle: {record.shiftAssignment.vehicle?.displayName || "N/A"}
          </div>
          <div>Date: {formatDate(record.createdAt)}</div>
          <div>
            Source: <span className="capitalize">{record.source}</span>
          </div>
          <Badge
            className={cn(record.reconciled ? "bg-green-500" : "bg-amber-500")}
          >
            {record.reconciled ? "Reconciled" : "Unreconciled"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueRecordsEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DollarSign />
        </EmptyMedia>
        <EmptyTitle>No revenue records found</EmptyTitle>
        <EmptyDescription>
          Revenue records will appear here once they are created.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

type RevenueStats = {
  totalRevenue: number
  totalProfit: number
  count: number
  sourceTotals: Record<string, { revenue: number; profit: number }>
}

type DailyBreakdown = {
  date: string
  revenue: number
  profit: number
  count: number
}

interface RevenueStatsBarProps {
  stats: RevenueStats | null | undefined
  loading: boolean
  onBreakdownClick: () => void
}

function RevenueStatsBar({
  stats,
  loading,
  onBreakdownClick,
}: RevenueStatsBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (stats) {
      setAnimatedValue(0)

      // After 100ms, set to the actual value
      const timer = setTimeout(() => {
        setAnimatedValue(stats.totalRevenue)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [stats])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>Revenue Summary</CardTitle>
        <CardDescription>Revenue for this week</CardDescription>
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

interface BreakdownViewProps {
  revenueRecords: RevenueRecord[]
  startDate?: string
  endDate?: string
  onBack: () => void
}

function BreakdownView({
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

export function RevenueScreen() {
  const [activeTab, setActiveTab] = useState<"this-week" | "all-time">(
    "this-week"
  )
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Calculate current week start and end dates
  const weekDates = useMemo(() => {
    const now = DateTime.now()
    const weekStart = now.startOf("week")
    const weekEnd = now.endOf("week")
    return {
      start: weekStart.toISODate(),
      end: weekEnd.toISODate(),
    }
  }, [])

  // Determine date parameters based on active tab
  const dateParams = useMemo(() => {
    if (activeTab === "this-week") {
      return {
        startDate: weekDates.start,
        endDate: weekDates.end,
      }
    }
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }, [activeTab, weekDates])

  const { revenueRecords, loading, error } = useRevenueRecords(
    dateParams.startDate,
    dateParams.endDate
  )

  const { stats, loading: statsLoading } = useRevenueStats(
    dateParams.startDate,
    dateParams.endDate
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Error loading revenue records</AlertTitle>
        <AlertDescription>
          <p>Error: {error.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  // Show breakdown view
  if (showBreakdown) {
    return (
      <BreakdownView
        revenueRecords={revenueRecords}
        startDate={dateParams.startDate}
        endDate={dateParams.endDate}
        onBack={() => setShowBreakdown(false)}
      />
    )
  }

  // Show default view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue</h1>
          <p className="text-sm text-muted-foreground">
            View all your revenue records
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      {activeTab === "this-week" && (
        <RevenueStatsBar
          stats={stats}
          loading={statsLoading}
          onBreakdownClick={() => setShowBreakdown(true)}
        />
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "this-week" | "all-time")
        }
      >
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>
        <TabsContent value="this-week" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing revenue records for {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)}
            </p>
          )}
          {/* Revenue Records List */}
          {revenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueRecords.map((record) => (
                <RevenueRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all-time" className="mt-3">
          <p className="text-sm text-muted-foreground mb-4">
            Showing all revenue records
          </p>
          {/* Revenue Records List */}
          {revenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueRecords.map((record) => (
                <RevenueRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
