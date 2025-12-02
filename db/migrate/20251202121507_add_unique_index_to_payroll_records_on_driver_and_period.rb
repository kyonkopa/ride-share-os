class AddUniqueIndexToPayrollRecordsOnDriverAndPeriod < ActiveRecord::Migration[8.0]
  def change
    # Remove the existing non-unique index
    remove_index :payroll_records, name: "index_payroll_records_on_driver_and_period"
    
    # Add a unique index to prevent duplicate payroll records for the same driver and period
    add_index :payroll_records, [:driver_id, :period_start_date, :period_end_date],
              unique: true,
              name: "index_payroll_records_on_driver_and_period"
  end
end
