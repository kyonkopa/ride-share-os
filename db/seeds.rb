# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#

# Seed permissions
permissions_data = [
  { name: "View Drivers", slug: "driver_read_access" },
  { name: "Manage Drivers", slug: "driver_write_access" },
  { name: "View Vehicles", slug: "vehicle_read_access" },
  { name: "Manage Vehicles", slug: "vehicle_write_access" },
  { name: "View Shifts", slug: "shift_read_access" },
  { name: "Manage Shifts", slug: "shift_write_access" },
  { name: "View Revenue", slug: "revenue_read_access" },
  { name: "Manage Revenue", slug: "revenue_write_access" },
  { name: "View Expenses", slug: "expense_read_access" },
  { name: "Manage Expenses", slug: "expense_write_access" },
  { name: "View Users", slug: "user_read_access" },
  { name: "Manage Users", slug: "user_write_access" }
]

permissions_data.each do |permission_data|
  Permission.find_or_create_by!(slug: permission_data[:slug]) do |p|
    p.name = permission_data[:name]
  end
end

vehicles = JSON.parse(File.read("db/data/vehicles.json"))
vehicles.each do |vehicle_data|
  vehicle = Vehicle.find_or_create_by!(license_plate: vehicle_data["licensePlate"]) do |v|
    v.make = vehicle_data["make"]
    v.model = vehicle_data["model"]
    v.year_of_manufacture = vehicle_data["year"]
    v.telematics_source = :gps_tracker
  end

  # Set image path if provided and not already set
  if vehicle_data["imagePath"] && vehicle.vehicle_image_path.blank?
    # Store relative path from public directory (e.g., "images/vehicles/filename.webp")
    public_image_path = File.join("images", "vehicles", vehicle_data["imagePath"])
    full_public_path = File.join(Rails.root, "public", public_image_path)

    if File.exist?(full_public_path)
      vehicle.update(vehicle_image_path: public_image_path)
    end
  end
end

puts "Database seeded successfully!"
