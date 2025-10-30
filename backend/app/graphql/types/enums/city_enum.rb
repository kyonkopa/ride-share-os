# frozen_string_literal: true

module Types
  module Enums
    class CityEnum < Types::BaseEnum
      description "The possible cities for shift assignments"

      value "accra", value: "accra", description: "Accra"
      value "kumasi", value: "kumasi", description: "Kumasi"
      value "takoradi", value: "takoradi", description: "Takoradi"
    end
  end
end
