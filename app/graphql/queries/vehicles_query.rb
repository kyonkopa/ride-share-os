# frozen_string_literal: true

module Queries
  class VehiclesQuery < BaseQuery
    description "Get all vehicles in the system"

    type [Types::VehicleType], null: false

    def resolve
      Vehicle.all
    end
  end
end
