class CreateShiftAssignments < ActiveRecord::Migration[8.0]
  def change
    create_table :shift_assignments do |t|
      t.integer :city, null: false
      t.references :driver, null: false, foreign_key: true
      t.references :vehicle, null: false, foreign_key: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :recurrence_rule
      t.integer :status, default: 0, null: false

      t.timestamps
    end
    
    add_index :shift_assignments, :city
    add_index :shift_assignments, :status
    add_index :shift_assignments, :start_time
    add_index :shift_assignments, [:driver_id, :start_time]
    add_index :shift_assignments, [:vehicle_id, :start_time]
  end
end
