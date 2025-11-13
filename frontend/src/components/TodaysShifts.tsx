import React, { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getShiftDuration } from "@/utils/dateUtils"
import { ShiftStatusEnum, type TodayShiftsQueryQuery } from "@/codegen/graphql"
import { DateTime } from "luxon"

interface TodaysShiftsProps {
  shifts: TodayShiftsQueryQuery["todayShifts"]
}

type Shift = TodayShiftsQueryQuery["todayShifts"][0]

const STATUS_BADGE_CONFIG: Record<
  ShiftStatusEnum,
  { label: string; className: string }
> = {
  [ShiftStatusEnum.Completed]: {
    label: "Completed",
    className: "border-green-500 ml-2",
  },
  [ShiftStatusEnum.Active]: {
    label: "Active",
    className: "border-yellow-500 ml-2",
  },
  [ShiftStatusEnum.Scheduled]: {
    label: "Pending",
    className: "border-gray-500 ml-2",
  },
  [ShiftStatusEnum.Missed]: {
    label: "Missed",
    className: "border-red-500 ml-2",
  },
  [ShiftStatusEnum.Paused]: {
    label: "Paused",
    className: "border-orange-500 ml-2",
  },
}

function getStartTime(shift: Shift): string {
  return shift.actualStartTime || shift.startTime
}

function getEndTime(shift: Shift): string {
  return shift.actualEndTime || shift.endTime
}

function calculateTotalRevenue(
  revenueRecords: Shift["revenueRecords"]
): number {
  if (!revenueRecords || revenueRecords.length === 0) return 0
  return revenueRecords.reduce((sum, record) => sum + record.totalRevenue, 0)
}

interface ShiftItemProps {
  shift: Shift
  currentTimeISO: string
}

const ShiftItem = React.memo(function ShiftItem({
  shift,
  currentTimeISO,
}: ShiftItemProps) {
  const statusConfig = STATUS_BADGE_CONFIG[shift.status]
  const startTime = getStartTime(shift)
  const endTime = getEndTime(shift)
  const isActive = shift.status === ShiftStatusEnum.Active
  const isScheduled = shift.status === ShiftStatusEnum.Scheduled
  const totalRevenue = useMemo(
    () => calculateTotalRevenue(shift.revenueRecords),
    [shift.revenueRecords]
  )

  return (
    <div className="p-3 border rounded-lg">
      <p className="font-medium mb-1">{shift.driver.fullName}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm">
            {isScheduled && <span>Scheduled for </span>}
            {formatDateTime(startTime, "HH:mm")} -{" "}
            {!isActive && <span>{formatDateTime(endTime, "HH:mm")}</span>}
            {isScheduled && (
              <span className="text-sm">
                {" "}
                in <b className="capitalize">{shift.city}</b>
              </span>
            )}
          </p>
          {statusConfig && (
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          )}
        </div>
        <div className="text-right">
          {shift.actualStartTime && (
            <p className="font-medium">
              {getShiftDuration(
                shift.actualStartTime,
                shift.actualEndTime || currentTimeISO
              )}
            </p>
          )}
          {totalRevenue > 0 && (
            <p className="text-sm text-green-600">
              GHS {totalRevenue.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <p className="font-medium">{shift.vehicle?.displayName}</p>
    </div>
  )
})

export const TodaysShifts = React.memo(function TodaysShifts({
  shifts,
}: TodaysShiftsProps) {
  const currentTimeISO = useMemo(() => DateTime.now().toISO() || "", [])

  if (shifts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Shifts</CardTitle>
        <CardDescription>
          {shifts.length} {shifts.length === 1 ? "shift" : "shifts"} scheduled
          for today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shifts.map((shift) => (
            <ShiftItem
              key={shift.id}
              shift={shift}
              currentTimeISO={currentTimeISO}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
