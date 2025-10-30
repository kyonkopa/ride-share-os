class CreateVehicles < ActiveRecord::Migration[8.0]
  def change
    create_table :vehicles do |t|
      t.string :license_plate, null: false
      t.string :model, null: false
      t.integer :year_of_manufacture, null: false
      t.integer :latest_odometer, default: 0, null: false
      t.integer :latest_range, default: 0, null: false
      t.integer :telematics_source, null: false

      t.timestamps
    end
    
    add_index :vehicles, :license_plate, unique: true
    add_index :vehicles, :telematics_source
  end
end
