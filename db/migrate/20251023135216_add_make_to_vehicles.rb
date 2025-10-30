class AddMakeToVehicles < ActiveRecord::Migration[8.0]
  def up
    add_column :vehicles, :make, :string
    
    # Update existing vehicles with a default make value
    Vehicle.update_all(make: 'Unknown')
    
    # Now make the column non-nullable
    change_column_null :vehicles, :make, false
  end

  def down
    remove_column :vehicles, :make
  end
end
