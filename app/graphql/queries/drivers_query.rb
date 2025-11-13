# frozen_string_literal: true

module Queries
  class DriversQuery < BaseQuery
    description "Get all drivers in the system"

    type [Types::DriverType], null: false

    def resolve
      Driver.all.order(:full_name)
    end
  end
end
