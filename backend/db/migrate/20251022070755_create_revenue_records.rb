class CreateRevenueRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :revenue_records do |t|
      t.references :shift_assignment, null: false, foreign_key: true
      t.references :driver, null: false, foreign_key: true
      t.decimal :total_revenue, precision: 10, scale: 2, default: 0, null: false
      t.decimal :total_profit, precision: 10, scale: 2, default: 0, null: false
      t.boolean :reconciled, default: false, null: false

      t.timestamps
    end
    
    add_index :revenue_records, :reconciled
    add_index :revenue_records, [:driver_id, :created_at]
  end
end
