import { useState, useMemo, useEffect } from "react"
import { useGroupedRevenueRecords } from "@/features/revenue-records/useGroupedRevenueRecords"
import { BreakdownView } from "@/features/revenue-records/BreakdownView"
import { useDateParams, type DateTab } from "@/hooks/useDateParams"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useDrivers } from "@/features/drivers/useDrivers"
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
import { RevenueSourceEnum as RevenueSourceEnumValues } from "@/codegen/graphql"
import NumberFlow from "@number-flow/react"
import { RevenueForm } from "./RevenueForm"
import { formatDate } from "@/utils/dateUtils"
import { FinanceDetailsBreakdownView } from "./FinanceDetailsBreakdownView"
import { Building2 } from "lucide-react"
import { useAuthorizer } from "@/hooks/useAuthorizer"
import { PermissionEnum } from "@/codegen/graphql"
import { Switch } from "./ui/switch"
import { useAuthStore } from "@/stores/AuthStore"
import { Label } from "./ui/label"
import {
  FilterDialog,
  ActiveFilters,
  FilterButton,
  useFilters,
  type FilterConfig,
  DateFilterValue,
} from "./filters"

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

  // Extract totalRevenue to avoid unnecessary re-renders when stats object reference changes
  const totalRevenue = stats?.totalRevenue

  useEffect(() => {
    if (totalRevenue !== undefined) {
      setAnimatedValue(0)

      // After 100ms, set to the actual value
      const timer = setTimeout(() => {
        setAnimatedValue(totalRevenue)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [totalRevenue])

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
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<DateTab>("this-week")
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showFinanceDetails, setShowFinanceDetails] = useState(false)
  const [showOnlyMyRevenue, setShowOnlyMyRevenue] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const { vehicles } = useVehicles()
  const { drivers } = useDrivers()

  const filterConfigs: FilterConfig[] = useMemo(() => {
    const configs: FilterConfig[] = []

    if (can(PermissionEnum.DriverWriteAccess)) {
      configs.push({
        type: "select",
        key: "driverId",
        label: "Driver",
        options: drivers.map((d) => ({
          value: d.globalId || d.id,
          label: d.fullName,
        })),
        placeholder: "All drivers",
      })
    }

    configs.push(
      {
        type: "select",
        key: "vehicleId",
        label: "Vehicle",
        options: vehicles.map((v) => ({
          value: v.id,
          label: v.displayName,
        })),
        placeholder: "All vehicles",
      },
      {
        type: "select",
        key: "source",
        label: "Source",
        options: Object.values(RevenueSourceEnumValues).map((source) => ({
          value: source,
          label: source
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
        placeholder: "All sources",
      },
      {
        type: "date",
        key: "startDate",
        label: "Start Date",
        placeholder: "Select start date",
        max: "endDate", // Can't select dates after end date
      },
      {
        type: "date",
        key: "endDate",
        label: "End Date",
        placeholder: "Select end date",
        max: DateFilterValue.now, // Can't select dates in the future
        min: "startDate", // Can't select dates before start date
      }
    )

    return configs
  }, [vehicles, drivers, can])

  const { filters, hasActiveFilters, setFilters, clearFilters } = useFilters({
    filterConfigs,
    onFiltersChange: () => {
      // Reset any local state if needed when filters change
    },
  })

  // Calculate date parameters based on active tab and filters
  const dateParams = useDateParams({
    activeTab,
    filters,
    hasActiveFilters,
  })

  // Get current driver id if user has a driver profile
  const currentDriverId = useMemo(() => {
    return user?.driver?.id || null
  }, [user?.driver?.id])

  // Determine driverId to pass to query:
  // - If filters are active and driverId is set, use that (explicit filter)
  // - If no filters but "show only my revenue" is enabled, use currentDriverId
  // - Otherwise, don't filter by driver
  const queryDriverId = useMemo(() => {
    if (hasActiveFilters && filters.driverId) {
      return filters.driverId as string | undefined
    }
    if (!hasActiveFilters && showOnlyMyRevenue && currentDriverId) {
      return currentDriverId
    }
    return undefined
  }, [hasActiveFilters, filters.driverId, showOnlyMyRevenue, currentDriverId])

  const {
    groups: groupedRevenueRecords,
    stats: groupedStats,
    loading: groupedLoading,
    error: groupedError,
  } = useGroupedRevenueRecords({
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    driverId: queryDriverId,
    vehicleId: filters.vehicleId as string | undefined,
    source: filters.source as string | undefined,
    pagination: { page: 1, perPage: 100 },
    skip: false,
  })

  const loading = groupedLoading
  const error = groupedError

  // Use stats directly from grouped query (backend handles filtering)
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

  // Use grouped revenue records directly (backend handles filtering)
  const revenueGroups = useMemo(() => {
    return (groupedRevenueRecords || []) as DriverDateRevenueGroup[]
  }, [groupedRevenueRecords])

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
        <div className="flex items-center gap-2">
          <FilterButton
            onClick={() => setShowFilters(true)}
            filterConfigs={filterConfigs}
            filters={filters}
            className="hidden md:flex"
          />
          <Button
            onClick={() => setShowAddRevenue(true)}
            className="hidden md:flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Revenue
          </Button>
        </div>
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
              Finance Breakdown
            </CardTitle>
            <CardDescription>View monthly financial breakdown</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Filter Switch - Only show if user has a driver profile and no driver filter is active */}
      {currentDriverId && !filters.driverId && (
        <Card className="border-dashed py-3">
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-only-my-revenue" className="cursor-pointer">
                Show only my revenue
              </Label>
              <Switch
                id="show-only-my-revenue"
                checked={showOnlyMyRevenue}
                onCheckedChange={setShowOnlyMyRevenue}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <RevenueStatsBar
        stats={stats}
        loading={loading}
        onBreakdownClick={() => setShowBreakdown(true)}
        periodLabel={(() => {
          if (hasActiveFilters) {
            return "Summary for filters applied"
          }
          switch (activeTab) {
            case "this-week":
              return "Revenue for this week"
            case "last-week":
              return "Revenue for last week"
            case "this-month":
              return "Revenue for this month"
            default:
              return "All-time revenue"
          }
        })()}
      />

      {/* Tabs or Clear Filters Button */}
      {hasActiveFilters ? (
        <>
          <ActiveFilters
            filterConfigs={filterConfigs}
            filters={filters}
            onFilterChange={setFilters}
            onClearAll={clearFilters}
          />
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2">Loading revenue records...</span>
            </div>
          )}
          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Error loading revenue records</AlertTitle>
              <AlertDescription>
                <p>
                  Error:{" "}
                  {(error as { message?: string })?.message ||
                    "An error occurred"}
                </p>
              </AlertDescription>
            </Alert>
          )}
          {/* Filtered Revenue Records List */}
          {!loading && !error && (
            <div className="mt-3">
              {dateParams.startDate && dateParams.endDate && (
                <p className="text-sm text-muted-foreground mb-4">
                  Showing revenue from {formatDate(dateParams.startDate)} to{" "}
                  {formatDate(dateParams.endDate)}
                </p>
              )}
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
            </div>
          )}
        </>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DateTab)}
        >
          <TabsList>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="last-week">Last Week</TabsTrigger>
            <TabsTrigger value="this-month">This Month</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2">Loading revenue records...</span>
            </div>
          )}
          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Error loading revenue records</AlertTitle>
              <AlertDescription>
                <p>
                  Error:{" "}
                  {(error as { message?: string })?.message ||
                    "An error occurred"}
                </p>
              </AlertDescription>
            </Alert>
          )}
          {!loading && !error && (
            <>
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
                    Showing revenue records for{" "}
                    {formatDate(dateParams.startDate)} to{" "}
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
            </>
          )}
        </Tabs>
      )}

      {/* Filters Dialog */}
      <FilterDialog
        open={showFilters}
        onOpenChange={setShowFilters}
        title="Filter Revenue Records"
        description="Filter revenue records by driver, vehicle, source, and date range"
        filterConfigs={filterConfigs}
        appliedFilters={filters}
        onChange={setFilters}
      />

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

      {/* Floating Action Buttons - Only on small screens */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 md:hidden">
        <FilterButton
          onClick={() => setShowFilters(true)}
          filterConfigs={filterConfigs}
          filters={filters}
          variant="outline"
          size="lg"
          className="shadow-2xl"
          style={{
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(59, 130, 246, 0.3)",
          }}
        />
        <Button
          onClick={() => setShowAddRevenue(true)}
          className="shadow-2xl"
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
    </div>
  )
}
