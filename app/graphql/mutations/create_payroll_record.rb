# frozen_string_literal: true

module Mutations
  class CreatePayrollRecord < Mutations::BaseMutation
    description "Create a new payroll record to track payment to a driver"

    argument :input, Types::Inputs::CreatePayrollRecordInput, required: true, description: "Input for creating a payroll record"

    field :payroll_record, Types::PayrollRecordType, null: true

    def authorized?(input:)
      unless current_user.can?("payroll_write_access")
        error!("You are not authorized to create a payroll record", code: "UNAUTHORIZED", field: "base")
      end

      true
    end

    def execute(input:)
      period_start_date = input[:period_start_date].is_a?(Date) ? input[:period_start_date] : Date.parse(input[:period_start_date])
      period_end_date = input[:period_end_date].is_a?(Date) ? input[:period_end_date] : Date.parse(input[:period_end_date])

      # Set paid_at to current time if not provided
      paid_at = if input[:paid_at]
        input[:paid_at].is_a?(Time) || input[:paid_at].is_a?(DateTime) ? input[:paid_at] : Time.zone.parse(input[:paid_at].to_s)
      else
        Time.current
      end

      payroll_params = {
        driver_id: input[:driver].id,
        paid_by_user_id: current_user.id,
        amount_paid: input[:amount_paid],
        period_start_date:,
        period_end_date:,
        paid_at:,
        notes: input[:notes]
      }

      begin
        payroll_record = PayrollRecord.create!(payroll_params)
      rescue ActiveRecord::RecordInvalid => e
        record = e.record
        errors = record.errors

        # Check for duplicate driver/period record
        duplicate_driver_error = errors.details[:driver_id]&.any? { |detail| detail[:error] == :taken }
        if duplicate_driver_error
          return error!("A payroll record already exists for this driver and period", code: "DUPLICATE_RECORD", field: "driverId")
        end

        # Check for amount_paid validation errors
        amount_paid_errors = errors.details[:amount_paid]
        if amount_paid_errors&.any?
          amount_paid_messages = errors[:amount_paid]
          exceeds_amount_due = amount_paid_messages&.any? { |msg| msg.include?("cannot exceed the amount due") }

          if exceeds_amount_due
            return error!("The amount paid cannot exceed the amount due to the driver, ensure this is not a mistake.", code: "VALIDATION_ERROR", field: "amountPaid")
          else
            return error!(amount_paid_messages.first, code: "VALIDATION_ERROR", field: "amountPaid")
          end
        end

        # General validation error fallback
        error!("Validation failed: #{e.message}", code: "VALIDATION_ERROR", field: "base")
      end

      { payroll_record: }
    end
  end
end
