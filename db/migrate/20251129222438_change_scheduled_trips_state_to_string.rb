class ChangeScheduledTripsStateToString < ActiveRecord::Migration[8.0]
  def up
    change_column :scheduled_trips, :state, :string, null: false
  end

  def down
    change_column :scheduled_trips, :state, :integer, default: 0, null: false
  end
end
