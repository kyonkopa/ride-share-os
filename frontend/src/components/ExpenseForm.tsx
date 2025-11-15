import { useState } from "react"
import { Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "./ui/spinner"
import type {
  VehicleFragmentFragment,
  ExpensesQueryQueryVariables,
} from "@/codegen/graphql"
import {
  ExpenseCategoryEnum,
  EXPENSE_CATEGORIES,
} from "@/features/expenses/expenseCategoryEnum"
import { useExpenseForm } from "@/features/expenses/useExpenseForm"
import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { InlineErrorAlert } from "./ui/inline-error-alert"

interface ExpenseFormProps {
  vehicles: VehicleFragmentFragment[]
  onOpenChange: (open: boolean) => void
  open: boolean
  onSuccess?: () => void
  expensesQueryVariables?: ExpensesQueryQueryVariables
}

export function ExpenseForm({
  vehicles,
  open,
  onOpenChange,
  onSuccess,
  expensesQueryVariables,
}: ExpenseFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    onSubmitForm,
    loading,
    mutationErrors,
  } = useExpenseForm({
    open,
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
    expensesQueryVariables,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Expense
          </DialogTitle>
          <DialogDescription>
            Record a new expense with the required information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter expense amount"
              {...register("amount", {
                required: "Amount is required",
                min: {
                  value: 0.01,
                  message: "Amount must be greater than 0",
                },
                valueAsNumber: true,
              })}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        <span className="capitalize">
                          {category.replace(/_/g, " ")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Description - shown when Other is selected */}
          {watch("category") === ExpenseCategoryEnum.Other && (
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                type="text"
                placeholder="Enter expense description"
                {...register("description", {
                  required: "Description is required when category is 'Other'",
                })}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date-picker">Date *</Label>
            <Controller
              name="date"
              control={control}
              rules={{ required: "Date is required" }}
              render={({ field }) => (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker"
                      className="w-full justify-between font-normal"
                      type="button"
                    >
                      {field.value
                        ? new Date(field.value).toLocaleDateString()
                        : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      captionLayout="dropdown"
                      disabled={(date) => date > new Date()}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date)
                        }
                        setDatePickerOpen(false)
                      }}
                      timeZone="UTC"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-2">
            <Controller
              name="category"
              control={control}
              render={({ field: categoryField }) => (
                <Label htmlFor="vehicle">
                  Vehicle{" "}
                  {categoryField.value === ExpenseCategoryEnum.Charging && "*"}
                </Label>
              )}
            />
            <Controller
              name="vehicleId"
              control={control}
              render={({ field }) => {
                const category = watch("category")
                return (
                  <>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) =>
                        field.onChange(value || undefined)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            category === ExpenseCategoryEnum.Charging
                              ? "Select a vehicle *"
                              : "Select a vehicle (optional)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} (
                            {vehicle.licensePlate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.vehicleId && (
                      <p className="text-sm text-red-600">
                        {errors.vehicleId.message}
                      </p>
                    )}
                  </>
                )
              }}
            />
          </div>

          {/* Mutation errors */}
          {mutationErrors &&
            mutationErrors.length > 0 &&
            mutationErrors.map((error) => (
              <InlineErrorAlert key={error.message} message={error.message} />
            ))}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting}
          >
            {(loading || isSubmitting) && <Spinner className="mr-2" />}
            {loading || isSubmitting ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
