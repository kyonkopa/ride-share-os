class AddSourceToRevenueRecords < ActiveRecord::Migration[8.0]
  def change
    add_column :revenue_records, :source, :integer, default: 0, null: false
    add_index :revenue_records, :source
  end
end
