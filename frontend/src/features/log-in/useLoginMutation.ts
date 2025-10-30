import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateSessionMutationDocument,
  type CreateSessionMutationMutation,
  type Error,
  type User,
} from "../../codegen/graphql"
import { useAuthStore } from "../../stores/AuthStore"

export const useLoginMutation = () => {
  const [errors, setError] = useState<Error[]>([])
  const { saveAuthData } = useAuthStore()

  const { mutate: login, loading } = useMutation<CreateSessionMutationMutation>(
    CreateSessionMutationDocument,
    {
      onError: (errors: Error[]) => {
        setError(errors)
      },
      onSuccess: (data: CreateSessionMutationMutation) => {
        const session = data.createSession

        if (session?.user && session?.authToken) {
          saveAuthData(session?.user as User, session?.authToken)
        }
      },
    }
  )

  const handleLogin = async (data: { email: string; password: string }) => {
    setError([])

    await login({
      variables: {
        input: {
          ...data,
          loginScope: "user",
        },
      },
    })
  }

  const accountLockedError = errors.find(
    (error) => error.code === "ACCOUNT_LOCKED"
  )

  const accountNotConfirmedError = errors.find(
    (error) => error.code === "ACCOUNT_NOT_CONFIRMED"
  )

  const invalidCredentialsError = errors.find(
    (error) => error.code === "INVALID_CREDENTIALS"
  )

  return {
    handleLogin,
    errors,
    accountLockedError,
    accountNotConfirmedError,
    invalidCredentialsError,
    loading,
  }
}
