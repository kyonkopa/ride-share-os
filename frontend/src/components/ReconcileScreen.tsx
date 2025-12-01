import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDownIcon } from "lucide-react"
import { useDrivers } from "@/features/drivers/useDrivers"
import { useGroupedExpenses } from "@/features/expenses/useGroupedExpenses"
import { useGroupedRevenueRecords } from "@/features/revenue-records/useGroupedRevenueRecords"
import { useUpdateRevenueRecordMutation } from "@/features/revenue-records/useUpdateRevenueRecordMutation"
import { Spinner } from "./ui/spinner"
import { Switch } from "./ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon, Calculator } from "lucide-react"
import type { RevenueRecord } from "@/codegen/graphql"
import { useNotification } from "@/hooks/useNotification"

interface ReconcileFormValues {
  startDate: Date | null
  endDate: Date | null
  driverId: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

export function ReconcileScreen() {
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { drivers, loading: driversLoading } = useDrivers()

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ReconcileFormValues>({
    defaultValues: {
      startDate: null,
      endDate: null,
      driverId: "",
    },
    mode: "onChange",
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const driverId = watch("driverId")

  // Format dates for API calls
  const startDateString = startDate ? startDate.toISOString().split("T")[0] : ""
  const endDateString = endDate ? endDate.toISOString().split("T")[0] : ""

  // Only fetch data when form is submitted and dates are provided
  const shouldFetch = submitted && startDateString && endDateString

  const {
    stats: expenseStats,
    loading: expensesLoading,
    error: expensesError,
  } = useGroupedExpenses({
    startDate: startDateString,
    endDate: endDateString,
    driverId: driverId || undefined,
    pagination: { page: 1, perPage: 1 },
    skip: !shouldFetch,
  })

  const {
    groups: revenueGroups,
    stats: revenueStats,
    loading: revenueLoading,
    error: revenueError,
  } = useGroupedRevenueRecords({
    startDate: startDateString,
    endDate: endDateString,
    driverId: driverId || undefined,
    pagination: { page: 1, perPage: 1000 }, // Get all records for the list
    skip: !shouldFetch,
  })

  // Extract all revenue records from groups
  const revenueRecords = useMemo(() => {
    if (!revenueGroups || revenueGroups.length === 0) return []
    const records: RevenueRecord[] = []
    revenueGroups.forEach((group) => {
      if (group.revenueRecords) {
        records.push(...(group.revenueRecords as RevenueRecord[]))
      }
    })
    return records
  }, [revenueGroups])

  const { addSuccess } = useNotification()

  // Mutation for updating reconciled status
  const { handleUpdateRevenueRecord, loading: updateLoading } =
    useUpdateRevenueRecordMutation({
      onSuccess: () => {
        addSuccess("Record updated successfully")
      },
    })

  const onSubmit = () => {
    setSubmitted(true)
  }

  const loading = expensesLoading || revenueLoading
  const hasError = expensesError || revenueError

  const totalExpenses = expenseStats?.totalAmount || 0
  const totalRevenue = revenueStats?.totalRevenue || 0
  const balance = totalRevenue - totalExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reconcile</h1>
        <p className="text-muted-foreground text-sm">
          View revenue and expenses summary with balance calculation
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>
            Select date range and optionally filter by driver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date-picker">Start Date *</Label>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: "Start date is required" }}
                  render={({ field }) => (
                    <Popover
                      open={startDatePickerOpen}
                      onOpenChange={setStartDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="start-date-picker"
                          className="w-full justify-between font-normal"
                          type="button"
                        >
                          {field.value
                            ? field.value.toLocaleDateString()
                            : "Select start date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          captionLayout="dropdown"
                          disabled={(date) => date > new Date()}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                            }
                            setStartDatePickerOpen(false)
                          }}
                          timeZone="UTC"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end-date-picker">End Date *</Label>
                <Controller
                  name="endDate"
                  control={control}
                  rules={{
                    required: "End date is required",
                    validate: (value) => {
                      const start = watch("startDate")
                      if (start && value) {
                        // Compare dates ignoring time
                        const startDateOnly = new Date(
                          start.getFullYear(),
                          start.getMonth(),
                          start.getDate()
                        )
                        const endDateOnly = new Date(
                          value.getFullYear(),
                          value.getMonth(),
                          value.getDate()
                        )
                        if (endDateOnly < startDateOnly) {
                          return "End date must be after or equal to start date"
                        }
                      }
                      return true
                    },
                  }}
                  render={({ field }) => (
                    <Popover
                      open={endDatePickerOpen}
                      onOpenChange={setEndDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="end-date-picker"
                          className="w-full justify-between font-normal"
                          type="button"
                        >
                          {field.value
                            ? field.value.toLocaleDateString()
                            : "Select end date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          captionLayout="dropdown"
                          disabled={(date) => date > new Date()}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                            }
                            setEndDatePickerOpen(false)
                          }}
                          timeZone="UTC"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Driver Select */}
            <div className="space-y-2">
              <Label htmlFor="driverId">Driver (Optional)</Label>
              <Controller
                name="driverId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={driversLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 && !driversLoading && (
                        <SelectItem value="" disabled>
                          No drivers available
                        </SelectItem>
                      )}
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.globalId}>
                          {driver.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {submitted && (
        <>
          {hasError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {expensesError?.message ||
                  revenueError?.message ||
                  "An error occurred while fetching data"}
              </AlertDescription>
            </Alert>
          )}

          {!hasError && (
            <>
              <div className="grid gap-4">
                {/* Total Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gross Revenue</CardTitle>
                    <CardDescription>
                      Total revenue for selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {loading ? (
                        <Spinner className="h-8 w-8" />
                      ) : (
                        formatCurrency(totalRevenue)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Expenses</CardTitle>
                    <CardDescription>
                      Total expenses for selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {loading ? (
                        <Spinner className="h-8 w-8" />
                      ) : (
                        formatCurrency(totalExpenses)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Balance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Balance
                    </CardTitle>
                    <CardDescription>Revenue minus expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {loading ? (
                        <Spinner className="h-8 w-8" />
                      ) : (
                        formatCurrency(balance)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Records List */}
              {revenueRecords.length > 0 && (
                <Card className="p-0 shadow-none border-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-lg">Revenue Records</CardTitle>
                    <CardDescription>
                      Mark records as reconciled using the toggle switch
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-4">
                      {revenueRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {formatCurrency(record.totalRevenue)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                • {record.driver?.fullName || "Unknown Driver"}
                              </span>
                              {record.shiftAssignment?.vehicle && (
                                <span className="text-sm text-muted-foreground">
                                  • {record.shiftAssignment.vehicle.displayName}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(record.createdAt).toLocaleDateString()}{" "}
                              • {record.source}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Label
                              htmlFor={`reconciled-${record.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {record.reconciled
                                ? "Reconciled"
                                : "Not Reconciled"}
                            </Label>
                            <Switch
                              id={`reconciled-${record.id}`}
                              checked={record.reconciled}
                              disabled={updateLoading}
                              onCheckedChange={(checked) => {
                                handleUpdateRevenueRecord(
                                  record.globalId,
                                  checked
                                )
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!loading && revenueRecords.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No revenue records found for the selected filters
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
