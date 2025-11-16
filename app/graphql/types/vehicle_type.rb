module Types
  class VehicleType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A vehicle in the system"

    field :display_name, String, null: false
    field :expenses, [Types::ExpenseType], null: true
    field :in_use, Boolean, null: false, method: :in_use?
    field :latest_odometer, Integer, null: false
    field :latest_range, Integer, null: false
    field :license_plate, String, null: false
    field :make, String, null: false
    field :model, String, null: false
    field :shift_assignments, [Types::ShiftAssignmentType], null: true
    field :telematics_source, Integer, null: false
    field :vehicle_image_url, String, null: true
    field :year_of_manufacture, Integer, null: false

    def vehicle_image_url
      return nil if object.vehicle_image_path.blank?
      # Return relative path from public directory
      object.vehicle_image_path.start_with?("/") ? object.vehicle_image_path : "/#{object.vehicle_image_path}"
    end
  end
end
