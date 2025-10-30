import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ShiftDetailsDrawer } from "./ShiftDetailsDrawer";
import type { Shift, Vehicle } from "@/types/shift";

interface CalendarScreenProps {
  shifts: Shift[];
  vehicles: Vehicle[];
}

export function CalendarScreen({ shifts, vehicles }: CalendarScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate attendance summary for the current month
  const attendanceSummary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= monthStart && shiftDate <= monthEnd;
    });

    const workedDays = new Set(
      monthShifts
        .filter(
          (shift) => shift.status === "completed" || shift.status === "active"
        )
        .map((shift) => new Date(shift.startTime).getDate())
    ).size;

    const upcomingDays = new Set(
      monthShifts
        .filter((shift) => shift.status === "upcoming")
        .map((shift) => new Date(shift.startTime).getDate())
    ).size;

    const totalDays = monthEnd.getDate();
    const missedDays = totalDays - workedDays - upcomingDays;
    const attendanceRate = Math.round((workedDays / totalDays) * 100);

    const totalRevenue = monthShifts
      .filter((shift) => shift.revenue)
      .reduce((acc, shift) => acc + (shift.revenue || 0), 0);

    return {
      workedDays,
      missedDays,
      upcomingDays,
      attendanceRate,
      totalRevenue,
    };
  }, [shifts]);

  // Get shifts for a specific date
  const getShiftsForDate = useCallback(
    (date: Date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return shifts.filter((shift) => {
        const shiftDate = new Date(shift.startTime);
        return shiftDate >= dayStart && shiftDate <= dayEnd;
      });
    },
    [shifts]
  );

  // Custom day modifier to add status indicators
  const modifiers = useMemo(() => {
    const workedDates: Date[] = [];
    const missedDates: Date[] = [];
    const upcomingDates: Date[] = [];

    // Get all dates in the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (
      let d = new Date(monthStart);
      d <= monthEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dayShifts = getShiftsForDate(d);
      if (dayShifts.length > 0) {
        const hasWorked = dayShifts.some(
          (shift) => shift.status === "completed" || shift.status === "active"
        );
        const hasUpcoming = dayShifts.some(
          (shift) => shift.status === "upcoming"
        );

        if (hasWorked) {
          workedDates.push(new Date(d));
        } else if (hasUpcoming) {
          upcomingDates.push(new Date(d));
        }
      }
    }

    return {
      worked: workedDates,
      missed: missedDates,
      upcoming: upcomingDates,
    };
  }, [getShiftsForDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Worked: {attendanceSummary.workedDays} | Missed:{" "}
            {attendanceSummary.missedDays} | Upcoming:{" "}
            {attendanceSummary.upcomingDays}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>
            Tap on any date to view shift details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersClassNames={{
                worked: "bg-green-100 text-green-800 hover:bg-green-200",
                missed: "bg-red-100 text-red-800 hover:bg-red-200",
                upcoming: "bg-blue-100 text-blue-800 hover:bg-blue-200",
              }}
              className="rounded-md border"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Worked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Upcoming</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your attendance and earnings for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {attendanceSummary.workedDays}
              </p>
              <p className="text-sm text-muted-foreground">Worked Days</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {attendanceSummary.missedDays}
              </p>
              <p className="text-sm text-muted-foreground">Missed Days</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {attendanceSummary.upcomingDays}
              </p>
              <p className="text-sm text-muted-foreground">Upcoming Shifts</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {attendanceSummary.attendanceRate}%
              </p>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(attendanceSummary.totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Details Drawer */}
      <ShiftDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedDate={selectedDate || null}
        shifts={shifts}
        vehicles={vehicles}
      />
    </div>
  );
}
