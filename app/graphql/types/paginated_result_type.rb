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

  class PaginationType < Types::BaseObject
    description "Represents pagination metadata for a result set"

    field :current_page, Int, null: false, description: "Current page"
    field :first_page, Boolean, null: false, description: "Is this the first page?"
    field :last_page, Boolean, null: false, description: "Is this the last page?"
    field :next_page, Int, null: true, description: "Next page"
    field :page_count, Int, null: true, description: "Number of pages available"
    field :page_size, Int, null: false, description: "Number of items per page" # rubocop:disable GraphQL/ExtractType
    field :prev_page, Int, null: true, description: "Previous page"
    field :total_size, Int, null: false, description: "Total size of items that match this query"
  end
end
