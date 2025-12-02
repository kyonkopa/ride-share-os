class CreatePayrollRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :payroll_records do |t|
      t.references :driver, null: false, foreign_key: true
      t.references :paid_by_user, null: false, foreign_key: { to_table: :users }
      t.decimal :amount_paid, precision: 10, scale: 2, null: false
      t.date :period_start_date, null: false
      t.date :period_end_date, null: false
      t.datetime :paid_at, null: false
      t.text :notes

      t.timestamps
    end
    
    # Note: driver_id and paid_by_user_id indexes are automatically created by t.references
    add_index :payroll_records, :paid_at
    add_index :payroll_records, [:driver_id, :period_start_date, :period_end_date], name: "index_payroll_records_on_driver_and_period"
  end
end

