class MakeVehicleIdNullableInShiftAssignments < ActiveRecord::Migration[8.0]
  def change
    change_column_null :shift_assignments, :vehicle_id, true
  end
end
