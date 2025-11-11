class CreatePermissions < ActiveRecord::Migration[8.0]
  def change
    create_table :permissions do |t|
      t.string :name, null: false
      t.string :slug, null: false

      t.timestamps
    end

    add_index :permissions, :slug, unique: true
  end
end
