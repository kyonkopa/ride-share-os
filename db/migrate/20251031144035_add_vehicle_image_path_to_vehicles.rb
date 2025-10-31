class AddVehicleImagePathToVehicles < ActiveRecord::Migration[8.0]
  def change
    add_column :vehicles, :vehicle_image_path, :string
  end
end
