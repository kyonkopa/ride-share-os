# frozen_string_literal: true

# rubocop:disable GraphQL/ObjectDescription
module Extensions
  class PaginationExtension < GraphQL::Schema::FieldExtension
    extras [:owner]
  end
end
# rubocop:enable GraphQL/ObjectDescription
