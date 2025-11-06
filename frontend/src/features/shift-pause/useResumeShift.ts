import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  ResumeShiftMutationDocument,
  CurrentShiftQueryDocument,
  type ResumeShiftMutationMutation,
  type Error,
} from "../../codegen/graphql"

export const useResumeShift = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ResumeShiftMutationMutation) => void
  onError?: (errors: Error[]) => void
} = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: resumeShift, loading } =
    useMutation<ResumeShiftMutationMutation>(ResumeShiftMutationDocument, {
      onError: (errors: Error[]) => {
        setErrors(errors)
        onError?.(errors)
      },
      onSuccess: (data: ResumeShiftMutationMutation) => {
        setErrors([])
        onSuccess?.(data)
      },
      refetchQueries: [
        {
          query: CurrentShiftQueryDocument,
        },
      ],
    })

  const handleResumeShift = async () => {
    setErrors([])
    await resumeShift({ variables: {} })
  }

  return {
    handleResumeShift,
    errors,
    loading,
  }
}
