require "ice_cube"

class ShiftAssignmentService
  class << self
    # Assigns shifts to a driver based on a schedule pattern
    #
    # @param driver [Driver] The driver to assign shifts to
    # @param schedule [Symbol] The schedule pattern (:daily_for_6_days_skip_1_day)
    # @param start_date [Date, nil] The start date for the schedule (optional, but required if end_date is provided)
    # @param end_date [Date, nil] The end date for the schedule (optional, but requires start_date if provided)
    # @param duration [Symbol, nil] Duration symbol (:one_month, :two_months, :three_months) for 1, 2, or 3 months (required if start_date and end_date are not provided)
    # @param city [Symbol] The city for the shifts (default: :accra)
    # @return [Array<ShiftAssignment>] Array of created shift assignments
    # @raise [StandardError] If driver is not active or assignment fails
    def assign_shifts(driver:, schedule:, start_date: nil, end_date: nil, duration: nil, city: :accra)
      validate_driver_active!(driver)

      # Calculate dates based on duration or use defaults
      start_date, end_date = calculate_dates(start_date, end_date, duration)

      occurrences = generate_schedule_occurrences(schedule, start_date, end_date)
      created_assignments = []

      occurrences.each do |occurrence_date|
        # Skip if assignment already exists for this driver and date
        next if existing_assignment?(driver, occurrence_date)

        assignment = create_shift_assignment(
          driver:,
          date: occurrence_date,
          city:
        )

        created_assignments << assignment
      end

      created_assignments
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to assign shifts: #{e.message}"
    end

    private

    def calculate_dates(start_date, end_date, duration)
      # Validate: if end_date is provided, start_date must also be provided
      if end_date && start_date.nil?
        raise StandardError, "start_date must be provided when end_date is provided"
      end

      # If both dates are not provided, duration is required
      if start_date.nil? && end_date.nil?
        raise StandardError, "Either start_date and end_date must be provided, or duration must be provided" if duration.nil?
        start_date = Date.today
        end_date = calculate_end_date_from_duration(duration)
      # If duration is provided, calculate dates from start_date or today
      elsif duration
        start_date = start_date || Date.today
        end_date = calculate_end_date_from_duration(duration)
      end

      [start_date, end_date]
    end

    def calculate_end_date_from_duration(duration)
      months = case duration
      when :one_month then 1
      when :two_months then 2
      when :three_months then 3
      else
        raise StandardError, "Unsupported duration: #{duration}. Supported values are :one_month, :two_months, :three_months"
      end

      Date.today + months.months
    end

    def validate_driver_active!(driver)
      raise StandardError, "Driver is not active" unless driver&.persisted?
      raise StandardError, "Driver is not verified" unless driver.verified?
    end

    def generate_schedule_occurrences(schedule, start_date, end_date)
      case schedule
      when :daily_for_6_days_skip_1_day
        generate_daily_schedule(start_date, end_date, 6, 1)
      when :daily_for_6_days
        # Generate 6 consecutive days without skipping
        generate_daily_schedule(start_date, end_date, 6, 0)
      else
        raise StandardError, "Unsupported schedule: #{schedule}"
      end
    end

    def generate_daily_schedule(start_date, end_date, days, skip_days)
      # Pattern: Generate occurrences for 'days' consecutive days, then skip 'skip_days' day(s), repeat until end_date
      # Example: 6 days on, 1 day off pattern
      # Special case: when skip_days is 0, generate exactly 'days' consecutive days
      occurrences = []
      current_date = start_date

      if skip_days == 0
        # Generate exactly 'days' consecutive days
        days.times do
          break if current_date > end_date
          occurrences << current_date
          current_date += 1.day
        end
      else
        # Pattern: Generate occurrences for 'days' consecutive days, then skip 'skip_days' day(s), repeat until end_date
        while current_date <= end_date
          # Generate occurrences for the specified number of days
          days.times do
            break if current_date > end_date
            occurrences << current_date
            current_date += 1.day
          end

          # Skip the specified number of days
          skip_days.times do
            break if current_date > end_date
            current_date += 1.day
          end
        end
      end

      occurrences
    end

    def existing_assignment?(driver, date)
      ShiftAssignment.exists?(
        driver:,
        start_time: date.beginning_of_day..date.end_of_day
      )
    end

    def create_shift_assignment(driver:, date:, city:)
      # Default shift times (8 AM to 9 PM)
      start_time = date.beginning_of_day + 8.hours
      end_time = date.beginning_of_day + 21.hours

      ShiftAssignment.create!(
        driver:,
        city:,
        start_time:,
        end_time:,
        status: :scheduled,
        vehicle_id: nil # Vehicle can be assigned later
      )
    end
  end
end
