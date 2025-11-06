import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getShiftDuration } from "@/utils/dateUtils"
import type { TodayShiftsQueryQuery } from "@/codegen/graphql"

interface TodaysShiftsProps {
  shifts: TodayShiftsQueryQuery["todayShifts"]
}

function getStartTime(shift: TodayShiftsQueryQuery["todayShifts"][0]) {
  return shift.actualStartTime || shift.startTime
}

function getEndTime(shift: TodayShiftsQueryQuery["todayShifts"][0]) {
  return shift.actualEndTime || shift.endTime
}

export function TodaysShifts({ shifts }: TodaysShiftsProps) {
  if (shifts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shifts.map((shift) => {
            return (
              <div
                key={shift.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      shift.status === "active"
                        ? "bg-green-500"
                        : shift.status === "completed"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {shift.vehicle?.displayName}
                      {shift.status === "completed" && (
                        <Badge className="bg-green-500 ml-2">Completed</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(getStartTime(shift), "HH:mm")} -{" "}
                      {getEndTime(shift)
                        ? formatDateTime(getEndTime(shift), "HH:mm")
                        : "Active"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {getShiftDuration(
                      shift.actualStartTime,
                      shift.actualEndTime
                    )}
                  </p>
                  {shift.revenueRecords && shift.revenueRecords.length > 0 && (
                    <p className="text-sm text-green-600">
                      GHS{" "}
                      {shift.revenueRecords
                        .reduce((sum, record) => sum + record.totalRevenue, 0)
                        .toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
