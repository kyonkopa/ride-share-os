import { useState, useMemo, useEffect } from "react"
import { DateTime } from "luxon"
import { useExpenses } from "@/features/expenses/useExpenses"
import { useExpenseStats } from "@/features/expenses/useExpenseStats"
import { useVehicles } from "@/features/clock-in/useVehicles"
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
import type { Expense } from "@/codegen/graphql"
import { Paginator } from "./pagination/paginator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
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

type VehicleDateExpenseGroup = {
  vehicleId: string
  vehicleName: string
  date: string
  totalAmount: number
  expenseCount: number
  expenses: Expense[]
}

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

type ExpenseStats = {
  totalAmount: number
  count: number
  categoryTotals: Record<string, number>
}

interface ExpenseStatsBarProps {
  stats: ExpenseStats | null | undefined
  loading: boolean
  periodLabel: string
}

function ExpenseStatsBar({
  stats,
  loading,
  periodLabel,
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
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState<"this-week" | "all-time">(
    "this-week"
  )
  const [showAddExpense, setShowAddExpense] = useState(false)
  const { vehicles } = useVehicles()
  const [currentPage, setCurrentPage] = useState(1)

  // Determine items per page based on active tab
  const itemsPerPage = useMemo(() => {
    return activeTab === "this-week" ? 100 : 10
  }, [activeTab])

  // Reset to page 1 when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "this-week" | "all-time")
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

  const { expenses, loading, error, pagination } = useExpenses({
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    pagination: {
      page: currentPage,
      perPage: itemsPerPage,
    },
  })

  const { stats, loading: statsLoading } = useExpenseStats(
    dateParams.startDate,
    dateParams.endDate
  )

  // Merge expenses by vehicle ID and date together
  const mergedExpenses = useMemo(() => {
    const groupMap = new Map<string, VehicleDateExpenseGroup>()

    expenses.forEach((expense) => {
      // Handle expenses without a vehicle - group them separately
      const vehicleId = expense.vehicle?.id || "no-vehicle"
      const vehicleName = expense.vehicle?.displayName || "No Vehicle"
      const expenseDate = expense.date

      // Create a unique key for vehicle + date combination
      const groupKey = `${vehicleId}-${expenseDate}`

      let group = groupMap.get(groupKey)

      if (!group) {
        // Create new vehicle+date group
        group = {
          vehicleId,
          vehicleName,
          date: expenseDate,
          totalAmount: 0,
          expenseCount: 0,
          expenses: [],
        }
        groupMap.set(groupKey, group)
      }

      // Update totals and add expense
      group.totalAmount += expense.amount
      group.expenseCount += 1
      group.expenses.push(expense)
    })

    // Sort groups by date descending, then by vehicle name, then by total amount
    return Array.from(groupMap.values()).sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff

      const nameDiff = a.vehicleName.localeCompare(b.vehicleName)
      if (nameDiff !== 0) return nameDiff

      return b.totalAmount - a.totalAmount
    })
  }, [expenses])

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
      {activeTab === "this-week" && (
        <ExpenseStatsBar
          stats={stats}
          loading={statsLoading}
          periodLabel="Expenses for this week"
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
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
          {mergedExpenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedExpenses.map((group) => (
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
          {mergedExpenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedExpenses.map((group) => (
                <VehicleDateExpenseGroupCard
                  key={`${group.vehicleId}-${group.date}`}
                  group={group}
                />
              ))}
              {pagination &&
                pagination.pageCount != null &&
                pagination.pageCount > 1 && (
                  <Paginator
                    currentPage={pagination.currentPage || 1}
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
        expensesQueryVariables={{
          startDate: dateParams.startDate,
          endDate: dateParams.endDate,
          pagination: {
            page: currentPage,
            perPage: itemsPerPage,
          },
        }}
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
