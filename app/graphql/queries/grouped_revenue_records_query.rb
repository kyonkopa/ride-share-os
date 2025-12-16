# frozen_string_literal: true

module Queries
  class GroupedRevenueRecordsQuery < Resolvers::BaseResolver
    description "Get revenue records grouped by driver and date within a date range"

    argument :driver_id, String, required: false, description: "Optional driver global ID to filter revenue records"
    argument :end_date, GraphQL::Types::ISO8601Date, required: false, description: "End date for the date range"
    argument :pagination, Types::Inputs::PaginationInput, required: true, description: "Pagination options"
    argument :source, String, required: false, description: "Optional source to filter revenue records"
    argument :start_date, GraphQL::Types::ISO8601Date, required: false, description: "Start date for the date range"
    argument :vehicle_id, String, required: false, description: "Optional vehicle global ID to filter revenue records"

    type Types::GroupedRevenueRecordsResultType, null: false

    def resolve(start_date: nil, end_date: nil, pagination:, driver_id: nil, vehicle_id: nil, source: nil)
      start_date ||= Date.new(1970, 1, 1) # Epoch start
      end_date ||= Date.current

      revenue_records = RevenueRecord
                        .includes(:driver, :vehicle, :shift_assignment)
                        .where(realized_at: start_date.beginning_of_day..end_date.end_of_day)

      # Filter by driver if driver_id is provided
      if driver_id.present?
        driver = Driver.find_by_global_id(driver_id)
        if driver
          revenue_records = revenue_records.where(driver_id: driver.id)
        else
          # If driver not found, return empty result
          revenue_records = revenue_records.none
        end
      end

      if vehicle_id.present?
        vehicle = Vehicle.find_by_global_id(vehicle_id)
        if vehicle
          revenue_records = revenue_records.where(vehicle_id: vehicle.id)
        else
          revenue_records = revenue_records.none
        end
      end

      if source.present?
        revenue_records = revenue_records.where(source:)
      end

      # Calculate totals using RevenueService
      grouped_revenue_total = RevenueService.aggregate_revenue(
        start_date:,
        end_date:,
        driver_id:
      )
      grouped_profit_total = revenue_records.sum(:total_profit).to_f

      # Group by source - calculate totals
      source_totals = {}
      revenue_records.each do |record|
        source_key = record.source
        if source_totals[source_key].nil?
          source_totals[source_key] = { revenue: 0.0, profit: 0.0 }
        end
        source_totals[source_key][:revenue] += record.total_revenue.to_f
        source_totals[source_key][:profit] += record.total_profit.to_f
      end

      # Group revenue records by driver_id and date
      grouped_revenue_records = revenue_records.group_by do |record|
        driver_id = record.driver.global_id || "no-driver"
        # Use realized_at date for grouping
        date = record.realized_at.to_date
        [driver_id, date]
      end

      # Build group objects
      groups = grouped_revenue_records.map do |(driver_id, date), record_list|
        driver = record_list.first.driver
        driver_name = driver&.full_name || "No Driver"

        # Calculate totals
        total_revenue = record_list.sum { |r| r.total_revenue.to_f }
        total_profit = record_list.sum { |r| r.total_profit.to_f }
        all_reconciled = record_list.all?(&:reconciled)

        # Build source breakdown
        source_breakdown = {}
        record_list.each do |record|
          source_key = record.source
          if source_breakdown[source_key].nil?
            source_breakdown[source_key] = {
              revenue: 0.0,
              profit: 0.0,
              reconciled: false
            }
          end
          source_breakdown[source_key][:revenue] += record.total_revenue.to_f
          source_breakdown[source_key][:profit] += record.total_profit.to_f
          source_breakdown[source_key][:reconciled] &&= record.reconciled
        end

        # Get vehicle name (prefer from record, fallback to shift_assignment)
        vehicle = record_list.first.vehicle || record_list.first.shift_assignment&.vehicle
        vehicle_name = vehicle&.display_name

        {
          driver_id:,
          driver_name:,
          date:,
          total_revenue:,
          total_profit:,
          all_reconciled:,
          revenue_count: record_list.size,
          vehicle_name:,
          source_breakdown: source_breakdown.transform_keys(&:to_s),
          revenue_records: record_list.sort_by { |r| [-r.realized_at.to_i] }
        }
      end

      # Sort groups by date descending, then by driver name, then by total revenue
      sorted_groups = groups.sort_by do |group|
        [-group[:date].to_time.to_i, group[:driver_name], -group[:total_revenue]]
      end

      # Paginate groups
      page = pagination.page
      per_page = pagination.per_page
      start_index = (page - 1) * per_page
      end_index = start_index + per_page - 1
      paginated_items = sorted_groups[start_index..end_index] || []

      # Build pagination metadata
      total_count = sorted_groups.size
      total_pages = (total_count.to_f / per_page).ceil
      current_page = page
      next_page = current_page < total_pages ? current_page + 1 : nil
      prev_page = current_page > 1 ? current_page - 1 : nil
      first_page = current_page == 1
      last_page = current_page == total_pages

      {
        items: paginated_items,
        errors: [],
        pagination: {
          current_page:,
          next_page:,
          prev_page:,
          first_page:,
          last_page:,
          page_count: total_pages,
          total_size: total_count,
          page_size: per_page
        },
        total_revenue: grouped_revenue_total.to_f,
        total_profit: grouped_profit_total,
        source_totals: source_totals.transform_keys(&:to_s)
      }
    end
  end
end
