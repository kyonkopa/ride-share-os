class CreateExpenses < ActiveRecord::Migration[8.0]
  def change
    create_table :expenses do |t|
      t.references :driver, null: true, foreign_key: true
      t.references :vehicle, null: true, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :category, null: false
      t.date :date, null: false
      t.string :receipt_key

      t.timestamps
    end
    
    add_index :expenses, :category
    add_index :expenses, :date
    add_index :expenses, [:driver_id, :date]
    add_index :expenses, [:vehicle_id, :date]
  end
end
