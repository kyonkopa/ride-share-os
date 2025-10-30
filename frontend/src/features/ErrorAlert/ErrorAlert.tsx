import { toast as sonnerToast } from "sonner"
import type { ToastProps } from "@/hooks/useNotification"
import { X } from "lucide-react"

export function ErrorAlert(props: ToastProps) {
  const { title, id } = props

  return (
    <div
      className="w-full min-w-[500px] max-w-full flex items-center p-4 mb-4 text-red-800 rounded-lg bg-red-50"
      role="alert"
    >
      <svg
        className="shrink-0 w-4 h-4"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
      </svg>
      <span className="sr-only">Info</span>
      <div className="ms-3 text-sm font-medium">{title}</div>

      <button
        type="button"
        className="m-0 bg-transparent border-none shadow-none focus:outline-none ms-auto -mx-1.5 -my-1.5  text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8 dark:text-red-400"
        aria-label="Close"
        onClick={() => sonnerToast.dismiss(id)}
      >
        <X size={24} />
      </button>
    </div>
  )
}
