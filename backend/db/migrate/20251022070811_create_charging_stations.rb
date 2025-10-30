class CreateChargingStations < ActiveRecord::Migration[8.0]
  def change
    create_table :charging_stations do |t|
      t.string :name, null: false
      t.decimal :location_lat, precision: 10, scale: 6, null: false
      t.decimal :location_lon, precision: 10, scale: 6, null: false
      t.json :connectors, default: [], null: false
      t.integer :status, default: 0, null: false

      t.timestamps
    end
    
    add_index :charging_stations, :status
    add_index :charging_stations, [:location_lat, :location_lon]
  end
end
