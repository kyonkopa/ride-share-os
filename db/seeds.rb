# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
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
