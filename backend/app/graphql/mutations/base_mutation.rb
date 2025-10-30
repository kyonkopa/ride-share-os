# frozen_string_literal: true

module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    class MutationError < GraphQL::ExecutionError
      attr_reader :field, :code

      def initialize(message, field: nil, code: nil)
        super(message)
        @field = field
        @code = code
      end

      def to_h
        super.merge("extensions" => { "code" => @code, "field" => @field }.compact)
      end
    end

    class ValidationError < GraphQL::ExecutionError
      def initialize(record)
        super("Validation failed")
        @record = record
      end

      def to_h
        super.merge("extensions" => { "code" => "VALIDATION_ERROR", "errors" => validation_errors })
      end

      private

      def validation_errors
        @record.errors.map do |error|
          {
            message: error.full_message,
            field: error.attribute.to_s,
            code: error.type.to_s
          }
        end
      end
    end

    include ::Authenticatable

    argument_class Types::BaseArgument
    field_class Types::BaseField
    object_class Types::BaseObject

    field :errors, [Types::ErrorType], null: false, description: "An array of error messages"

    # Class-level configuration for transaction behavior
    class_attribute :use_transaction, default: true
    class_attribute :log_errors, default: true

    def self.skip_transaction!
      self.use_transaction = false
    end

    def self.skip_error_logging!
      self.log_errors = false
    end

    def resolve(**args)
      clear_errors!

      result = if use_transaction?
        ActiveRecord::Base.transaction do
          execute(**args)
        end
      else
        execute(**args)
      end

      serialize_with_errors(result)
    rescue MutationError => e
      log_error(e) if log_errors?
      errors_array << build_error_hash(e.message, e.field, e.code)
      serialize_with_errors({})
    rescue ActiveRecord::RecordInvalid => e
      log_error(e) if log_errors?
      serialize_with_errors(validation_error_response(e.record))
    rescue StandardError => e
      log_error(e) if log_errors?
      handle_unexpected_error(e)
    end

    def execute(**args)
      raise NotImplementedError, "Subclasses must implement this method"
    end

    # Error handling methods
    def error(message, field: nil, code: nil)
      # Silently adds an error, so execution can continue normally
      errors_array << build_error_hash(message, field, code)
      nil
    end

    def error!(message, field: nil, code: nil)
      raise MutationError.new(message, field:, code:)
    end

    def add_validation_error(record)
      record.errors.each do |error|
        errors_array << build_error_hash(
          error.full_message,
          error.attribute.to_s,
          error.type.to_s
        )
      end
    end

    # Response building methods
    def empty_response
      {}
    end

    # Rate limiting helpers
    def check_rate_limit!(key, limit: 10, window: 1.hour)
      return unless rate_limit_exceeded?(key, limit, window)
      error!("Rate limit exceeded. Please try again later.", code: "RATE_LIMITED")
    end

    private

    def use_transaction?
      self.class.use_transaction
    end

    def log_errors?
      self.class.log_errors
    end

    def clear_errors!
      @_errors = []
    end

    def build_error_hash(message, field, code)
      {
        message:,
        field:,
        code:
      }.compact
    end

    def validation_error_response(record)
      add_validation_error(record)
      {}
    end

    def serialize_with_errors(payload)
      {
        **payload,
        errors: errors_array
      }
    end

    def errors_array
      @_errors ||= []
    end

    def log_error(error)
      Rails.logger.error("Mutation Error: #{error.class.name} - #{error.message}")
      Rails.logger.error(error.backtrace.join("\n")) if Rails.env.development?
    end

    def handle_unexpected_error(error)
      if Rails.env.production? || Rails.env.staging?
        # In production, don't expose internal errors
        error!("An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR")
        serialize_with_errors({})
      else
        # In development, show the actual error
        raise GraphQL::ExecutionError, "#{error.class.name}: #{error.message}"
      end
    end


    def rate_limit_exceeded?(key, limit, window)
      # Simple in-memory rate limiting - in production, use Redis or similar
      cache_key = "rate_limit:#{key}:#{current_user&.id || 'anonymous'}"
      current_count = Rails.cache.read(cache_key) || 0

      if current_count >= limit
        true
      else
        Rails.cache.write(cache_key, current_count + 1, expires_in: window)
        false
      end
    end
  end
end
