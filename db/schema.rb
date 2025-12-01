# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_11_29_224841) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "charging_stations", force: :cascade do |t|
    t.string "name", null: false
    t.decimal "location_lat", precision: 10, scale: 6, null: false
    t.decimal "location_lon", precision: 10, scale: 6, null: false
    t.json "connectors", default: [], null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["location_lat", "location_lon"], name: "index_charging_stations_on_location_lat_and_location_lon"
    t.index ["status"], name: "index_charging_stations_on_status"
  end

  create_table "drivers", force: :cascade do |t|
    t.string "full_name", null: false
    t.date "dob", null: false
    t.string "phone_number", null: false
    t.boolean "verified", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "tier", default: "tier_1", null: false
    t.index ["phone_number"], name: "index_drivers_on_phone_number", unique: true
    t.index ["user_id"], name: "index_drivers_on_user_id"
    t.index ["verified"], name: "index_drivers_on_verified"
  end

  create_table "expenses", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "vehicle_id"
    t.string "category", null: false
    t.date "date", null: false
    t.string "receipt_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "amount", null: false
    t.string "description"
    t.index ["category"], name: "index_expenses_on_category"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["user_id", "date"], name: "index_expenses_on_user_id_and_date"
    t.index ["user_id"], name: "index_expenses_on_user_id"
    t.index ["vehicle_id", "date"], name: "index_expenses_on_vehicle_id_and_date"
    t.index ["vehicle_id"], name: "index_expenses_on_vehicle_id"
  end

  create_table "permissions", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_permissions_on_slug", unique: true
  end

  create_table "revenue_records", force: :cascade do |t|
    t.bigint "shift_assignment_id", null: false
    t.bigint "driver_id", null: false
    t.decimal "total_revenue", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "total_profit", precision: 10, scale: 2, default: "0.0", null: false
    t.boolean "reconciled", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "source", default: 0, null: false
    t.bigint "vehicle_id"
    t.index ["driver_id", "created_at"], name: "index_revenue_records_on_driver_id_and_created_at"
    t.index ["driver_id"], name: "index_revenue_records_on_driver_id"
    t.index ["reconciled"], name: "index_revenue_records_on_reconciled"
    t.index ["shift_assignment_id"], name: "index_revenue_records_on_shift_assignment_id"
    t.index ["source"], name: "index_revenue_records_on_source"
    t.index ["vehicle_id"], name: "index_revenue_records_on_vehicle_id"
  end

  create_table "scheduled_trip_audit_logs", force: :cascade do |t|
    t.bigint "scheduled_trip_id", null: false
    t.string "previous_state"
    t.string "new_state", null: false
    t.bigint "changed_by_id"
    t.string "change_reason"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["changed_by_id"], name: "index_scheduled_trip_audit_logs_on_changed_by_id"
    t.index ["created_at"], name: "index_scheduled_trip_audit_logs_on_created_at"
    t.index ["scheduled_trip_id"], name: "index_scheduled_trip_audit_logs_on_scheduled_trip_id"
  end

  create_table "scheduled_trips", force: :cascade do |t|
    t.string "client_name", null: false
    t.string "client_email", null: false
    t.string "client_phone", null: false
    t.string "pickup_location", null: false
    t.string "dropoff_location", null: false
    t.datetime "pickup_datetime", null: false
    t.jsonb "recurrence_config", default: {}
    t.decimal "price", precision: 10, scale: 2
    t.string "acceptance_token", null: false
    t.string "decline_token", null: false
    t.bigint "reviewed_by_id"
    t.datetime "reviewed_at"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "state", default: "pending", null: false
    t.bigint "driver_id"
    t.index ["acceptance_token"], name: "index_scheduled_trips_on_acceptance_token", unique: true
    t.index ["client_email"], name: "index_scheduled_trips_on_client_email"
    t.index ["decline_token"], name: "index_scheduled_trips_on_decline_token", unique: true
    t.index ["driver_id"], name: "index_scheduled_trips_on_driver_id"
    t.index ["pickup_datetime"], name: "index_scheduled_trips_on_pickup_datetime"
    t.index ["reviewed_by_id"], name: "index_scheduled_trips_on_reviewed_by_id"
    t.index ["state"], name: "index_scheduled_trips_on_state"
  end

  create_table "shift_assignments", force: :cascade do |t|
    t.integer "city", null: false
    t.bigint "driver_id", null: false
    t.bigint "vehicle_id"
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city"], name: "index_shift_assignments_on_city"
    t.index ["driver_id", "start_time"], name: "index_shift_assignments_on_driver_id_and_start_time"
    t.index ["driver_id"], name: "index_shift_assignments_on_driver_id"
    t.index ["start_time"], name: "index_shift_assignments_on_start_time"
    t.index ["status"], name: "index_shift_assignments_on_status"
    t.index ["vehicle_id", "start_time"], name: "index_shift_assignments_on_vehicle_id_and_start_time"
    t.index ["vehicle_id"], name: "index_shift_assignments_on_vehicle_id"
  end

  create_table "shift_events", force: :cascade do |t|
    t.bigint "shift_assignment_id", null: false
    t.integer "event_type", null: false
    t.integer "odometer"
    t.integer "vehicle_range"
    t.decimal "gps_lat", precision: 10, scale: 6
    t.decimal "gps_lon", precision: 10, scale: 6
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_type"], name: "index_shift_events_on_event_type"
    t.index ["shift_assignment_id"], name: "index_shift_events_on_shift_assignment_id"
  end

  create_table "user_permissions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "permission_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["permission_id"], name: "index_user_permissions_on_permission_id"
    t.index ["user_id", "permission_id"], name: "index_user_permissions_on_user_id_and_permission_id", unique: true
    t.index ["user_id"], name: "index_user_permissions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.datetime "last_sign_in_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.datetime "deleted_at"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "vehicles", force: :cascade do |t|
    t.string "license_plate", null: false
    t.string "model", null: false
    t.integer "year_of_manufacture", null: false
    t.integer "latest_odometer", default: 0, null: false
    t.integer "latest_range", default: 0, null: false
    t.integer "telematics_source", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "make", null: false
    t.string "vehicle_image_path"
    t.index ["license_plate"], name: "index_vehicles_on_license_plate", unique: true
    t.index ["telematics_source"], name: "index_vehicles_on_telematics_source"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "drivers", "users"
  add_foreign_key "expenses", "users"
  add_foreign_key "expenses", "vehicles"
  add_foreign_key "revenue_records", "drivers"
  add_foreign_key "revenue_records", "shift_assignments"
  add_foreign_key "revenue_records", "vehicles"
  add_foreign_key "scheduled_trip_audit_logs", "scheduled_trips"
  add_foreign_key "scheduled_trip_audit_logs", "users", column: "changed_by_id"
  add_foreign_key "scheduled_trips", "drivers"
  add_foreign_key "scheduled_trips", "users", column: "reviewed_by_id"
  add_foreign_key "shift_assignments", "drivers"
  add_foreign_key "shift_assignments", "vehicles"
  add_foreign_key "shift_events", "shift_assignments"
  add_foreign_key "user_permissions", "permissions"
  add_foreign_key "user_permissions", "users"
end
