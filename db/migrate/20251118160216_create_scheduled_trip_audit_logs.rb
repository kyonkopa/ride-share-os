class CreateScheduledTripAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :scheduled_trip_audit_logs do |t|
      t.bigint :scheduled_trip_id, null: false
      t.string :previous_state
      t.string :new_state, null: false
      t.bigint :changed_by_id
      t.string :change_reason
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :scheduled_trip_audit_logs, :scheduled_trip_id
    add_index :scheduled_trip_audit_logs, :created_at
    add_index :scheduled_trip_audit_logs, :changed_by_id
    add_foreign_key :scheduled_trip_audit_logs, :scheduled_trips, column: :scheduled_trip_id
    add_foreign_key :scheduled_trip_audit_logs, :users, column: :changed_by_id
  end
end
