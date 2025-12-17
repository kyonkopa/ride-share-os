# frozen_string_literal: true

class RemoveUniqueIndexFromPayrollRecords < ActiveRecord::Migration[8.0]
  def change
    # Remove the unique index to allow multiple payroll records for the same driver and period
    # This enables bi-weekly payments and partial payments
    remove_index :payroll_records, 
                 name: "index_payroll_records_on_driver_and_period"
    
    # Add back a non-unique index for query performance
    add_index :payroll_records, 
              [:driver_id, :period_start_date, :period_end_date],
              name: "index_payroll_records_on_driver_and_period"
  end
end

