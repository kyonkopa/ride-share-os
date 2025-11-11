import {
  type DocumentNode,
  type OperationVariables,
  type MutationFetchPolicy,
  CombinedGraphQLErrors,
} from "@apollo/client"
import { useMutation as useApolloMutation } from "@apollo/client/react"
import type { Error } from "@/codegen/graphql"
import { useCallback } from "react"
import { useNotification } from "./useNotification"
import type { GraphQLError } from "graphql"

type UseMutationReturn<
  T = Record<string, unknown>,
  TVariables extends OperationVariables = OperationVariables,
> = {
  mutate: ({ variables }: { variables: TVariables }) => Promise<T | null>
  loading: boolean
}

export type MutationOptions<
  T = Record<string, unknown>,
  TVariables extends OperationVariables = OperationVariables,
> = {
  variables?: TVariables
  refetchQueries?:
    | string[]
    | { query: DocumentNode; variables?: Record<string, unknown> }[]
  onComplete?: (data: T | null) => void
  onSuccess?: (data: T) => void
  onError?: (error: Error[]) => void
  onUnknownError?: (error: Error[]) => void
  handlePayloadErrors?: boolean
  fetchPolicy?: MutationFetchPolicy
}

export const useMutation = <
  T = Record<string, unknown>,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode,
  options: MutationOptions<T, TVariables>
): UseMutationReturn<T, TVariables> => {
  const { addGraphQLError } = useNotification()
  const [executeMutation, { loading }] = useApolloMutation<T, TVariables>(
    mutation,
    {
      refetchQueries: options.refetchQueries,
      fetchPolicy: options.fetchPolicy,
    }
  )

  const {
    onComplete,
    onSuccess,
    onError,
    onUnknownError,
    handlePayloadErrors = true,
  } = options

  const mutate = useCallback(
    async ({ variables }: { variables: TVariables }): Promise<T | null> => {
      try {
        const result = await executeMutation({
          variables: variables as TVariables,
        })

        if (!result?.data) return null

        const mutationKey = Object.keys(result.data)[0]
        const responseData = result.data[
          mutationKey as keyof T
        ] as T[keyof T] & {
          errors?: Error[]
        }

        if (responseData?.errors?.length || result.error) {
          onError?.(responseData.errors || [])
        } else {
          onSuccess?.(result.data)
        }

        onComplete?.(result.data)
        return result.data as T
      } catch (err: unknown) {
        if (CombinedGraphQLErrors.is(err) && handlePayloadErrors) {
          err.errors.forEach((error) => {
            addGraphQLError(error as GraphQLError)
          })
        }

        onUnknownError?.(err as Error[])
        return null
      }
    },
    [
      executeMutation,
      addGraphQLError,
      onComplete,
      onSuccess,
      onError,
      handlePayloadErrors,
      onUnknownError,
    ]
  )

  return { mutate, loading }
}
