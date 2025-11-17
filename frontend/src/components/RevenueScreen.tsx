import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { useGroupedRevenueRecords } from "@/features/revenue-records/useGroupedRevenueRecords"
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
import { DollarSign, BarChart3, Plus } from "lucide-react"
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
import type {
  RevenueRecord,
  RevenueSourceEnum,
  DriverDateRevenueGroup,
} from "@/codegen/graphql"
import NumberFlow from "@number-flow/react"
import { RevenueForm } from "./RevenueForm"
import { formatDate } from "@/utils/dateUtils"
import { FinanceDetailsBreakdownView } from "./FinanceDetailsBreakdownView"
import { Building2 } from "lucide-react"
import { useAuthorizer } from "@/hooks/useAuthorizer"
import { PermissionEnum } from "@/codegen/graphql"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

interface RevenueRecordCardProps {
  group: DriverDateRevenueGroup
}

function RevenueRecordCard({ group }: RevenueRecordCardProps) {
  // Convert sourceBreakdown from object to array for display
  const sourceBreakdownArray = useMemo(() => {
    const sourceBreakdown = (group.sourceBreakdown || {}) as Record<
      string,
      { revenue: number; profit: number; reconciled: boolean }
    >
    return Object.entries(sourceBreakdown).map(([source, data]) => ({
      source: source as RevenueSourceEnum,
      revenue: data.revenue || 0,
      profit: data.profit || 0,
      reconciled: data.reconciled !== false,
    }))
  }, [group.sourceBreakdown])

  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{formatCurrency(group.totalRevenue)}</CardTitle>
        <Badge
          className={cn(
            group.allReconciled ? "border-green-500" : "border-amber-500"
          )}
          variant="outline"
        >
          {group.allReconciled ? "Reconciled" : "Unreconciled"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Profit: {formatCurrency(group.totalProfit)}</div>
          <div>Driver: {group.driverName}</div>
          <div>Vehicle: {group.vehicleName || "N/A"}</div>
          <div>Date: {formatDate(group.date)}</div>

          {sourceBreakdownArray.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="breakdown" className="border-none">
                <AccordionTrigger className="py-2 text-sm">
                  <span className="truncate underline text-primary">
                    View Source Breakdown
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {sourceBreakdownArray.map((item) => (
                      <div
                        key={item.source}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {item.source.replace(/_/g, " ")}
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
          <span className="ml-2">Loading revenue stats...</span>
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
  const { can } = useAuthorizer()
  const [activeTab, setActiveTab] = useState<
    "this-week" | "last-week" | "this-month" | "all-time"
  >("this-week")
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showFinanceDetails, setShowFinanceDetails] = useState(false)

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

  // Calculate current month start and end dates
  const monthDates = useMemo(() => {
    const now = DateTime.now()
    const monthStart = now.startOf("month")
    const monthEnd = now.endOf("month")
    return {
      start: monthStart.toISODate(),
      end: monthEnd.toISODate(),
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
    if (activeTab === "this-month") {
      return {
        startDate: monthDates.start,
        endDate: monthDates.end,
      }
    }
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }, [activeTab, weekDates, lastWeekDates, monthDates])

  const {
    groups: groupedRevenueRecords,
    stats: groupedStats,
    loading,
    error,
  } = useGroupedRevenueRecords({
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    pagination: { page: 1, perPage: 100 },
    skip: false,
  })

  // Use stats from grouped query
  const stats = useMemo(() => {
    if (groupedStats) {
      return {
        totalRevenue: groupedStats.totalRevenue,
        totalProfit: groupedStats.totalProfit,
        sourceTotals: groupedStats.sourceTotals,
      }
    }
    return null
  }, [groupedStats])

  const statsLoading = loading

  // Use grouped revenue records directly
  const revenueGroups = useMemo(() => {
    return (groupedRevenueRecords || []) as DriverDateRevenueGroup[]
  }, [groupedRevenueRecords])

  const isLoading = loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-2">Loading revenue records...</span>
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

  // Show finance details breakdown view
  if (showFinanceDetails) {
    return (
      <FinanceDetailsBreakdownView
        onBack={() => setShowFinanceDetails(false)}
      />
    )
  }

  // Show breakdown view
  if (showBreakdown) {
    // Flatten grouped records for breakdown view
    const flatRevenueRecords = revenueGroups.flatMap(
      (group) => group.revenueRecords
    ) as RevenueRecord[]
    return (
      <BreakdownView
        revenueRecords={flatRevenueRecords}
        startDate={dateParams.startDate}
        endDate={dateParams.endDate}
        onBack={() => setShowBreakdown(false)}
        sourceTotals={stats?.sourceTotals}
        totalRevenue={stats?.totalRevenue}
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
        <Button
          onClick={() => setShowAddRevenue(true)}
          className="hidden md:flex"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Revenue
        </Button>
      </div>

      {/* Finance Details Button */}
      {can(PermissionEnum.RevenueReadAccess) && (
        <Card
          className="cursor-pointer bg-blue-100 hover:bg-muted/80 border-blue-400 p-2"
          onClick={() => setShowFinanceDetails(true)}
        >
          <CardHeader className="p-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Financial Breakdown
            </CardTitle>
            <CardDescription>View monthly financial breakdown</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Bar */}
      <RevenueStatsBar
        stats={stats}
        loading={statsLoading || false}
        onBreakdownClick={() => setShowBreakdown(true)}
        periodLabel={
          activeTab === "this-week"
            ? "Revenue for this week"
            : activeTab === "last-week"
              ? "Revenue for last week"
              : activeTab === "this-month"
                ? "Revenue for this month"
                : "All-time revenue"
        }
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as "this-week" | "last-week" | "this-month" | "all-time"
          )
        }
      >
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="last-week">Last Week</TabsTrigger>
          <TabsTrigger value="this-month">This Month</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>
        <TabsContent value="this-week" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing revenue from {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)} grouped by driver
            </p>
          )}
          {/* Revenue Records List */}
          {revenueGroups.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueGroups.map((group, index) => (
                <RevenueRecordCard
                  key={`${group.driverId}-${group.date}-${index}`}
                  group={group}
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
          {revenueGroups.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueGroups.map((group, index) => (
                <RevenueRecordCard
                  key={`${group.driverId}-${group.date}-${index}`}
                  group={group}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="this-month" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing revenue from {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)} grouped by driver
            </p>
          )}
          {/* Revenue Records List */}
          {revenueGroups.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueGroups.map((group, index) => (
                <RevenueRecordCard
                  key={`${group.driverId}-${group.date}-${index}`}
                  group={group}
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
          {revenueGroups.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueGroups.map((group, index) => (
                <RevenueRecordCard
                  key={`${group.driverId}-${group.date}-${index}`}
                  group={group}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Revenue Modal */}
      {showAddRevenue && (
        <RevenueForm
          open={true}
          onOpenChange={setShowAddRevenue}
          revenueRecordsQueryVariables={{
            startDate: dateParams.startDate,
            endDate: dateParams.endDate,
          }}
          groupedRevenueRecordsQueryVariables={{
            startDate: dateParams.startDate,
            endDate: dateParams.endDate,
            pagination: { page: 1, perPage: 100 },
          }}
        />
      )}

      {/* Floating Add Revenue Button - Only on small screens */}
      <Button
        onClick={() => setShowAddRevenue(true)}
        className="fixed bottom-6 right-6 shadow-2xl z-50 md:hidden"
        style={{
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(59, 130, 246, 0.3)",
        }}
        size="lg"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Revenue
      </Button>
    </div>
  )
}
