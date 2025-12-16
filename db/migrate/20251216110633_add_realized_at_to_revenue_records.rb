class AddRealizedAtToRevenueRecords < ActiveRecord::Migration[8.0]
  def change
    add_column :revenue_records, :realized_at, :datetime
    add_index :revenue_records, :realized_at
  end
end
