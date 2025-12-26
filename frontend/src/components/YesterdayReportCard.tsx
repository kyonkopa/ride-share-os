import { useYesterdayReport } from "@/features/yesterday-report/useYesterdayReport"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"

export function YesterdayReportCard() {
  const { loading, error, report } = useYesterdayReport()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yesterday's Report</CardTitle>
          <CardDescription>Loading report data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yesterday's Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load yesterday's report. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return null
  }

  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="yesterday-report" className="border-none">
          <CardHeader className="pb-2">
            <AccordionTrigger className="px-0 py-0 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div>
                  <CardTitle className="text-base">
                    Yesterday's Report
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Summary of key operational activities
                  </CardDescription>
                </div>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed">
                {report.humanReadableText}
              </p>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
