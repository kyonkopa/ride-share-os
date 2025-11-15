import { useQuery } from "@apollo/client/react"
import {
  CurrentUserQueryDocument,
  type CurrentUserQueryQuery,
} from "@/codegen/graphql"

export const useCurrentUserQuery = () => {
  return useQuery<CurrentUserQueryQuery>(CurrentUserQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  })
}
