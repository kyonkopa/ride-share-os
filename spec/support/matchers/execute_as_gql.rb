# frozen_string_literal: true

RSpec::Matchers.define :execute_as_graphql do
  match do |query|
    @query = query
    # set_whodunnit

    @result = BackendSchema.execute(@query, variables: @variables, context: @context)
    # reset_whodunnit

    log_results if @log_results

    @errors = @result["errors"]
    query_key = @result["data"]&.keys&.first
    @failures = []

    validate_errors
    validate_result(query_key) if @failures.empty?
    validate_mutation_error(query_key) if @failures.empty?
    run_side_effects if @side_effects_expectation && @failures.empty?

    @failures.empty?
  end

  failure_message do |_|
    "Expected the GraphQL query to:\n\n#{@failures.join("\n\n")}"
  end

  failure_message_when_negated do |_|
    if @expected_errors.empty?
      "Expected errors, but none were found."
    else
      "Expected no errors matching '#{@expected_errors.join(', ')}', but found #{@errors}."
    end
  end

  chain(:with_no_errors) { @expected_errors = nil }
  chain(:with_errors) { |errors| @expected_errors = errors }
  chain(:with_variables) { |variables| @variables = variables }
  chain(:with_context) { |context| @context = context }
  chain(:and_return) do |expected|
    if expected.nil?
      @expected_nil_result = true
    else
      @expected_result = stringify(expected)
    end
  end
  chain(:with_no_mutation_errors) { @expected_no_mutation_error = true }
  chain(:with_mutation_error) { |error| @expected_mutation_error = error }
  chain(:with_effects) { |&block| @side_effects_expectation = block }
  chain(:with_authorization_errors) { |*errors| @expected_errors = errors }
  chain(:and_log_results) { @log_results = true }

  match_when_negated do |_|
    return @errors.present? if @negated
    return @errors.blank? if @expected_errors.empty?

    !errors_match?
  end

  private

  def set_whodunnit
    # PaperTrail.request.whodunnit = @context[:current_user]&.id || "Public User"
  end

  def reset_whodunnit
    # PaperTrail.request.whodunnit = nil
  end

  def log_results
    pp @result
  end

  def validate_errors
    if @expected_errors
      unless errors_match?
        @failures << (@errors.blank? ?
          "Expected errors '#{@expected_errors}', but none found." :
          "Expected errors: #{@expected_errors} but got: #{@errors}")
        @failures << differ.diff_as_string(@errors.pretty_inspect, @expected_errors.pretty_inspect)
      end
    elsif @errors.present?
      @failures << "Expected no errors, but found: #{@errors}"
    end
  end

  def validate_result(query_key)
    return unless @expected_result || @expected_nil_result

    actual_result = stringify(@result.dig("data", query_key))

    if @expected_nil_result
      return if actual_result.nil?

      @failures << "Expected nil result, but got:\n#{actual_result}"
      return
    end

    return if deep_match?(@expected_result, actual_result)

    @failures << "Expected return data matching '#{@expected_result}', but got:\n#{actual_result}"
    @failures << differ.diff_as_string(actual_result.pretty_inspect, @expected_result.pretty_inspect)
  end

  def validate_mutation_error(query_key)
    data = @result.dig("data", query_key)
    return unless data.is_a?(Hash) && data.key?("errors")

    actual_errors = data["errors"]

    if @expected_no_mutation_error && actual_errors.present?
      @failures << "Expected no mutation error, but got:\n#{actual_errors}"
    elsif @expected_mutation_error
      if actual_errors.nil?
        @failures << "Expected mutation error '#{@expected_mutation_error}', but got nil instead."
      elsif !deep_match?(@expected_mutation_error, actual_errors)
        @failures << "Expected mutation error '#{@expected_mutation_error}', but got '#{actual_errors}' instead."
        @failures << differ.diff_as_string(actual_errors.pretty_inspect, @expected_mutation_error.pretty_inspect)
      end
    end
  end

  def errors_match?
    return false if @errors.nil? || @expected_errors.nil?
    @errors.any? { |error| @expected_errors.any? { |expected| error["message"].include?(expected.to_s) } }
  end

  def stringify(obj)
    return obj.deep_stringify_keys if obj.is_a?(Hash)
    return obj.map { |el| stringify(el) } if obj.is_a?(Array)

    obj
  end

  def deep_match?(expected, actual)
    case expected
    when Hash
      return false unless actual.is_a?(Hash)

      expected.all? { |k, v| deep_match?(v, actual[k.to_s]) }
    when Array
      return false unless actual.is_a?(Array)

      # For arrays, check if all expected items match any actual item (order-independent)
      # This allows for flexible matching of error arrays
      if expected.first.is_a?(Hash) && actual.first.is_a?(Hash)
        # For arrays of hashes (like error arrays), check if all expected items are present
        expected.all? do |expected_item|
          actual.any? { |actual_item| deep_match?(expected_item, actual_item) }
        end && actual.length == expected.length
      else
        # For other arrays, check order-dependent matching
        expected.each_with_index.all? { |v, i| deep_match?(v, actual[i]) }
      end
    when Regexp
      expected.match?(actual.to_s)
    when RSpec::Matchers::BuiltIn::Match
      expected.matches?(actual)
    else
      expected == actual
    end
  end

  def run_side_effects
    query_key = @result["data"]&.keys&.first
    result_data = query_key ? @result.dig("data", query_key) : nil

    # Support both old style (no params) and new style (with params)
    if @side_effects_expectation.arity == 0
      @side_effects_expectation.call
    else
      @side_effects_expectation.call(result_data, @result)
    end
  rescue RSpec::Expectations::ExpectationNotMetError => e
    @failures << "Expected side effects but got:\n#{e.message}"
  end

  def differ
    RSpec::Support::Differ.new(color: RSpec::Matchers.configuration.color?)
  end
end
