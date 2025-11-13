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

      # Find shift assignment for the driver on the given date
      # Match by the date of the shift's start_time
      date = input[:date]
      shift_assignment = driver.shift_assignments
                               .where("DATE(start_time) = ?", date)
                               .first

      if shift_assignment.nil?
        error!("No shift assignment found for this driver on the given date, ensure the driver worked on that day", code: "NOT_FOUND", field: "date")
      end

      vehicle = Vehicle.find_by_global_id(input[:vehicle_id])

      if vehicle.nil?
        error!("Vehicle not found", code: "NOT_FOUND", field: "vehicle_id")
      end

      vehicle_id = vehicle.id

      revenue_params = {
        shift_assignment_id: shift_assignment.id,
        driver_id: driver.id,
        vehicle_id:,
        total_revenue: input[:total_revenue],
        total_profit: 0.0,
        source: input[:source],
        reconciled: input[:reconciled] || false
      }

      revenue_record = RevenueRecord.create!(revenue_params)

      { revenue_record: }
    end
  end
end
