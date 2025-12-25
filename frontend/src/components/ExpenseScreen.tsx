import { useState, useMemo, useCallback } from "react"
import { useGroupedExpenses } from "@/features/expenses/useGroupedExpenses"
import { PullToRefresh } from "./PullToRefresh"
import { useDateParams, type DateTab } from "@/hooks/useDateParams"
import { ExpenseBreakdownView } from "@/features/expenses/ExpenseBreakdownView"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { EXPENSE_CATEGORIES } from "@/features/expenses/expenseCategoryEnum"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon, Receipt, Plus } from "lucide-react"
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
import { Badge } from "./ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Button } from "./ui/button"
import { ExpenseForm } from "./ExpenseForm"
import { ExpenseStatsBar } from "./ExpenseStatsBar"
import {
  FilterDialog,
  ActiveFilters,
  FilterButton,
  useFilters,
  type FilterConfig,
  DateFilterValue,
} from "./filters"
import type { GroupedExpensesQueryQuery } from "@/codegen/graphql"
import { Paginator } from "./pagination/paginator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { formatDate } from "@/utils/dateUtils"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

type VehicleDateExpenseGroup = NonNullable<
  GroupedExpensesQueryQuery["groupedExpenses"]
>["items"][number]

interface VehicleDateExpenseGroupCardProps {
  group: VehicleDateExpenseGroup
}

function VehicleDateExpenseGroupCard({
  group,
}: VehicleDateExpenseGroupCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{formatCurrency(group.totalAmount)}</CardTitle>
          <CardDescription className="mt-1">
            {group.vehicleName} • {formatDate(group.date)}
          </CardDescription>
        </div>
        <Badge variant="outline">
          {group.expenseCount}{" "}
          {group.expenseCount === 1 ? "expense" : "expenses"}
        </Badge>
      </CardHeader>
      <CardContent>
        {group.expenses.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="breakdown" className="border-none">
              <AccordionTrigger className="py-2 text-sm">
                <span className="truncate underline">
                  View Expense Breakdown
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {group.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {expense.category.replace(/_/g, " ")}
                          </span>
                          {expense.receiptKey && (
                            <Badge variant="outline" className="text-xs">
                              Receipt
                            </Badge>
                          )}
                        </div>
                        {expense.category === "other" &&
                          expense.description && (
                            <div className="text-sm text-muted-foreground">
                              {expense.description}
                            </div>
                          )}
                        <div className="text-xs text-muted-foreground">
                          {expense.user && (
                            <span>
                              Added by {expense.user.firstName}{" "}
                              {expense.user.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

function ExpensesEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Receipt />
        </EmptyMedia>
        <EmptyTitle>No expenses found</EmptyTitle>
        <EmptyDescription>
          Expenses will appear here once they are created.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState<DateTab>("this-week")
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { vehicles } = useVehicles()
  const [currentPage, setCurrentPage] = useState(1)

  // Define filter configuration
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
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
        key: "category",
        label: "Category",
        options: EXPENSE_CATEGORIES.map((category) => ({
          value: category,
          label: category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
        placeholder: "All categories",
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
      },
    ],
    [vehicles]
  )

  const { filters, hasActiveFilters, setFilters, clearFilters } = useFilters({
    filterConfigs,
    onFiltersChange: () => {
      setCurrentPage(1) // Reset to first page when filters change
    },
  })

  const itemsPerPage = useMemo(() => {
    return 10
  }, [])

  // Reset to page 1 when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as DateTab)
    setCurrentPage(1)
  }

  // Calculate date parameters based on active tab and filters
  const dateParams = useDateParams({
    activeTab,
    filters,
    hasActiveFilters,
  })

  const {
    groups,
    loading: groupedLoading,
    error: groupedError,
    pagination: groupedPagination,
    stats,
    refetch: refetchExpenses,
  } = useGroupedExpenses({
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    vehicleId: filters.vehicleId as string | undefined,
    category: filters.category as string | undefined,
    pagination: {
      page: currentPage,
      perPage: itemsPerPage,
    },
  })

  const handleRefresh = useCallback(async () => {
    await refetchExpenses()
  }, [refetchExpenses])

  const loading = groupedLoading
  const error = groupedError
  const pagination = groupedPagination

  if (showBreakdown) {
    return (
      <ExpenseBreakdownView
        stats={stats}
        startDate={dateParams.startDate}
        endDate={dateParams.endDate}
        onBack={() => setShowBreakdown(false)}
      />
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your expenses
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
              onClick={() => setShowAddExpense(true)}
              className="hidden md:flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <ExpenseStatsBar
          stats={stats}
          loading={loading}
          periodLabel={(() => {
            if (hasActiveFilters) {
              return "Summary for filters applied"
            }
            switch (activeTab) {
              case "this-week":
                return "Expenses for this week"
              case "this-month":
                return "Expenses for this month"
              case "last-month":
                return "Expenses for last month"
              default:
                return "All expenses"
            }
          })()}
          onBreakdownClick={() => setShowBreakdown(true)}
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
                <span className="ml-2">Loading expenses...</span>
              </div>
            )}
            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Error loading expenses</AlertTitle>
                <AlertDescription>
                  <p>Error: {error.message}</p>
                </AlertDescription>
              </Alert>
            )}
            {/* Filtered Expenses List */}
            {!loading && !error && (
              <div className="mt-3">
                {dateParams.startDate && dateParams.endDate && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing expenses for {formatDate(dateParams.startDate)} to{" "}
                    {formatDate(dateParams.endDate)}
                  </p>
                )}
                {groups.length === 0 ? (
                  <ExpensesEmpty />
                ) : (
                  <div className="flex flex-col gap-4">
                    {groups.map((group) => (
                      <VehicleDateExpenseGroupCard
                        key={`${group?.vehicleId}-${group?.date}`}
                        group={group as VehicleDateExpenseGroup}
                      />
                    ))}
                    {pagination &&
                      pagination.pageCount != null &&
                      pagination.pageCount > 1 && (
                        <Paginator
                          currentPage={currentPage}
                          totalPages={pagination.pageCount}
                          onPageChange={(page) => {
                            setCurrentPage(page)
                          }}
                        />
                      )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="this-week">This Week</TabsTrigger>
              <TabsTrigger value="this-month">This Month</TabsTrigger>
              <TabsTrigger value="last-month">Last Month</TabsTrigger>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
            </TabsList>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
                <span className="ml-2">Loading expenses...</span>
              </div>
            )}
            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Error loading expenses</AlertTitle>
                <AlertDescription>
                  <p>Error: {error.message}</p>
                </AlertDescription>
              </Alert>
            )}
            {!loading && !error && (
              <>
                <TabsContent value="this-week" className="mt-3">
                  {dateParams.startDate && dateParams.endDate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing expenses for {formatDate(dateParams.startDate)} to{" "}
                      {formatDate(dateParams.endDate)}
                    </p>
                  )}
                  {/* Expenses List */}
                  {groups.length === 0 ? (
                    <ExpensesEmpty />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {groups.map((group) => (
                        <VehicleDateExpenseGroupCard
                          key={`${group?.vehicleId}-${group?.date}`}
                          group={group as VehicleDateExpenseGroup}
                        />
                      ))}
                      {pagination &&
                        pagination.pageCount != null &&
                        pagination.pageCount > 1 && (
                          <Paginator
                            currentPage={currentPage}
                            totalPages={pagination.pageCount}
                            onPageChange={(page) => {
                              setCurrentPage(page)
                            }}
                          />
                        )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="this-month" className="mt-3">
                  {dateParams.startDate && dateParams.endDate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing expenses for {formatDate(dateParams.startDate)} to{" "}
                      {formatDate(dateParams.endDate)}
                    </p>
                  )}
                  {/* Expenses List */}
                  {groups.length === 0 ? (
                    <ExpensesEmpty />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {groups.map((group) => (
                        <VehicleDateExpenseGroupCard
                          key={`${group?.vehicleId}-${group?.date}`}
                          group={group as VehicleDateExpenseGroup}
                        />
                      ))}
                      {pagination &&
                        pagination.pageCount != null &&
                        pagination.pageCount > 1 && (
                          <Paginator
                            currentPage={currentPage}
                            totalPages={pagination.pageCount}
                            onPageChange={(page) => {
                              setCurrentPage(page)
                            }}
                          />
                        )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="last-month" className="mt-3">
                  {dateParams.startDate && dateParams.endDate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing expenses for {formatDate(dateParams.startDate)} to{" "}
                      {formatDate(dateParams.endDate)}
                    </p>
                  )}
                  {/* Expenses List */}
                  {groups.length === 0 ? (
                    <ExpensesEmpty />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {groups.map((group) => (
                        <VehicleDateExpenseGroupCard
                          key={`${group?.vehicleId}-${group?.date}`}
                          group={group as VehicleDateExpenseGroup}
                        />
                      ))}
                      {pagination &&
                        pagination.pageCount != null &&
                        pagination.pageCount > 1 && (
                          <Paginator
                            currentPage={currentPage}
                            totalPages={pagination.pageCount}
                            onPageChange={(page) => {
                              setCurrentPage(page)
                            }}
                          />
                        )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all-time" className="mt-3">
                  {dateParams.startDate && dateParams.endDate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing expenses for {formatDate(dateParams.startDate)} to{" "}
                      {formatDate(dateParams.endDate)}
                    </p>
                  )}
                  {/* Expenses List */}
                  {groups.length === 0 ? (
                    <ExpensesEmpty />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {groups.map((group) => (
                        <VehicleDateExpenseGroupCard
                          key={`${group?.vehicleId}-${group?.date}`}
                          group={group as VehicleDateExpenseGroup}
                        />
                      ))}
                      {pagination &&
                        pagination.pageCount != null &&
                        pagination.pageCount > 1 && (
                          <Paginator
                            currentPage={currentPage}
                            totalPages={pagination.pageCount}
                            onPageChange={(page) => {
                              setCurrentPage(page)
                            }}
                          />
                        )}
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
          title="Filter Expenses"
          description="Filter expenses by vehicle, category, and date range"
          filterConfigs={filterConfigs}
          appliedFilters={filters}
          onChange={setFilters}
        />

        {/* Add Expense Modal */}
        <ExpenseForm
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          vehicles={vehicles}
          groupedExpensesQueryVariables={
            activeTab === "all-time"
              ? undefined
              : {
                  startDate: dateParams.startDate,
                  endDate: dateParams.endDate,
                  pagination: {
                    page: currentPage,
                    perPage: itemsPerPage,
                  },
                }
          }
          expensesQueryVariables={
            activeTab === "all-time"
              ? {
                  startDate: dateParams.startDate,
                  endDate: dateParams.endDate,
                  pagination: {
                    page: currentPage,
                    perPage: itemsPerPage,
                  },
                }
              : undefined
          }
        />

        {/* Floating Action Buttons - Only on small screens */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-row gap-3 md:hidden">
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
            onClick={() => setShowAddExpense(true)}
            className="shadow-2xl"
            style={{
              boxShadow:
                "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(59, 130, 246, 0.3)",
            }}
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
    </PullToRefresh>
  )
}
