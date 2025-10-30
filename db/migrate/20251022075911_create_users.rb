class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :google_id, null: false
      t.string :avatar_url
      t.string :provider, default: 'google_oauth2', null: false
      t.string :uid, null: false
      t.datetime :last_sign_in_at
      t.integer :sign_in_count, default: 0, null: false

      t.timestamps
    end
    
    add_index :users, :email, unique: true
    add_index :users, :google_id, unique: true
    add_index :users, :uid, unique: true
    add_index :users, [:provider, :uid], unique: true
  end
end
