import { useState } from "react"
import { useCreatePayrollRecordMutation } from "@/features/payroll/useCreatePayrollRecordMutation"
import { CheckCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { PayrollPaymentDialog } from "./PayrollPaymentDialog"
import type { PayrollQueryQuery } from "@/codegen/graphql"
import { formatDate } from "@/utils/dateUtils"
import { useNotification } from "@/hooks/useNotification"

type PayrollRecordFromQuery = NonNullable<
  PayrollQueryQuery["payroll"]["driverPayrolls"][number]["payrollRecords"]
>[number]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

export interface DailyBreakdown {
  date: string
  revenue: number
  amountDue: number
}

export interface PayrollDriverCardProps {
  driverId: string
  driverName: string
  amountDue: number
  startDate: string
  dailyBreakdown: DailyBreakdown[]
  periodStartDate: string
  periodEndDate: string
  payrollRecords?: PayrollRecordFromQuery[] | null
  onPaymentSuccess?: () => void
}

export function PayrollDriverCard({
  driverId,
  driverName,
  amountDue,
  startDate,
  dailyBreakdown,
  periodStartDate,
  periodEndDate,
  payrollRecords = [],
  onPaymentSuccess,
}: PayrollDriverCardProps) {
  const { addSuccess } = useNotification()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { handleCreatePayrollRecord, loading, errors } =
    useCreatePayrollRecordMutation({
      onSuccess: () => {
        addSuccess("Payment recorded successfully")
        setShowConfirmDialog(false)
        onPaymentSuccess?.()
      },
      payrollQueryVariables: {
        startDate: periodStartDate,
        endDate: periodEndDate,
      },
    })

  const handlePayClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmPay = async (data: {
    driverId: string
    amountPaid: number
    periodStartDate: string
    periodEndDate: string
    notes?: string
    paidAt?: string
  }) => {
    await handleCreatePayrollRecord(data)
  }

  // Calculate total amount paid
  const totalPaid = (payrollRecords || []).reduce(
    (sum, record) => sum + record.amountPaid,
    0
  )
  const remainingAmount = amountDue - totalPaid
  const isFullyPaid = totalPaid >= amountDue

  return (
    <Card>
      <CardHeader>
        <CardTitle>{driverName}</CardTitle>
        <CardDescription>Started: {formatDate(startDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(amountDue)}
            </div>
            {totalPaid > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Paid: {formatCurrency(totalPaid)}
                {!isFullyPaid && (
                  <span className="ml-2">
                    (Remaining: {formatCurrency(remainingAmount)})
                  </span>
                )}
              </div>
            )}
          </div>
          {isFullyPaid && (
            <Badge className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Paid
            </Badge>
          )}
        </div>
        {payrollRecords && payrollRecords.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium">Payment History:</p>
            {payrollRecords.map((record) => (
              <div
                key={record.id}
                className="text-sm text-muted-foreground border-l-2 border-primary pl-2"
              >
                {formatCurrency(record.amountPaid)} paid on{" "}
                {formatDate(record.paidAt)} by {record.paidByUser.fullName}
                {record.notes && (
                  <span className="block text-xs mt-1">
                    Note: {record.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {!isFullyPaid && (
          <>
            <Button
              onClick={handlePayClick}
              disabled={loading || remainingAmount <= 0}
              className="w-full mb-4"
            >
              {totalPaid > 0 ? "Record Additional Payment" : "Record Payment"}
            </Button>

            {/* Confirmation Dialog */}
            <PayrollPaymentDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
              driverName={driverName}
              amountDue={remainingAmount}
              periodStartDate={periodStartDate}
              periodEndDate={periodEndDate}
              driverId={driverId}
              loading={loading}
              mutationErrors={errors}
              onSubmit={handleConfirmPay}
            />
          </>
        )}
        {dailyBreakdown.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="breakdown" className="border-none">
              <AccordionTrigger className="py-2 text-sm">
                <span className="truncate underline text-primary">
                  View Daily Breakdown ({dailyBreakdown.length} days)
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {dailyBreakdown.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {formatDate(day.date)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Revenue: {formatCurrency(day.revenue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(day.amountDue)}
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
