interface StatusBadgeProps {
  isOnline: boolean
}

export function StatusBadge({ isOnline }: StatusBadgeProps) {
  return (
    <div className="flex justify-start">
      <div
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
          ${
            isOnline
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }
        `}
      >
        <div
          className={`
            w-2 h-2 rounded-full
            ${isOnline ? "bg-green-500" : "bg-gray-500"}
          `}
        />
        {isOnline ? "Online" : "Offline"}
      </div>
    </div>
  )
}
