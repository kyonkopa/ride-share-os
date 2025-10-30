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

ActiveRecord::Schema[8.0].define(version: 2025_10_23_135216) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.index ["phone_number"], name: "index_drivers_on_phone_number", unique: true
    t.index ["user_id"], name: "index_drivers_on_user_id"
    t.index ["verified"], name: "index_drivers_on_verified"
  end

  create_table "expenses", force: :cascade do |t|
    t.bigint "driver_id"
    t.bigint "vehicle_id"
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "category", null: false
    t.date "date", null: false
    t.string "receipt_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_expenses_on_category"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["driver_id", "date"], name: "index_expenses_on_driver_id_and_date"
    t.index ["driver_id"], name: "index_expenses_on_driver_id"
    t.index ["vehicle_id", "date"], name: "index_expenses_on_vehicle_id_and_date"
    t.index ["vehicle_id"], name: "index_expenses_on_vehicle_id"
  end

  create_table "revenue_records", force: :cascade do |t|
    t.bigint "shift_assignment_id", null: false
    t.bigint "driver_id", null: false
    t.decimal "total_revenue", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "total_profit", precision: 10, scale: 2, default: "0.0", null: false
    t.boolean "reconciled", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["driver_id", "created_at"], name: "index_revenue_records_on_driver_id_and_created_at"
    t.index ["driver_id"], name: "index_revenue_records_on_driver_id"
    t.index ["reconciled"], name: "index_revenue_records_on_reconciled"
    t.index ["shift_assignment_id"], name: "index_revenue_records_on_shift_assignment_id"
  end

  create_table "shift_assignments", force: :cascade do |t|
    t.integer "city", null: false
    t.bigint "driver_id", null: false
    t.bigint "vehicle_id"
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.string "recurrence_rule"
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
    t.index ["license_plate"], name: "index_vehicles_on_license_plate", unique: true
    t.index ["telematics_source"], name: "index_vehicles_on_telematics_source"
  end

  add_foreign_key "drivers", "users"
  add_foreign_key "expenses", "drivers"
  add_foreign_key "expenses", "vehicles"
  add_foreign_key "revenue_records", "drivers"
  add_foreign_key "revenue_records", "shift_assignments"
  add_foreign_key "shift_assignments", "drivers"
  add_foreign_key "shift_assignments", "vehicles"
  add_foreign_key "shift_events", "shift_assignments"
end
