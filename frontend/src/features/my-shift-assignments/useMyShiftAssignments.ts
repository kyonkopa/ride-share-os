import { useQuery } from "@apollo/client/react"
import {
  MyShiftAssignmentsQueryDocument,
  type MyShiftAssignmentsQueryQuery,
  type MyShiftAssignmentsQueryQueryVariables,
  type ShiftAssignment,
} from "../../codegen/graphql"

export const useMyShiftAssignments = (
  startDate: string,
  endDate: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data, refetch } = useQuery<
    MyShiftAssignmentsQueryQuery,
    MyShiftAssignmentsQueryQueryVariables
  >(MyShiftAssignmentsQueryDocument, {
    variables: {
      startDate,
      endDate,
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: options?.skip,
  })

  return {
    shifts: (data?.myShiftAssignments || []) as ShiftAssignment[],
    loading,
    error,
    refetch,
  }
}
