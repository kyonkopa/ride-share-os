class RemoveGoogleFieldsFromUsers < ActiveRecord::Migration[8.0]
  def change
    # Remove indexes first
    remove_index :users, :google_id if index_exists?(:users, :google_id)
    remove_index :users, :uid if index_exists?(:users, :uid)
    remove_index :users, [:provider, :uid] if index_exists?(:users, [:provider, :uid])
    
    # Remove columns
    remove_column :users, :google_id, :string
    remove_column :users, :provider, :string
    remove_column :users, :uid, :string
    remove_column :users, :avatar_url, :string
  end
end
