class AddUserIdToDrivers < ActiveRecord::Migration[8.0]
  def change
    add_reference :drivers, :user, null: true, foreign_key: true
  end
end
