# frozen_string_literal: true

module Types
  module Inputs
    class PaginationInput < Types::BaseInputObject
      description "Input type for pagination parameters"

      argument :page, Integer, required: false, default_value: 1,
                               description: "The page number to fetch (starts at 1)"

      argument :per_page, Integer, required: false, default_value: 20,
                                   description: "Number of items per page"
    end
  end
end
