# frozen_string_literal: true

module Types
  module Enums
    class RevenueSourceEnum < Types::BaseEnum
      description "The possible sources for revenue records"

      value "bolt", value: "bolt", description: "Bolt"
      value "uber", value: "uber", description: "Uber"
      value "off_trip", value: "off_trip", description: "Off trip"
    end
  end
end
