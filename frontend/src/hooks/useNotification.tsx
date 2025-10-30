import { GraphQLError } from "graphql"
import { toast as sonnerToast } from "sonner"
import { ErrorAlert } from "@/features/ErrorAlert/ErrorAlert"

interface ToastOptions {
  dismissible: boolean
  duration: number
}

function toast(toast: Omit<ToastProps, "id">, options?: ToastOptions) {
  return sonnerToast.custom(
    (id) => <ErrorAlert id={id} title={toast.title} />,
    {
      ...options,
    }
  )
}

export function useNotification() {
  const addSuccess = (message: string) => {
    sonnerToast.success(message)
  }

  const addError = (message: string) => {
    toast(
      {
        title: message,
      },
      {
        dismissible: true,
        duration: Infinity,
      }
    )
  }

  const addInfo = (message: string) => {
    sonnerToast.info(message)
  }

  const addWarning = (message: string) => {
    sonnerToast.warning(message)
  }

  const addLoading = (message: string) => {
    sonnerToast.loading(message)
  }

  const addGraphQLError = (error: GraphQLError) => {
    toast(
      {
        title: error.message,
      },
      {
        dismissible: true,
        duration: Infinity,
      }
    )
  }

  return {
    addSuccess,
    addError,
    addInfo,
    addWarning,
    addLoading,
    addGraphQLError,
  }
}

export interface ToastProps {
  id: string | number
  title: string
}
