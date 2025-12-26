import { useQuery } from "@apollo/client/react"
import {
  YesterdayReportQueryDocument,
  type YesterdayReportQueryQuery,
} from "../../codegen/graphql"

export const useYesterdayReport = () => {
  const { loading, error, data, refetch } = useQuery<YesterdayReportQueryQuery>(
    YesterdayReportQueryDocument,
    {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    }
  )

  return {
    loading,
    error,
    report: data?.yesterdayReport,
    refetch,
  }
}
