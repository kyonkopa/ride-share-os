# frozen_string_literal: true

module Resolvers
  class BaseResolver < GraphQL::Schema::Resolver
    include ::Authenticatable

    class << self
      def resolve_with_method(method_name)
        define_method(:scope) do
          send(method_name)
        end
      end
    end

    def scope(args)
      raise NotImplementedError, "Subclass must implement #scope"
    end

    def resolve(**args)
      build_scope(args)
    end

    def build_scope(args)
      initial_scope = scope(**args.except(:pagination))
      applied_filters = apply_filters(initial_scope, args[:filter]) if args[:filter]
      result = applied_filters || initial_scope
      build_query_result(result, args)
    end

    def build_query_result(scope, args)
      results = scope

      if pagination_field?
        results = {
          items: paginate(scope, args[:pagination]),
          errors: [],
          pagination: build_pagination(scope, args[:pagination])
        }
      end

      results
    end

    def pagination_field?
      arguments.key?(:pagination)
    end

    def apply_filters(scope, filter)
      _scope = scope
      # get filter object fields and apply them to the scope
      filter.to_h.each do |key, value|
        filter_method = "apply_#{key}_filter"
        _scope = send(filter_method, _scope, value) if respond_to?(filter_method)
      end

      _scope
    end

    def paginate(scope, pagination_input)
      scope.page(pagination_input.page).per(pagination_input.per_page)
    end

    def build_pagination(scope, pagination_input)
      page = pagination_input.page
      per_page = pagination_input.per_page
      total_count = scope.size
      total_pages = (total_count.to_f / per_page).ceil
      current_page = page
      next_page = current_page < total_pages ? current_page + 1 : nil
      prev_page = current_page > 1 ? current_page - 1 : nil
      first_page = current_page == 1
      last_page = current_page == total_pages
      page_count = total_pages
      total_size = total_count
      page_size = per_page

      {
        current_page:,
        next_page:,
        prev_page:,
        first_page:,
        last_page:,
        page_count:,
        total_size:,
        page_size:
      }
    end
  end
end
