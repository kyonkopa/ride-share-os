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
  const [errors, setErrors] = useState<Error[]>([])
  const { saveAuthData } = useAuthStore()

  const { mutate: login, loading } = useMutation<CreateSessionMutationMutation>(
    CreateSessionMutationDocument,
    {
      onError: (errors: Error[]) => {
        setErrors(errors)
      },
      onSuccess: (data: CreateSessionMutationMutation) => {
        const session = data.createSession

        if (session?.user && session?.authToken) {
          saveAuthData(session?.user as User, session?.authToken)
        }
      },
      onUnknownError: () => {
        setErrors([
          {
            code: "UNKNOWN_ERROR",
            message: "Sorry, something went wrong. Please try again later.",
          },
        ])
      },
    }
  )

  const handleLogin = async (data: { email: string; password: string }) => {
    setErrors([])

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
