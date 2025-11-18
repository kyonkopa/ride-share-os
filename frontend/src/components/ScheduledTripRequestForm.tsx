import { useState } from "react"
import { Controller } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  MapPin,
  CalendarClock,
  User,
  Mail,
  Phone,
  Clock,
  ChevronDownIcon,
  AlertCircleIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { useScheduledTripRequestForm } from "@/features/scheduled-trips/useScheduledTripRequestForm"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription } from "./ui/alert"
import { InlineErrorAlert } from "./ui/inline-error-alert"
import { Routes } from "@/routes/routes.utilities"
import { Checkbox } from "./ui/checkbox"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, title: "Client Info", icon: User },
  { id: 2, title: "Trip Details", icon: MapPin },
  { id: 3, title: "Recurrence", icon: CalendarClock },
  { id: 4, title: "Review", icon: CheckCircle2 },
] as const

export function ScheduledTripRequestForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [recurrenceEndDatePickerOpen, setRecurrenceEndDatePickerOpen] =
    useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    onSubmitForm,
    loading,
    mutationErrors,
  } = useScheduledTripRequestForm()

  const formValues = watch()
  const isRecurring = watch("isRecurring")
  const recurrenceFrequency = watch("recurrenceFrequency")
  const pickupDate = watch("pickupDate")

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ]

  const handleRecurrenceDayToggle = (day: number, currentDays: number[]) => {
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day]
    return newDays
  }

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof typeof formValues)[] = []

    switch (step) {
      case 1:
        fieldsToValidate = ["clientName", "clientEmail", "clientPhone"]
        break
      case 2:
        fieldsToValidate = [
          "pickupLocation",
          "dropoffLocation",
          "pickupDate",
          "pickupTime",
        ]
        break
      case 3:
        if (isRecurring) {
          fieldsToValidate = ["recurrenceFrequency", "recurrenceInterval"]
        } else {
          return true // Skip validation if not recurring
        }
        break
      default:
        return true
    }

    const result = await trigger(fieldsToValidate)
    if (result) {
      setCompletedSteps((prev) =>
        prev.includes(step) ? prev : [...prev, step]
      )
    }
    return result
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      if (currentStep === 2 && !isRecurring) {
        // Skip recurrence step if not recurring
        setCurrentStep(4)
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep === 4 && !isRecurring) {
      // Go back to step 2 if skipping recurrence
      setCurrentStep(2)
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
    }
  }

  const formatDateTime = (date: Date | null, time: string) => {
    if (!date || !time) return "Not set"
    const [hours, minutes] = time.split(":")
    const dateTime = new Date(date)
    dateTime.setHours(parseInt(hours), parseInt(minutes))
    return dateTime.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const formatRecurrence = () => {
    if (!isRecurring) return "One-time trip"
    const frequency = formValues.recurrenceFrequency
    const interval = formValues.recurrenceInterval
    const parts = [`Every ${interval} ${frequency}(s)`]

    if (frequency === "weekly" && formValues.recurrenceDaysOfWeek.length > 0) {
      const days = formValues.recurrenceDaysOfWeek
        .map((d) => daysOfWeek.find((day) => day.value === d)?.label)
        .filter(Boolean)
        .join(", ")
      parts.push(`on ${days}`)
    }

    if (formValues.recurrenceEndDate) {
      parts.push(`until ${formValues.recurrenceEndDate.toLocaleDateString()}`)
    } else if (formValues.recurrenceOccurrenceCount) {
      parts.push(`for ${formValues.recurrenceOccurrenceCount} occurrences`)
    }

    return parts.join(" ")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 transition-all duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Client Information</h2>
              <p className="text-muted-foreground">
                Tell us who needs the ride
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Full Name</Label>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Enter full name"
                  {...register("clientName")}
                  className={cn(
                    errors.clientName &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-600 transition-opacity duration-200">
                    {errors.clientName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="clientEmail"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="Enter email address"
                  {...register("clientEmail")}
                  className={cn(
                    errors.clientEmail &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.clientEmail && (
                  <p className="text-sm text-red-600 transition-opacity duration-200">
                    {errors.clientEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="clientPhone"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="Enter phone number"
                  {...register("clientPhone")}
                  className={cn(
                    errors.clientPhone &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.clientPhone && (
                  <p className="text-sm text-red-600 transition-opacity duration-200">
                    {errors.clientPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6 transition-all duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Trip Details</h2>
              <p className="text-muted-foreground">
                Where and when should we pick you up?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Input
                  id="pickupLocation"
                  type="text"
                  placeholder="Enter pickup address"
                  {...register("pickupLocation")}
                  className={cn(
                    errors.pickupLocation &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.pickupLocation && (
                  <p className="text-sm text-red-600 transition-opacity duration-200">
                    {errors.pickupLocation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffLocation">Drop-off Location</Label>
                <Input
                  id="dropoffLocation"
                  type="text"
                  placeholder="Enter drop-off address"
                  {...register("dropoffLocation")}
                  className={cn(
                    errors.dropoffLocation &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.dropoffLocation && (
                  <p className="text-sm text-red-600 transition-opacity duration-200">
                    {errors.dropoffLocation.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="pickupDate"
                    className="flex items-center gap-2"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Pickup Date
                  </Label>
                  <Controller
                    name="pickupDate"
                    control={control}
                    render={({ field }) => (
                      <Popover
                        open={datePickerOpen}
                        onOpenChange={setDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="pickupDate"
                            className={cn(
                              "w-full justify-between font-normal",
                              errors.pickupDate && "border-red-500"
                            )}
                            type="button"
                          >
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Select pickup date"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            disabled={(date) => date < new Date()}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date)
                              }
                              setDatePickerOpen(false)
                            }}
                            timeZone="UTC"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.pickupDate && (
                    <p className="text-sm text-red-600 transition-opacity duration-200">
                      {errors.pickupDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pickupTime"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Pickup Time
                  </Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    {...register("pickupTime")}
                    className={cn(
                      errors.pickupTime &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {errors.pickupTime && (
                    <p className="text-sm text-red-600 transition-opacity duration-200">
                      {errors.pickupTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 transition-all duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CalendarClock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Recurring Trip</h2>
              <p className="text-muted-foreground">
                Set up a recurring schedule (optional)
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
                  <Controller
                    name="isRecurring"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isRecurring"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    )}
                  />
                  <Label
                    htmlFor="isRecurring"
                    className="cursor-pointer text-lg font-medium"
                  >
                    This is a recurring trip
                  </Label>
                </div>
              </CardContent>
            </Card>

            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20 transition-all duration-300">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceFrequency">Frequency</Label>
                  <Controller
                    name="recurrenceFrequency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn(
                            errors.recurrenceFrequency &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.recurrenceFrequency && (
                    <p className="text-sm text-red-600 transition-opacity duration-200">
                      {errors.recurrenceFrequency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceInterval">Interval</Label>
                  <Input
                    id="recurrenceInterval"
                    type="number"
                    min="1"
                    placeholder="e.g., 1 (every day/week/month), 2 (every other day/week/month)"
                    {...register("recurrenceInterval")}
                    className={cn(
                      errors.recurrenceInterval &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {errors.recurrenceInterval && (
                    <p className="text-sm text-red-600 transition-opacity duration-200">
                      {errors.recurrenceInterval.message}
                    </p>
                  )}
                </div>

                {recurrenceFrequency === "weekly" && (
                  <div className="space-y-2">
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.value}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Controller
                            name="recurrenceDaysOfWeek"
                            control={control}
                            render={({ field }) => (
                              <>
                                <Checkbox
                                  id={`day-${day.value}`}
                                  checked={field.value.includes(day.value)}
                                  onCheckedChange={() => {
                                    const newDays = handleRecurrenceDayToggle(
                                      day.value,
                                      field.value
                                    )
                                    field.onChange(newDays)
                                  }}
                                />
                                <Label
                                  htmlFor={`day-${day.value}`}
                                  className="cursor-pointer text-sm flex-1"
                                >
                                  {day.label}
                                </Label>
                              </>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                  <Controller
                    name="recurrenceEndDate"
                    control={control}
                    render={({ field }) => (
                      <Popover
                        open={recurrenceEndDatePickerOpen}
                        onOpenChange={setRecurrenceEndDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="recurrenceEndDate"
                            className="w-full justify-between font-normal"
                            type="button"
                          >
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Select end date (optional)"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            disabled={(date) =>
                              pickupDate ? date < pickupDate : date < new Date()
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date)
                              }
                              setRecurrenceEndDatePickerOpen(false)
                            }}
                            timeZone="UTC"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceOccurrenceCount">
                    Number of Occurrences (Optional)
                  </Label>
                  <Input
                    id="recurrenceOccurrenceCount"
                    type="number"
                    min="1"
                    placeholder="e.g., 10 (for 10 occurrences)"
                    {...register("recurrenceOccurrenceCount")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty if using end date instead
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 transition-all duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Review Your Request</h2>
              <p className="text-muted-foreground">
                Please review all details before submitting
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formValues.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {formValues.clientEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">
                      {formValues.clientPhone}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Trip Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {formValues.pickupLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drop-off:</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {formValues.dropoffLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium">
                      {formatDateTime(
                        formValues.pickupDate,
                        formValues.pickupTime
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{formatRecurrence()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 mb-[60px] max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Request Scheduled Trip</h1>
        <p className="text-muted-foreground">
          Submit a request for a future or recurring trip
        </p>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              const isSkipped = step.id === 3 && !isRecurring && currentStep > 3

              if (isSkipped) return null

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                        isActive &&
                          "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                        isCompleted &&
                          "border-green-500 bg-green-500 text-white",
                        !isActive &&
                          !isCompleted &&
                          "border-muted-foreground/30 bg-background"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium transition-colors",
                        isActive && "text-primary",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-colors duration-300",
                        completedSteps.includes(step.id) ||
                          (step.id === 2 && currentStep > 2 && !isRecurring)
                          ? "bg-green-500"
                          : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <Card className="min-h-[400px]">
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Error Display */}
        {mutationErrors && mutationErrors.length > 0 && (
          <Alert
            variant="destructive"
            className="mt-4 transition-opacity duration-200"
          >
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                {mutationErrors.map((error, index) => (
                  <InlineErrorAlert key={index} message={error.message} />
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(Routes.home)}
                className={currentStep === 1 ? "flex-1" : ""}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1"
                disabled={loading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || isSubmitting}
              >
                {(loading || isSubmitting) && <Spinner className="mr-2" />}
                {loading || isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
