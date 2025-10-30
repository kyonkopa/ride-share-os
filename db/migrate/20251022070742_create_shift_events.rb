class CreateShiftEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :shift_events do |t|
      t.references :shift_assignment, null: false, foreign_key: true
      t.integer :event_type, null: false
      t.integer :odometer
      t.integer :vehicle_range
      t.decimal :gps_lat, precision: 10, scale: 6
      t.decimal :gps_lon, precision: 10, scale: 6
      t.text :notes

      t.timestamps
    end
      
    add_index :shift_events, :event_type
  end
end
