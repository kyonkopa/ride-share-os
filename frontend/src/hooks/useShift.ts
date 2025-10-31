import { useMemo } from "react"
import { useCurrentShiftQuery } from "@/features/current-shift/useCurrentShiftQuery"
import {
  CurrentShiftFragmentFragmentDoc,
  type CurrentShiftFragmentFragment,
  type ShiftEvent,
  ShiftEventTypeEnum,
} from "@/codegen/graphql"
import { getFragmentData } from "@/codegen"

interface useShiftReturn {
  currentShift: CurrentShiftFragmentFragment | null | undefined
  isLoading: boolean
  refetchCurrentShift: () => void
  clockInShiftEvent: ShiftEvent | null | undefined
}

export function useShift(): useShiftReturn {
  // GraphQL query for current shift
  const {
    data: currentShiftData,
    loading: currentShiftLoading,
    refetch: refetchCurrentShift,
  } = useCurrentShiftQuery()

  const currentShift = useMemo(() => {
    return getFragmentData(
      CurrentShiftFragmentFragmentDoc,
      currentShiftData?.currentShift
    )
  }, [currentShiftData])

  const clockInShiftEvent = useMemo(() => {
    // find the last clock in shift event
    return currentShift?.shiftEvents?.find(
      (event) => event.eventType === ShiftEventTypeEnum.ClockIn
    ) as ShiftEvent | undefined
  }, [currentShift])

  // Get today's shifts

  return {
    currentShift,
    isLoading: currentShiftLoading,
    refetchCurrentShift,
    clockInShiftEvent,
  }
}
