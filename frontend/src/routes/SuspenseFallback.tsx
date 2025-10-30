import { Spinner } from "@/components/ui/spinner"

export default function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p>Loading...</p>
      </div>
    </div>
  )
}
