import { useState, useMemo } from "react"
import { DateTime } from "luxon"
import { useRevenueRecords } from "@/features/revenue-records/useRevenueRecords"
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { DollarSign } from "lucide-react"
import { Badge } from "./ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { cn } from "@/lib/utils"
import type { RevenueRecord } from "@/codegen/graphql"

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

interface RevenueRecordCardProps {
  record: RevenueRecord
}

function RevenueRecordCard({ record }: RevenueRecordCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>{formatCurrency(record.totalRevenue)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Profit: {formatCurrency(record.totalProfit)}</div>
          <div>Driver: {record.driver.fullName}</div>
          <div>
            Vehicle: {record.shiftAssignment.vehicle?.displayName || "N/A"}
          </div>
          <div>Date: {formatDate(record.createdAt)}</div>
          <div>
            Source: <span className="capitalize">{record.source}</span>
          </div>
          <Badge
            className={cn(record.reconciled ? "bg-green-500" : "bg-amber-500")}
          >
            {record.reconciled ? "Reconciled" : "Unreconciled"}
          </Badge>
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

export function RevenueScreen() {
  const [activeTab, setActiveTab] = useState<"this-week" | "all-time">(
    "this-week"
  )

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

  const { revenueRecords, loading, error } = useRevenueRecords(
    dateParams.startDate,
    dateParams.endDate
  )

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
        <AlertTitle>Error loading revenue records</AlertTitle>
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
          <h1 className="text-2xl font-bold">Revenue</h1>
          <p className="text-sm text-muted-foreground">
            View all your revenue records
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "this-week" | "all-time")
        }
      >
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>
        <TabsContent value="this-week" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing revenue records for {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)}
            </p>
          )}
          {/* Revenue Records List */}
          {revenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueRecords.map((record) => (
                <RevenueRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all-time" className="mt-3">
          <p className="text-sm text-muted-foreground mb-4">
            Showing all revenue records
          </p>
          {/* Revenue Records List */}
          {revenueRecords.length === 0 ? (
            <RevenueRecordsEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {revenueRecords.map((record) => (
                <RevenueRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
