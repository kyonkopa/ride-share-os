class ChangeUserIdToNotNullInDrivers < ActiveRecord::Migration[8.0]
  def change
    change_column_null :drivers, :user_id, false
  end
end
