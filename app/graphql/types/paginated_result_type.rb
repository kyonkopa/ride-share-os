# frozen_string_literal: true

module Types
  class PaginatedResultType < Types::BaseObject
    description "Represents a paginated list of results"

    def self.for(type)
      @paginated_types ||= {}
      @paginated_types[type.graphql_name] ||= Class.new(self) do
        graphql_name "PaginatedResult#{type.graphql_name}"

        field :errors, [Types::ErrorType], null: false
        field :items, [type], null: false
        field :pagination, Types::PaginationType, null: false
      end
    end
  end
end
