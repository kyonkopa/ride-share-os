class CreateScheduledTrips < ActiveRecord::Migration[8.0]
  def change
    create_table :scheduled_trips do |t|
      t.string :client_name, null: false
      t.string :client_email, null: false
      t.string :client_phone, null: false
      t.string :pickup_location, null: false
      t.string :dropoff_location, null: false
      t.datetime :pickup_datetime, null: false
      t.jsonb :recurrence_config, default: {}
      t.decimal :price, precision: 10, scale: 2
      t.integer :state, default: 0, null: false
      t.string :acceptance_token, null: false
      t.string :decline_token, null: false
      t.bigint :reviewed_by_id
      t.datetime :reviewed_at
      t.text :notes

      t.timestamps
    end

    add_index :scheduled_trips, :state
    add_index :scheduled_trips, :pickup_datetime
    add_index :scheduled_trips, :acceptance_token, unique: true
    add_index :scheduled_trips, :decline_token, unique: true
    add_index :scheduled_trips, :client_email
    add_index :scheduled_trips, :reviewed_by_id
    add_foreign_key :scheduled_trips, :users, column: :reviewed_by_id
  end
end
