import { DateTime } from "luxon"

/**
 * Utility functions for working with dates in the transport services app
 */

/**
 * Parse a GraphQL ISO8601DateTime string to a Luxon DateTime
 */
export function parseGraphQLDateTime(dateString: string): DateTime {
  return DateTime.fromISO(dateString)
}

/**
 * Format a DateTime for display in the UI
 */
export function formatDateTime(
  dateTime: string,
  format: string = "MMM dd, yyyy HH:mm"
): string {
  return parseGraphQLDateTime(dateTime).toFormat(format)
}

/**
 * Format a DateTime for display as a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateTime: DateTime): string {
  return dateTime.toRelative() || "Unknown time"
}

/**
 * Check if a DateTime is today
 */
export function isToday(dateTime: DateTime): boolean {
  return dateTime.hasSame(DateTime.now(), "day")
}

/**
 * Check if a DateTime is in the past
 */
export function isPast(dateTime: DateTime): boolean {
  return dateTime < DateTime.now()
}

/**
 * Check if a DateTime is in the future
 */
export function isFuture(dateTime: DateTime): boolean {
  return dateTime > DateTime.now()
}

/**
 * Get the duration between two DateTimes in a human-readable format
 */
export function getDuration(start: DateTime, end: DateTime): string {
  const duration = end.diff(start)
  return duration.toHuman()
}

/**
 * Format a shift time range for display
 */
export function formatShiftTimeRange(
  startTime: string,
  endTime: string
): string {
  const start = parseGraphQLDateTime(startTime)
  const end = parseGraphQLDateTime(endTime)

  if (isToday(start)) {
    return `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")} today`
  } else {
    return `${start.toFormat("MMM dd, HH:mm")} - ${end.toFormat(
      "MMM dd, HH:mm"
    )}`
  }
}

/**
 * Get the current time in ISO format for GraphQL mutations
 */
export function getCurrentTimeISO(): string {
  return DateTime.now().toISO()
}

/**
 * Parse and format a shift event timestamp
 */
export function formatShiftEventTime(timestamp: string): string {
  const dateTime = parseGraphQLDateTime(timestamp)
  return formatRelativeTime(dateTime)
}

export function getShiftDuration(startTime: string, endTime?: string): string {
  const start = parseGraphQLDateTime(startTime)
  const end = endTime ? parseGraphQLDateTime(endTime) : DateTime.now()
  const diff = end.diff(start, ["hours", "minutes"])

  // return hours and minutes
  const hours = diff.hours
  const minutes = diff.minutes.toFixed(0)

  return `${hours}h ${minutes}m`
}
