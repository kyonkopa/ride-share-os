import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { DateTime } from "luxon"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Spinner } from "./ui/spinner"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ChevronDownIcon, AlertCircleIcon } from "lucide-react"
import { formatDate } from "@/utils/dateUtils"
import { Alert, AlertDescription } from "./ui/alert"
import type { Error } from "@/codegen/graphql"

interface PayrollPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverName: string
  amountDue: number
  periodStartDate: string
  periodEndDate: string
  driverId: string
  loading: boolean
  mutationErrors?: Error[]
  onSubmit: (data: {
    driverId: string
    amountPaid: number
    periodStartDate: string
    periodEndDate: string
    notes?: string
    paidAt: string
  }) => Promise<void>
}

interface PayrollPaymentFormValues {
  amountPaid: number
  notes: string
  paidAtDate: Date | undefined
}

export function PayrollPaymentDialog({
  open,
  onOpenChange,
  driverName,
  amountDue,
  periodStartDate,
  periodEndDate,
  driverId,
  loading,
  mutationErrors = [],
  onSubmit,
}: PayrollPaymentDialogProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PayrollPaymentFormValues>({
    defaultValues: {
      amountPaid: amountDue,
      notes: "",
      paidAtDate: undefined,
    },
    mode: "onChange",
  })

  // Update form amount when amountDue changes
  useEffect(() => {
    reset({
      amountPaid: amountDue,
      notes: "",
      paidAtDate: undefined,
    })
  }, [amountDue, reset])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        amountPaid: amountDue,
        notes: "",
        paidAtDate: undefined,
      })
      setDatePickerOpen(false)
    }
  }, [open, amountDue, reset])

  const handleFormSubmit = async (data: PayrollPaymentFormValues) => {
    if (!data.paidAtDate) {
      return // This shouldn't happen due to validation, but TypeScript needs it
    }

    const dateTime = DateTime.fromJSDate(data.paidAtDate).startOf("day").toUTC()
    const paidAtISO = dateTime.toISO()

    if (!paidAtISO) {
      return // This shouldn't happen, but TypeScript needs it
    }

    await onSubmit({
      driverId,
      amountPaid: data.amountPaid,
      periodStartDate,
      periodEndDate,
      notes: data.notes.trim() || undefined,
      paidAt: paidAtISO,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Review and confirm payment details for {driverName}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-4"
        >
          {/* Amount Paid */}
          <div className="space-y-2">
            <Label htmlFor="amount-paid">Amount Paid (GHS) *</Label>
            <Input
              id="amount-paid"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              {...register("amountPaid", {
                required: "Amount is required",
                min: {
                  value: 0.01,
                  message: "Amount must be greater than 0",
                },
                valueAsNumber: true,
              })}
              className={errors.amountPaid ? "border-red-500" : ""}
            />
            {errors.amountPaid && (
              <p className="text-sm text-red-600">
                {errors.amountPaid.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Add any notes about this payment"
              rows={3}
            />
          </div>

          {/* Paid At */}
          <div className="space-y-2">
            <Label htmlFor="paid-at">Payment Date *</Label>
            <Controller
              name="paidAtDate"
              control={control}
              rules={{ required: "Payment date is required" }}
              render={({ field }) => (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="paid-at"
                      className={`w-full justify-between font-normal ${
                        errors.paidAtDate ? "border-red-500" : ""
                      }`}
                      type="button"
                    >
                      {field.value
                        ? field.value.toLocaleDateString()
                        : "Select date"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date)
                        if (date) {
                          setDatePickerOpen(false)
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      timeZone="UTC"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.paidAtDate && (
              <p className="text-sm text-red-600">
                {errors.paidAtDate.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the date when the payment was made
            </p>
          </div>

          {/* Period Info */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Period:</p>
            <p className="text-muted-foreground">
              {formatDate(periodStartDate)} - {formatDate(periodEndDate)}
            </p>
          </div>

          {mutationErrors.length > 0 && (
            <div className="space-y-1">
              {mutationErrors.map((error, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Recording Payment...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
