class ChangeDriverIdToUserIdInExpenses < ActiveRecord::Migration[8.0]
  def change
    # Remove old indexes and foreign key
    remove_index :expenses, :driver_id if index_exists?(:expenses, :driver_id)
    remove_index :expenses, [:driver_id, :date] if index_exists?(:expenses, [:driver_id, :date])
    remove_foreign_key :expenses, :drivers if foreign_key_exists?(:expenses, :drivers)

    # Rename column
    rename_column :expenses, :driver_id, :user_id

    # Add new foreign key and indexes
    add_foreign_key :expenses, :users
    add_index :expenses, :user_id
    add_index :expenses, [:user_id, :date]
  end
end
