# frozen_string_literal: true

class HistoricalReportService
  def self.generate_report
    yesterday = Date.yesterday
    day_before = yesterday - 1.day

    # Revenue data
    yesterday_revenue = calculate_revenue(yesterday)
    day_before_revenue = calculate_revenue(day_before)
    revenue_growth = calculate_growth(yesterday_revenue[:total], day_before_revenue[:total])

    # Expenses data
    yesterday_expenses = calculate_expenses(yesterday)
    vehicle_with_most_expenses = find_vehicle_with_most_expenses(yesterday)

    # Drivers who clocked in
    drivers_clocked_in = count_drivers_clocked_in(yesterday)

    # Total distance driven
    total_distance = calculate_total_distance(yesterday)

    # Total shift elapsed time
    total_shift_time = calculate_total_shift_time(yesterday)

    # Convert revenue_by_source hash keys to strings for JSON serialization
    revenue_by_source_strings = yesterday_revenue[:by_source].transform_keys(&:to_s)

    # Generate human-readable text
    {
      total_revenue: yesterday_revenue[:total],
      revenue_by_source: revenue_by_source_strings,
      revenue_growth_percentage: revenue_growth,
      total_expenses: yesterday_expenses,
      vehicle_with_most_expenses:,
      drivers_clocked_in:,
      total_distance_km: total_distance,
      human_readable_text: generate_human_readable_text(
        yesterday_revenue,
        day_before_revenue,
        revenue_growth,
        yesterday_expenses,
        vehicle_with_most_expenses,
        drivers_clocked_in,
        total_distance,
        total_shift_time
      )
    }
  end

  private

  def self.calculate_revenue(date)
    date_range = date.beginning_of_day..date.end_of_day
    revenue_records = RevenueRecord.where(realized_at: date_range)

    total = revenue_records.sum(:total_revenue)
    by_source = revenue_records.group(:source).sum(:total_revenue)

    { total:, by_source: }
  end

  def self.calculate_growth(current, previous)
    return 0.0 if previous.zero?

    ((current - previous) / previous * 100).round(2)
  end

  def self.calculate_expenses(date)
    expenses = Expense.where(date:)
    expenses.sum { |e| e.amount_in_decimal }
  end

  def self.find_vehicle_with_most_expenses(date)
    expenses = Expense.where(date:).includes(:vehicle)
    vehicle_expenses = expenses.group_by(&:vehicle_id).transform_values do |vehicle_expenses_list|
      vehicle_expenses_list.sum { |e| e.amount_in_decimal }
    end

    return nil if vehicle_expenses.empty?

    vehicle_id = vehicle_expenses.max_by { |_k, v| v }[0]
    vehicle = Vehicle.find_by(id: vehicle_id)
    return nil unless vehicle

    {
      id: vehicle.id,
      display_name: vehicle.display_name,
      total_expenses: vehicle_expenses[vehicle_id]
    }
  end

  def self.count_drivers_clocked_in(date)
    date_range = date.beginning_of_day..date.end_of_day
    ShiftEvent.where(event_type: :clock_in, created_at: date_range)
              .joins(shift_assignment: :driver)
              .select("DISTINCT drivers.id")
              .count
  end

  def self.calculate_total_distance(date)
    date_range = date.beginning_of_day..date.end_of_day
    shift_assignments = ShiftAssignment.where(start_time: date_range)

    total_distance = 0

    shift_assignments.each do |shift|
      clock_in_event = shift.shift_events.find_by(event_type: :clock_in)
      clock_out_event = shift.shift_events.find_by(event_type: :clock_out)

      next unless clock_in_event&.odometer && clock_out_event&.odometer

      distance = clock_out_event.odometer - clock_in_event.odometer
      total_distance += distance if distance.positive?
    end

    # Convert to kilometers (assuming odometer is in km)
    total_distance
  end

  def self.calculate_total_shift_time(date)
    date_range = date.beginning_of_day..date.end_of_day
    shift_assignments = ShiftAssignment.where(start_time: date_range)

    total_seconds = 0

    shift_assignments.each do |shift|
      clock_in_event = shift.shift_events.find_by(event_type: :clock_in)
      clock_out_event = shift.shift_events.find_by(event_type: :clock_out)

      next unless clock_in_event && clock_out_event

      elapsed_time = clock_out_event.created_at - clock_in_event.created_at
      total_seconds += elapsed_time if elapsed_time.positive?
    end

    total_seconds
  end

  def self.generate_human_readable_text(
    yesterday_revenue,
    day_before_revenue,
    revenue_growth,
    total_expenses,
    vehicle_with_most_expenses,
    drivers_clocked_in,
    total_distance,
    total_shift_time
  )
    revenue_text = format_revenue_text(yesterday_revenue, revenue_growth)
    expenses_text = format_expenses_text(total_expenses, vehicle_with_most_expenses)
    drivers_text = format_drivers_text(drivers_clocked_in)
    distance_text = format_distance_text(total_distance)
    shift_time_text = format_shift_time_text(total_shift_time)

    "#{revenue_text} #{expenses_text} #{drivers_text} #{distance_text} #{shift_time_text}"
  end

  def self.format_revenue_text(revenue_data, growth)
    total = revenue_data[:total]
    by_source = revenue_data[:by_source]

    if by_source.empty?
      growth_text = growth.positive? ? "an increase" : growth.negative? ? "a decrease" : "no change"
      growth_text += " of #{growth.abs.round(2)}%" unless growth.zero?
      return "Total revenue was GHS #{format_currency(total)} with #{growth_text} compared to the previous day."
    end

    # Calculate percentages
    source_percentages = by_source.transform_values { |v| ((v / total) * 100).round(2) }
    source_breakdown = source_percentages.map do |source, percentage|
      source_name = source.to_s.humanize
      "#{source_name} (#{percentage}%)"
    end.join(", ")

    growth_text = if growth.positive?
      "an increase of #{growth.round(2)}%"
    elsif growth.negative?
      "a decrease of #{growth.abs.round(2)}%"
    else
      "no change"
    end

    "Total revenue was GHS #{format_currency(total)} with #{growth_text} compared to the previous day, with revenue breakdown: #{source_breakdown}."
  end

  def self.format_expenses_text(total_expenses, vehicle_with_most_expenses)
    if vehicle_with_most_expenses
      "Total expenses were GHS #{format_currency(total_expenses)}, with #{vehicle_with_most_expenses[:display_name]} having the highest expenses at GHS #{format_currency(vehicle_with_most_expenses[:total_expenses])}."
    else
      "Total expenses were GHS #{format_currency(total_expenses)}."
    end
  end

  def self.format_drivers_text(drivers_clocked_in)
    if drivers_clocked_in.zero?
      "No drivers clocked in."
    else
      "#{drivers_clocked_in} #{drivers_clocked_in == 1 ? 'driver' : 'drivers'} clocked in."
    end
  end

  def self.format_distance_text(total_distance)
    "A total of #{total_distance} km was driven across all vehicles."
  end

  def self.format_shift_time_text(total_seconds)
    return "No shift time was recorded." if total_seconds.zero?

    hours = (total_seconds / 3600).floor
    minutes = ((total_seconds % 3600) / 60).floor

    if hours.positive? && minutes.positive?
      "A combined total of #{hours} #{hours == 1 ? 'hour' : 'hours'} and #{minutes} #{minutes == 1 ? 'minute' : 'minutes'} was worked across all shifts."
    elsif hours.positive?
      "A combined total of #{hours} #{hours == 1 ? 'hour' : 'hours'} was worked across all shifts."
    else
      "A combined total of #{minutes} #{minutes == 1 ? 'minute' : 'minutes'} was worked across all shifts."
    end
  end

  def self.format_currency(amount)
    format("%.2f", amount)
  end
end
