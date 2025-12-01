# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::GroupedRevenueRecordsQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:other_user) { create(:user, :confirmed, :with_driver) }
  let(:other_driver) { other_user.driver }
  let(:toyota_camry) { create(:vehicle, make: "Toyota", model: "Camry", license_plate: "ABC-123") }
  let(:honda_accord) { create(:vehicle, make: "Honda", model: "Accord", license_plate: "XYZ-789") }
  let(:toyota_shift_assignment) { create(:shift_assignment, driver:, vehicle: toyota_camry) }
  let(:honda_shift_assignment) { create(:shift_assignment, driver:, vehicle: honda_accord) }
  let(:other_shift_assignment) { create(:shift_assignment, driver: other_driver, vehicle: toyota_camry) }

  let(:query) do
    <<~GQL
      query GroupedRevenueRecords(
        $startDate: ISO8601Date
        $endDate: ISO8601Date
        $pagination: PaginationInput!
        $driverId: String
        $vehicleId: String
        $source: String
      ) {
        groupedRevenueRecords(
          startDate: $startDate
          endDate: $endDate
          pagination: $pagination
          driverId: $driverId
          vehicleId: $vehicleId
          source: $source
        ) {
          items {
            driverId
            driverName
            date
            totalRevenue
            totalProfit
            allReconciled
            revenueCount
            vehicleName
            sourceBreakdown
            revenueRecords {
              id
              globalId
              totalRevenue
              totalProfit
              source
              reconciled
            }
          }
          pagination {
            currentPage
            pageCount
            totalSize
            pageSize
          }
          totalRevenue
          totalProfit
          sourceTotals
        }
      }
    GQL
  end

  let(:start_date) { Date.current - 7.days }
  let(:end_date) { Date.current }
  let(:pagination) { { page: 1, perPage: 10 } }

  let(:variables) do
    {
      startDate: start_date.iso8601,
      endDate: end_date.iso8601,
      pagination:
    }
  end

  let(:context) { { current_user: user } }

  describe 'when revenue records exist within the date range' do
    let!(:record1) do
      create(
        :revenue_record, :bolt, shift_assignment: toyota_shift_assignment, driver:,
                                total_revenue: 100.0, total_profit: 80.0,
                                created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, :uber, shift_assignment: toyota_shift_assignment, driver:,
                                total_revenue: 150.0, total_profit: 120.0,
                                created_at: start_date + 1.day
)
    end
    let!(:record3) do
      create(
        :revenue_record, :bolt, shift_assignment: honda_shift_assignment, driver:,
                                total_revenue: 200.0, total_profit: 160.0,
                                created_at: start_date + 2.days
)
    end

    before do
      # Create records outside range to verify they're excluded
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date - 1.day
)
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: end_date + 1.day
)
    end

    it 'returns grouped revenue records within the date range' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(2) # Two groups: driver on day1, driver on day2

          # Check first group (driver, start_date + 1.day)
          group1 = items.find { |g| g["date"] == (start_date + 1.day).iso8601 }
          expect(group1).to be_present
          expect(group1["driverId"]).to eq(driver.global_id)
          expect(group1["driverName"]).to eq(driver.full_name)
          expect(group1["revenueCount"]).to eq(2)
          expect(group1["totalRevenue"]).to eq(250.0) # 100 + 150
          expect(group1["totalProfit"]).to eq(200.0) # 80 + 120
          expect(group1["revenueRecords"].length).to eq(2)

          # Check second group (driver, start_date + 2.days)
          group2 = items.find { |g| g["date"] == (start_date + 2.days).iso8601 }
          expect(group2).to be_present
          expect(group2["revenueCount"]).to eq(1)
          expect(group2["totalRevenue"]).to eq(200.0)
          expect(group2["totalProfit"]).to eq(160.0)
        end
    end

    it 'returns correct total revenue and profit' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["totalRevenue"]).to eq(450.0) # 100 + 150 + 200
          expect(result["totalProfit"]).to eq(360.0) # 80 + 120 + 160
        end
    end

    it 'returns correct source totals' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          source_totals = result["sourceTotals"]
          expect(source_totals["bolt"]["revenue"]).to eq(300.0) # 100 + 200
          expect(source_totals["bolt"]["profit"]).to eq(240.0) # 80 + 160
          expect(source_totals["uber"]["revenue"]).to eq(150.0)
          expect(source_totals["uber"]["profit"]).to eq(120.0)
        end
    end

    it 'returns correct pagination metadata' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          pagination = result["pagination"]
          expect(pagination["currentPage"]).to eq(1)
          expect(pagination["totalSize"]).to eq(2)
          expect(pagination["pageSize"]).to eq(10)
          expect(pagination["pageCount"]).to eq(1)
        end
    end

    it 'returns correct source breakdown for each group' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          group1 = result["items"].find { |g| g["date"] == (start_date + 1.day).iso8601 }
          source_breakdown = group1["sourceBreakdown"]
          expect(source_breakdown["bolt"]["revenue"]).to eq(100.0)
          expect(source_breakdown["uber"]["revenue"]).to eq(150.0)
        end
    end

    it 'returns correct allReconciled status' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          group1 = result["items"].find { |g| g["date"] == (start_date + 1.day).iso8601 }
          expect(group1["allReconciled"]).to be false # Both records are not reconciled
        end
    end
  end

  describe 'filtering by driver_id' do
    let!(:record1) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, shift_assignment: other_shift_assignment, driver: other_driver,
                         created_at: start_date + 1.day
)
    end

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination:,
        driverId: driver.global_id
      }
    end

    it 'returns only revenue records for the specified driver' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(1)
          expect(items.first["driverId"]).to eq(driver.global_id)
          expect(items.first["revenueRecords"].length).to eq(1)
        end
    end
  end

  describe 'filtering by vehicle_id' do
    let!(:record1) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, shift_assignment: honda_shift_assignment, driver:,
                         created_at: start_date + 1.day
)
    end

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination:,
        vehicleId: toyota_camry.global_id
      }
    end

    it 'returns only revenue records for the specified vehicle' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(1)
          expect(items.first["vehicleName"]).to eq("Toyota Camry ABC-123")
          expect(items.first["revenueRecords"].length).to eq(1)
        end
    end
  end

  describe 'filtering by source' do
    let!(:record1) do
      create(
        :revenue_record, :bolt, shift_assignment: toyota_shift_assignment, driver:,
                                created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, :uber, shift_assignment: toyota_shift_assignment, driver:,
                                created_at: start_date + 1.day
)
    end
    let!(:record3) do
      create(
        :revenue_record, source: :off_trip, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date + 1.day
)
    end

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination:,
        source: "bolt"
      }
    end

    it 'returns only revenue records with the specified source' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(1)
          items.each do |group|
            group["revenueRecords"].each do |record|
              expect(record["source"]).to eq("bolt")
            end
          end
        end
    end
  end

  describe 'when no revenue records exist in the date range' do
    before do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date - 1.day
)
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: end_date + 1.day
)
    end

    it 'returns empty items array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["items"]).to be_empty
          expect(result["totalRevenue"]).to eq(0.0)
          expect(result["totalProfit"]).to eq(0.0)
          expect(result["sourceTotals"]).to eq({})
        end
    end
  end

  describe 'pagination' do
    before do
      # Create 15 revenue records across different dates to test pagination
      # Use off_trip source to avoid uniqueness validation (only bolt/uber have uniqueness constraint)
      15.times do |i|
        create(
          :revenue_record, source: :off_trip, shift_assignment: toyota_shift_assignment, driver:,
                           created_at: start_date + i.days
)
      end
    end

    let(:pagination) { { page: 1, perPage: 5 } }

    it 'returns paginated results' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["items"].length).to eq(5)
          expect(result["pagination"]["totalSize"]).to eq(15)
          expect(result["pagination"]["pageCount"]).to eq(3)
        end
    end

    context 'when requesting second page' do
      let(:pagination) { { page: 2, perPage: 5 } }

      it 'returns second page of results' do
        expect(query).to execute_as_graphql
          .with_variables(variables)
          .with_context(context)
          .with_no_errors
          .with_effects do |result, _full_result|
            expect(result["items"].length).to eq(5)
            expect(result["pagination"]["currentPage"]).to eq(2)
          end
      end
    end
  end

  describe 'when no date filters are provided' do
    let(:variables) do
      {
        pagination:
      }
    end

    before do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: Date.current - 30.days
)
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: Date.current
)
    end

    it 'uses default date range (epoch to current date)' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["items"].length).to be >= 1
        end
    end
  end

  describe 'when user is not authenticated' do
    let(:context) { {} }

    before do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         created_at: start_date + 1.day
)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end

  describe 'allReconciled status' do
    let!(:record1) do
      create(
        :revenue_record, :reconciled, shift_assignment: toyota_shift_assignment, driver:,
                                      created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, :reconciled, shift_assignment: toyota_shift_assignment, driver:,
                                      created_at: start_date + 1.day
)
    end

    it 'returns true when all records are reconciled' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          group = result["items"].first
          expect(group["allReconciled"]).to be true
        end
    end
  end

  describe 'vehicle name from shift assignment' do
    let!(:record) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         vehicle: nil, # No direct vehicle association
                         created_at: start_date + 1.day
)
    end

    it 'uses vehicle from shift assignment when record has no vehicle' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          group = result["items"].first
          expect(group["vehicleName"]).to eq("Toyota Camry ABC-123")
        end
    end
  end

  describe 'sorting' do
    let!(:record1) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         total_revenue: 100.0,
                         created_at: start_date + 1.day
)
    end
    let!(:record2) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         total_revenue: 200.0,
                         created_at: start_date + 2.days
)
    end
    let!(:record3) do
      create(
        :revenue_record, shift_assignment: toyota_shift_assignment, driver:,
                         total_revenue: 150.0,
                         created_at: start_date + 3.days
)
    end

    it 'sorts groups by date descending' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          dates = items.map { |i| Date.parse(i["date"]) }
          expect(dates).to eq(dates.sort.reverse)
        end
    end
  end
end
