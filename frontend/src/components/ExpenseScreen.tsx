import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { useGroupedExpenses } from "@/features/expenses/useGroupedExpenses"
import { useExpenses } from "@/features/expenses/useExpenses"
import { ExpenseBreakdownView } from "@/features/expenses/ExpenseBreakdownView"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon, Receipt, Plus, BarChart3 } from "lucide-react"
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
import type { GroupedExpensesQueryQuery, Expense } from "@/codegen/graphql"
import { Paginator } from "./pagination/paginator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import NumberFlow from "@number-flow/react"
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

interface ExpenseCardProps {
  expense: Expense
}

function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <Card className="gap-2">
      <CardContent>
        <div className="flex items-center justify-between">
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
            <CardDescription>
              {expense.vehicle?.displayName || "No Vehicle"} •{" "}
              {formatDate(expense.date)}
            </CardDescription>
            {expense.category === "other" && expense.description && (
              <div className="text-sm text-muted-foreground">
                {expense.description}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {expense.user && (
                <span>
                  Added by {expense.user.firstName} {expense.user.lastName}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">
              {formatCurrency(expense.amount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ExpenseStats = {
  totalAmount: number
  categoryTotals: Record<string, number>
}

interface ExpenseStatsBarProps {
  stats: ExpenseStats | null | undefined
  loading: boolean
  periodLabel: string
  onBreakdownClick: () => void
}

function ExpenseStatsBar({
  stats,
  loading,
  periodLabel,
  onBreakdownClick,
}: ExpenseStatsBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    if (stats) {
      setAnimatedValue(0)

      // After 100ms, set to the actual value
      const timer = setTimeout(() => {
        setAnimatedValue(stats.totalAmount)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [stats])

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

export function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState<
    "this-week" | "this-month" | "last-month" | "all-time"
  >("this-week")
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { vehicles } = useVehicles()
  const [currentPage, setCurrentPage] = useState(1)

  // Determine items per page based on active tab
  const itemsPerPage = useMemo(() => {
    return activeTab === "all-time" ? 10 : 100
  }, [activeTab])

  // Reset to page 1 when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(
      value as "this-week" | "this-month" | "last-month" | "all-time"
    )
    setCurrentPage(1)
  }

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

  // Calculate last month start and end dates
  const lastMonthDates = useMemo(() => {
    const now = DateTime.now()
    const lastMonthStart = now.minus({ months: 1 }).startOf("month")
    const lastMonthEnd = now.minus({ months: 1 }).endOf("month")
    return {
      start: lastMonthStart.toISODate(),
      end: lastMonthEnd.toISODate(),
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
    if (activeTab === "this-month") {
      return {
        startDate: monthDates.start,
        endDate: monthDates.end,
      }
    }
    if (activeTab === "last-month") {
      return {
        startDate: lastMonthDates.start,
        endDate: lastMonthDates.end,
      }
    }
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }, [activeTab, weekDates, monthDates, lastMonthDates])

  // Use grouped expenses for this-week and this-month tabs
  const {
    groups,
    loading: groupedLoading,
    error: groupedError,
    pagination: groupedPagination,
    stats,
  } = useGroupedExpenses({
    startDate: dateParams.startDate!,
    endDate: dateParams.endDate!,
    pagination: {
      page: currentPage,
      perPage: itemsPerPage,
    },
    skip:
      activeTab === "all-time" || !dateParams.startDate || !dateParams.endDate,
  })

  // Use regular expenses query for all-time tab
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    pagination: expensesPagination,
  } = useExpenses({
    pagination: {
      page: currentPage,
      perPage: itemsPerPage,
    },
    skip: activeTab !== "all-time",
  })

  // Determine which loading/error/pagination to use based on active tab
  const loading = activeTab === "all-time" ? expensesLoading : groupedLoading
  const error = activeTab === "all-time" ? expensesError : groupedError
  const pagination =
    activeTab === "all-time" ? expensesPagination : groupedPagination

  // Show breakdown view if requested
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
        <AlertTitle>Error loading expenses</AlertTitle>
        <AlertDescription>
          <p>Error: {error.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your expenses
          </p>
        </div>
        <Button
          onClick={() => setShowAddExpense(true)}
          className="hidden md:flex"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats Bar */}
      {(activeTab === "this-week" ||
        activeTab === "this-month" ||
        activeTab === "last-month") && (
        <ExpenseStatsBar
          stats={stats}
          loading={loading}
          periodLabel={
            activeTab === "this-week"
              ? "Expenses for this week"
              : activeTab === "this-month"
                ? "Expenses for this month"
                : "Expenses for last month"
          }
          onBreakdownClick={() => setShowBreakdown(true)}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="this-month">This Month</TabsTrigger>
          <TabsTrigger value="last-month">Last Month</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>
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
                  key={`${group.vehicleId}-${group.date}`}
                  group={group}
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
                  key={`${group.vehicleId}-${group.date}`}
                  group={group}
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
                  key={`${group.vehicleId}-${group.date}`}
                  group={group}
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
          <p className="text-sm text-muted-foreground mb-4">
            Showing all expenses
          </p>
          {/* Expenses List */}
          {expenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {expenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
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
      </Tabs>

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
                pagination: {
                  page: currentPage,
                  perPage: itemsPerPage,
                },
              }
            : undefined
        }
      />

      {/* Floating Add Expense Button - Only on small screens */}
      <Button
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-6 right-6 shadow-2xl z-50 md:hidden"
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
  )
}
