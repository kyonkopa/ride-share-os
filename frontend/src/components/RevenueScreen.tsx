import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { useRevenueRecords } from "@/features/revenue-records/useRevenueRecords"
import { useRevenueStats } from "@/features/revenue-records/useRevenueStats"
import { BreakdownView } from "@/features/revenue-records/BreakdownView"
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
import { DollarSign, BarChart3 } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { cn } from "@/lib/utils"
import type { RevenueRecord, RevenueSourceEnum } from "@/codegen/graphql"
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

type MergedRevenueRecord = {
  driverId: string
  driverName: string
  date: string
  totalRevenue: number
  totalProfit: number
  allReconciled: boolean
  vehicle?: string
  sourceBreakdown: Array<{
    source: RevenueSourceEnum
    revenue: number
    profit: number
    reconciled: boolean
  }>
  records: RevenueRecord[]
}

interface RevenueRecordCardProps {
  mergedRecord: MergedRevenueRecord
}

function RevenueRecordCard({ mergedRecord }: RevenueRecordCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{formatCurrency(mergedRecord.totalRevenue)}</CardTitle>
        <Badge
          className={cn(
            mergedRecord.allReconciled ? "bg-green-500" : "bg-amber-500"
          )}
        >
          {mergedRecord.allReconciled ? "Reconciled" : "Unreconciled"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Profit: {formatCurrency(mergedRecord.totalProfit)}</div>
          <div>Driver: {mergedRecord.driverName}</div>
          <div>Vehicle: {mergedRecord.vehicle || "N/A"}</div>
          <div>Date: {formatDate(mergedRecord.date)}</div>

          {!!mergedRecord.sourceBreakdown.length && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="breakdown" className="border-none">
                <AccordionTrigger className="py-2 text-sm">
                  <span className="truncate underline">
                    View Source Breakdown
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {mergedRecord.sourceBreakdown.map((item) => (
                      <div
                        key={item.source}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {item.source}
                          </span>
                          <Badge
                            className={cn(
                              item.reconciled ? "bg-green-500" : "bg-amber-500"
                            )}
                          >
                            {item.reconciled ? "Reconciled" : "Unreconciled"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(item.revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Profit: {formatCurrency(item.profit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
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

interface RevenueStatsBarProps {
  stats: RevenueStats | null | undefined
  loading: boolean
  onBreakdownClick: () => void
  periodLabel: string
}

function RevenueStatsBar({
  stats,
  loading,
  onBreakdownClick,
  periodLabel,
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

export function RevenueScreen() {
  const [activeTab, setActiveTab] = useState<
    "this-week" | "last-week" | "all-time"
  >("this-week")
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

  // Calculate last week start and end dates
  const lastWeekDates = useMemo(() => {
    const now = DateTime.now()
    const lastWeekStart = now.minus({ weeks: 1 }).startOf("week")
    const lastWeekEnd = now.minus({ weeks: 1 }).endOf("week")
    return {
      start: lastWeekStart.toISODate(),
      end: lastWeekEnd.toISODate(),
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
    if (activeTab === "last-week") {
      return {
        startDate: lastWeekDates.start,
        endDate: lastWeekDates.end,
      }
    }
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }, [activeTab, weekDates, lastWeekDates])

  const { revenueRecords, loading, error } = useRevenueRecords(
    dateParams.startDate,
    dateParams.endDate
  )

  const { stats, loading: statsLoading } = useRevenueStats(
    dateParams.startDate,
    dateParams.endDate
  )

  // Merge revenue records by driver and date
  const mergedRevenueRecords = useMemo(() => {
    const mergedMap = new Map<string, MergedRevenueRecord>()

    revenueRecords.forEach((record) => {
      const date = new Date(record.createdAt).toISOString().split("T")[0]
      const key = `${record.driver.id}-${date}`

      const existing = mergedMap.get(key)

      if (existing) {
        // Update totals
        existing.totalRevenue += record.totalRevenue
        existing.totalProfit += record.totalProfit
        existing.allReconciled = existing.allReconciled && record.reconciled

        // Update or add source breakdown
        const sourceItem = existing.sourceBreakdown.find(
          (item) => item.source === record.source
        )
        if (sourceItem) {
          sourceItem.revenue += record.totalRevenue
          sourceItem.profit += record.totalProfit
          sourceItem.reconciled = sourceItem.reconciled && record.reconciled
        } else {
          existing.sourceBreakdown.push({
            source: record.source,
            revenue: record.totalRevenue,
            profit: record.totalProfit,
            reconciled: record.reconciled,
          })
        }

        existing.records.push(record)
      } else {
        // Create new merged record
        mergedMap.set(key, {
          driverId: record.driver.id,
          driverName: record.driver.fullName,
          date: record.createdAt,
          totalRevenue: record.totalRevenue,
          totalProfit: record.totalProfit,
          allReconciled: record.reconciled,
          vehicle: record.shiftAssignment.vehicle?.displayName,
          sourceBreakdown: [
            {
              source: record.source,
              revenue: record.totalRevenue,
              profit: record.totalProfit,
              reconciled: record.reconciled,
            },
          ],
          records: [record],
        })
      }
    })

    // Sort by date descending
    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [revenueRecords])

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
      {(activeTab === "this-week" || activeTab === "last-week") && (
        <RevenueStatsBar
          stats={stats}
          loading={statsLoading}
          onBreakdownClick={() => setShowBreakdown(true)}
          periodLabel={
            activeTab === "this-week"
              ? "Revenue for this week"
              : "Revenue for last week"
          }
        />
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "this-week" | "last-week" | "all-time")
        }
      >
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="last-week">Last Week</TabsTrigger>
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
          {mergedRevenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedRevenueRecords.map((mergedRecord, index) => (
                <RevenueRecordCard
                  key={`${mergedRecord.driverId}-${mergedRecord.date}-${index}`}
                  mergedRecord={mergedRecord}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="last-week" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing revenue records for {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)}
            </p>
          )}
          {/* Revenue Records List */}
          {mergedRevenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedRevenueRecords.map((mergedRecord, index) => (
                <RevenueRecordCard
                  key={`${mergedRecord.driverId}-${mergedRecord.date}-${index}`}
                  mergedRecord={mergedRecord}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all-time" className="mt-3">
          <p className="text-sm text-muted-foreground mb-4">
            Showing all revenue records
          </p>
          {/* Revenue Records List */}
          {mergedRevenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedRevenueRecords.map((mergedRecord, index) => (
                <RevenueRecordCard
                  key={`${mergedRecord.driverId}-${mergedRecord.date}-${index}`}
                  mergedRecord={mergedRecord}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
