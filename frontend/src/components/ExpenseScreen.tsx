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

type DateExpenseGroup = {
  date: string
  totalAmount: number
  expenseCount: number
  expenses: Expense[]
}

type VehicleExpenseGroup = {
  vehicleId: string
  vehicleName: string
  totalAmount: number
  expenseCount: number
  dateGroups: DateExpenseGroup[]
}

interface DateExpenseGroupCardProps {
  dateGroup: DateExpenseGroup
}

function DateExpenseGroupCard({ dateGroup }: DateExpenseGroupCardProps) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{formatDate(dateGroup.date)}</p>
          <p className="text-sm text-muted-foreground">
            {dateGroup.expenseCount}{" "}
            {dateGroup.expenseCount === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <p className="text-md font-bold text-primary">
          {formatCurrency(dateGroup.totalAmount)}
        </p>
      </div>
      {dateGroup.expenses.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="breakdown" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              <span className="truncate underline">View Expense Breakdown</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {dateGroup.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {expense.category}
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
    </div>
  )
}

interface VehicleExpenseGroupCardProps {
  vehicleGroup: VehicleExpenseGroup
}

function VehicleExpenseGroupCard({
  vehicleGroup,
}: VehicleExpenseGroupCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{formatCurrency(vehicleGroup.totalAmount)}</CardTitle>
          <CardDescription className="mt-1">
            {vehicleGroup.vehicleName}
          </CardDescription>
        </div>
        <Badge variant="outline">
          {vehicleGroup.expenseCount}{" "}
          {vehicleGroup.expenseCount === 1 ? "expense" : "expenses"}
        </Badge>
      </CardHeader>
      <CardContent>
        {vehicleGroup.dateGroups.length > 0 && (
          <div className="space-y-3">
            {vehicleGroup.dateGroups.map((dateGroup) => (
              <DateExpenseGroupCard
                key={dateGroup.date}
                dateGroup={dateGroup}
              />
            ))}
          </div>
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
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset to page 1 when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "this-week" | "all-time")
    setCurrentPage(1)
    setItemsPerPage(10)
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

  // Merge expenses by vehicle ID, then by date
  const mergedExpenses = useMemo(() => {
    const vehicleMap = new Map<string, VehicleExpenseGroup>()

    expenses.forEach((expense) => {
      // Handle expenses without a vehicle - group them separately
      const vehicleId = expense.vehicle?.id || "no-vehicle"
      const vehicleName = expense.vehicle?.displayName || "No Vehicle"
      const expenseDate = expense.date

      let vehicleGroup = vehicleMap.get(vehicleId)

      if (!vehicleGroup) {
        // Create new vehicle group
        vehicleGroup = {
          vehicleId,
          vehicleName,
          totalAmount: 0,
          expenseCount: 0,
          dateGroups: [],
        }
        vehicleMap.set(vehicleId, vehicleGroup)
      }

      // Find or create date group within vehicle
      let dateGroup = vehicleGroup.dateGroups.find(
        (dg) => dg.date === expenseDate
      )

      if (!dateGroup) {
        // Create new date group
        dateGroup = {
          date: expenseDate,
          totalAmount: 0,
          expenseCount: 0,
          expenses: [],
        }
        vehicleGroup.dateGroups.push(dateGroup)
      }

      // Update totals
      dateGroup.totalAmount += expense.amount
      dateGroup.expenseCount += 1
      dateGroup.expenses.push(expense)

      // Update vehicle totals
      vehicleGroup.totalAmount += expense.amount
      vehicleGroup.expenseCount += 1
    })

    // Sort date groups within each vehicle by date descending
    vehicleMap.forEach((vehicleGroup) => {
      vehicleGroup.dateGroups.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    })

    // Sort vehicles by total amount descending, then by vehicle name
    return Array.from(vehicleMap.values()).sort((a, b) => {
      if (b.totalAmount !== a.totalAmount) {
        return b.totalAmount - a.totalAmount
      }
      return a.vehicleName.localeCompare(b.vehicleName)
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
      <div>
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your expenses
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAddExpense(true)}>
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
              {mergedExpenses.map((vehicleGroup) => (
                <VehicleExpenseGroupCard
                  key={vehicleGroup.vehicleId}
                  vehicleGroup={vehicleGroup}
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
              {mergedExpenses.map((vehicleGroup) => (
                <VehicleExpenseGroupCard
                  key={vehicleGroup.vehicleId}
                  vehicleGroup={vehicleGroup}
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
      />
    </div>
  )
}
