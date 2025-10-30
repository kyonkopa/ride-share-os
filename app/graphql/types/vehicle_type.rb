module Types
  class VehicleType < Types::BaseObject
    include Types::Concerns::BaseActiveRecordFields

    description "A vehicle in the system"

    field :latest_odometer, Integer, null: false
    field :latest_range, Integer, null: false
    field :license_plate, String, null: false
    field :make, String, null: false
    field :model, String, null: false
    field :telematics_source, Integer, null: false
    field :year_of_manufacture, Integer, null: false
    field :display_name, String, null: false
   
    def display_name
      "#{object.make} #{object.model} #{object.license_plate}"
    end

    # Associations
    field :expenses, [Types::ExpenseType], null: true
    field :shift_assignments, [Types::ShiftAssignmentType], null: true
  end
end
