class CreateDrivers < ActiveRecord::Migration[8.0]
  def change
    create_table :drivers do |t|
      t.string :full_name, null: false
      t.date :dob, null: false
      t.string :email, null: false
      t.string :phone_number, null: false
      t.boolean :verified, default: false, null: false

      t.timestamps
    end
    
    add_index :drivers, :email, unique: true
    add_index :drivers, :phone_number, unique: true
    add_index :drivers, :verified
  end
end
