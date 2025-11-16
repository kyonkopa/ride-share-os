class AddTierToDrivers < ActiveRecord::Migration[8.0]
  def change
    add_column :drivers, :tier, :string, default: 'tier_1', null: false
  end
end
