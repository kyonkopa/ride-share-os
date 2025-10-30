class RemoveEmailFromDrivers < ActiveRecord::Migration[8.0]
  def change
    remove_column :drivers, :email, :string
  end
end
