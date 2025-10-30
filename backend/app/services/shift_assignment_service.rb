require 'ice_cube'

class ShiftAssignmentService
  class << self
    # Assigns shifts to a driver based on a schedule pattern
    #
    # @param driver [Driver] The driver to assign shifts to
    # @param schedule [Symbol] The schedule pattern (:daily_for_6_days)
    # @param start_date [Date] The start date for the schedule
    # @param end_date [Date] The end date for the schedule
    # @param city [Symbol] The city for the shifts (default: :accra)
    # @return [Array<ShiftAssignment>] Array of created shift assignments
    # @raise [StandardError] If driver is not active or assignment fails
    def assign_shifts(driver:, schedule:, start_date:, end_date:, city: :accra)
      validate_driver_active!(driver)
      
      occurrences = generate_schedule_occurrences(schedule, start_date, end_date)
      created_assignments = []
      
      occurrences.each do |occurrence_date|
        # Skip if assignment already exists for this driver and date
        next if existing_assignment?(driver, occurrence_date)
        
        assignment = create_shift_assignment(
          driver: driver,
          date: occurrence_date,
          city: city
        )
        
        created_assignments << assignment
      end
      
      created_assignments
    rescue ActiveRecord::RecordInvalid => e
      raise StandardError, "Failed to assign shifts: #{e.message}"
    end

    private

    def validate_driver_active!(driver)
      raise StandardError, "Driver is not active" unless driver&.persisted?
      raise StandardError, "Driver is not verified" unless driver.verified?
    end

    def generate_schedule_occurrences(schedule, start_date, end_date)
      case schedule
      when :daily_for_6_days
        generate_daily_schedule(start_date, 6)
      else
        raise StandardError, "Unsupported schedule: #{schedule}"
      end
    end

    def generate_daily_schedule(start_date, days)
      schedule = IceCube::Schedule.new(start_date) do |s|
        s.add_recurrence_rule IceCube::Rule.daily.count(days)
      end
      
      schedule.occurrences(start_date + days.days).map(&:to_date)
    end

    def existing_assignment?(driver, date)
      ShiftAssignment.exists?(
        driver: driver,
        start_time: date.beginning_of_day..date.end_of_day
      )
    end

    def create_shift_assignment(driver:, date:, city:)
      # Default shift times (8 AM to 5 PM)
      start_time = date.beginning_of_day + 8.hours
      end_time = date.beginning_of_day + 17.hours
      
      ShiftAssignment.create!(
        driver: driver,
        city: city,
        start_time: start_time,
        end_time: end_time,
        status: :scheduled,
        vehicle_id: nil # Vehicle can be assigned later
      )
    end
  end
end
