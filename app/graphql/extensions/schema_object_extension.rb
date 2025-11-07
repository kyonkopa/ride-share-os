# frozen_string_literal: true

module Extensions
  module SchemaObjectExtension
    def pagination_field(name, type, **kwargs, &block)
      field name, Types::PaginatedResultType.for(type), **kwargs do
        extension Extensions::PaginationExtension
        argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"
        instance_eval(&block) if block_given?
      end
    end
  end
end
