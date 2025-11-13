class AddVehicleIdToRevenueRecords < ActiveRecord::Migration[8.0]
  def change
    add_reference :revenue_records, :vehicle, null: true, foreign_key: true
  end
end
