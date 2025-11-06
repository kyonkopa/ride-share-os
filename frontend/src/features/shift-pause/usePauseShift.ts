import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  PauseShiftMutationDocument,
  CurrentShiftQueryDocument,
  type PauseShiftMutationMutation,
  type Error,
} from "../../codegen/graphql"

export const usePauseShift = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: PauseShiftMutationMutation) => void
  onError?: (errors: Error[]) => void
} = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: pauseShift, loading } =
    useMutation<PauseShiftMutationMutation>(PauseShiftMutationDocument, {
      onError: (errors: Error[]) => {
        setErrors(errors)
        onError?.(errors)
      },
      onSuccess: (data: PauseShiftMutationMutation) => {
        setErrors([])
        onSuccess?.(data)
      },
      refetchQueries: [
        {
          query: CurrentShiftQueryDocument,
        },
      ],
    })

  const handlePauseShift = async () => {
    setErrors([])
    await pauseShift({ variables: {} })
  }

  return {
    handlePauseShift,
    errors,
    loading,
  }
}
