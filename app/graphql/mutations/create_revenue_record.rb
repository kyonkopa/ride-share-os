# frozen_string_literal: true

module Mutations
  class CreateRevenueRecord < Mutations::BaseMutation
    description "Create a new revenue record"

    argument :input, Types::Inputs::CreateRevenueRecordInput, required: true, description: "Input for creating a revenue record"

    field :revenue_record, Types::RevenueRecordType, null: true

    def execute(input:)
      driver = Driver.find_by_global_id(input[:driver_id])

      if driver.nil?
        error!("Driver not found", code: "NOT_FOUND", field: "driver_id")
      end

      vehicle = Vehicle.find_by_global_id(input[:vehicle_id])

      if vehicle.nil?
        error!("Vehicle not found", code: "NOT_FOUND", field: "vehicle_id")
      end

      # Find shift assignment for the driver on the given date
      # GraphQL::Types::ISO8601Date may return a Date object or a string
      date = input[:date].is_a?(Date) ? input[:date] : Date.parse(input[:date])
      date_range = date.beginning_of_day..date.end_of_day
      shift_assignment = driver.shift_assignments.where(start_time: date_range).first

      if shift_assignment.nil?
        error!("No shift assignment found for this driver on the given date, ensure the driver worked on that day", code: "NOT_FOUND", field: "date")
      end

      vehicle_id = vehicle.id

      revenue_params = {
        shift_assignment_id: shift_assignment.id,
        driver_id: driver.id,
        vehicle_id:,
        total_revenue: input[:total_revenue],
        total_profit: 0.0,
        source: input[:source],
        reconciled: input[:reconciled] || false,
        realized_at: date.beginning_of_day
      }

      begin
        revenue_record = RevenueRecord.create!(revenue_params)
      rescue ActiveRecord::RecordInvalid => e
        error!("Validation failed: #{e.message}", code: "VALIDATION_ERROR", field: "base")
      end

      { revenue_record: }
    end
  end
end
