# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
vehicles = JSON.parse(File.read("db/data/vehicles.json"))
vehicles.each do |vehicle|
  Vehicle.find_or_create_by!(license_plate: vehicle["licensePlate"]) do |v|
    v.make = vehicle["make"]
    v.model = vehicle["model"]
    v.year_of_manufacture = vehicle["year"]
    v.telematics_source = :gps_tracker
  end
end

puts "Database seeded successfully!"
