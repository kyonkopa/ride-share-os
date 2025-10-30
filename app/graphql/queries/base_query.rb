module Queries
  class BaseQuery < GraphQL::Schema::Resolver
    include ::Authenticatable
  end
end
