# frozen_string_literal: true

class BackendSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader

  # GraphQL-Ruby calls this when something goes wrong while running a query:
  def self.type_error(err, context)
    # if err.is_a?(GraphQL::InvalidNullError)
    #   # report to your bug tracker here
    #   return nil
    # end
    super
  end

  # Union and Interface Resolution
  def self.resolve_type(type_definition, obj, ctx)
    return nil if obj.nil?

    type_definition
  end

  # Limit the size of incoming queries:
  max_query_string_tokens(5000)

  # Stop validating when it encounters this many errors:
  validate_max_errors(100)

  # Limit query complexity and depth:
  max_complexity(200)
  max_depth(15)

  # Relay-style Object Identification:

  # Return a string UUID for `object`
  def self.id_from_object(object, type_definition, query_ctx)
    # For example, use Rails' GlobalID library (https://github.com/rails/globalid):
    object.to_gid_param
  end

  # Given a string UUID, find the object
  def self.object_from_id(global_id, query_ctx)
    error_message = "An error occurred while fetching the record"

    record = AppGlobalId.record_from_global_id(global_id)
    raise GraphQL::ExecutionError.new(error_message) if record.nil?

    record
  rescue ActiveRecord::RecordNotFound
    raise GraphQL::ExecutionError.new(error_message)
  end
end
