# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Queries::GroupedExpensesQuery do
  let(:user) { create(:user, :confirmed, :with_driver) }
  let(:driver) { user.driver }
  let(:vehicle1) { create(:vehicle, make: "Toyota", model: "Camry", license_plate: "ABC-123") }
  let(:vehicle2) { create(:vehicle, make: "Honda", model: "Accord", license_plate: "XYZ-789") }

  let(:query) do
    <<~GQL
      query GroupedExpenses(
        $startDate: ISO8601Date
        $endDate: ISO8601Date
        $pagination: PaginationInput!
        $driverId: String
        $vehicleId: String
        $category: String
      ) {
        groupedExpenses(
          startDate: $startDate
          endDate: $endDate
          pagination: $pagination
          driverId: $driverId
          vehicleId: $vehicleId
          category: $category
        ) {
          items {
            vehicleId
            vehicleName
            date
            totalAmount
            expenseCount
            expenses {
              id
              globalId
              amount
              category
              date
            }
          }
          pagination {
            currentPage
            pageCount
            totalSize
            pageSize
          }
          totalAmount
          categoryTotals
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
      pagination: pagination
    }
  end

  let(:context) { { current_user: user } }

  describe 'when expenses exist within the date range' do
    let!(:expense1) do
      create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day, amount: 5000, category: "charging")
    end
    let!(:expense2) do
      create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day, amount: 3000, category: "maintenance")
    end
    let!(:expense3) do
      create(:expense, vehicle: vehicle2, user: user, date: start_date + 2.days, amount: 4000, category: "toll")
    end

    before do
      # Create expenses outside range to verify they're excluded
      create(:expense, vehicle: vehicle1, user: user, date: start_date - 1.day)
      create(:expense, vehicle: vehicle1, user: user, date: end_date + 1.day)
    end

    it 'returns grouped expenses within the date range' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(2) # Two groups: vehicle1 on day1, vehicle2 on day2

          # Check first group (vehicle1, start_date + 1.day)
          group1 = items.find { |g| g["vehicleId"] == vehicle1.id.to_s }
          expect(group1).to be_present
          expect(group1["vehicleName"]).to eq("Toyota Camry ABC-123")
          expect(group1["date"]).to eq((start_date + 1.day).iso8601)
          expect(group1["expenseCount"]).to eq(2)
          expect(group1["totalAmount"]).to eq(80.0) # (5000 + 3000) / 100
          expect(group1["expenses"].length).to eq(2)

          # Check second group (vehicle2, start_date + 2.days)
          group2 = items.find { |g| g["vehicleId"] == vehicle2.id.to_s }
          expect(group2).to be_present
          expect(group2["vehicleName"]).to eq("Honda Accord XYZ-789")
          expect(group2["date"]).to eq((start_date + 2.days).iso8601)
          expect(group2["expenseCount"]).to eq(1)
          expect(group2["totalAmount"]).to eq(40.0) # 4000 / 100
        end
    end

    it 'returns correct total amount' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["totalAmount"]).to eq(120.0) # (5000 + 3000 + 4000) / 100
        end
    end

    it 'returns correct category totals' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          category_totals = result["categoryTotals"]
          expect(category_totals["charging"]).to eq(50.0)
          expect(category_totals["maintenance"]).to eq(30.0)
          expect(category_totals["toll"]).to eq(40.0)
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
  end

  describe 'filtering by vehicle_id' do
    let!(:expense1) { create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day) }
    let!(:expense2) { create(:expense, vehicle: vehicle2, user: user, date: start_date + 1.day) }

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination: pagination,
        vehicleId: vehicle1.global_id
      }
    end

    it 'returns only expenses for the specified vehicle' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(1)
          expect(items.first["vehicleId"]).to eq(vehicle1.id.to_s)
        end
    end
  end

  describe 'filtering by category' do
    let!(:expense1) { create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day, category: "charging") }
    let!(:expense2) { create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day, category: "maintenance") }
    let!(:expense3) { create(:expense, vehicle: vehicle1, user: user, date: start_date + 2.days, category: "charging") }

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination: pagination,
        category: "charging"
      }
    end

    it 'returns only expenses with the specified category' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          # Should have 2 groups (same vehicle, different dates)
          expect(items.length).to eq(2)
          # All expenses should be charging
          items.each do |group|
            group["expenses"].each do |expense|
              expect(expense["category"]).to eq("charging")
            end
          end
        end
    end
  end

  describe 'filtering by driver_id' do
    let(:other_user) { create(:user, :confirmed, :with_driver) }
    let(:other_driver) { other_user.driver }

    let!(:expense1) { create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day, category: "charging") }
    let!(:expense2) { create(:expense, vehicle: vehicle1, user: other_user, date: start_date + 1.day, category: "maintenance") }

    let(:variables) do
      {
        startDate: start_date.iso8601,
        endDate: end_date.iso8601,
        pagination: pagination,
        driverId: driver.global_id
      }
    end

    it 'returns only expenses for the specified driver' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          expect(items.length).to eq(1)
          expect(items.first["expenses"].length).to eq(1)
          expect(items.first["expenses"].first["id"]).to eq(expense1.global_id)
        end
    end
  end

  describe 'when no expenses exist in the date range' do
    before do
      create(:expense, vehicle: vehicle1, user: user, date: start_date - 1.day)
      create(:expense, vehicle: vehicle1, user: user, date: end_date + 1.day)
    end

    it 'returns empty items array' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          expect(result["items"]).to be_empty
          expect(result["totalAmount"]).to eq(0.0)
          expect(result["categoryTotals"]).to eq({})
        end
    end
  end

  describe 'pagination' do
    before do
      # Create 15 expenses across different dates to test pagination
      15.times do |i|
        create(:expense, vehicle: vehicle1, user: user, date: start_date + i.days)
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
        pagination: pagination
      }
    end

    before do
      create(:expense, vehicle: vehicle1, user: user, date: Date.current - 30.days)
      create(:expense, vehicle: vehicle1, user: user, date: Date.current)
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
      create(:expense, vehicle: vehicle1, user: user, date: start_date + 1.day)
    end

    it 'returns an authentication error' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_errors(["Authentication is required"])
    end
  end

  describe 'expenses without vehicle' do
    let!(:expense_without_vehicle) do
      create(:expense, :with_user, user: user, vehicle: nil, date: start_date + 1.day)
    end

    it 'groups expenses without vehicle correctly' do
      expect(query).to execute_as_graphql
        .with_variables(variables)
        .with_context(context)
        .with_no_errors
        .with_effects do |result, _full_result|
          items = result["items"]
          no_vehicle_group = items.find { |g| g["vehicleId"] == "no-vehicle" }
          expect(no_vehicle_group).to be_present
          expect(no_vehicle_group["vehicleName"]).to eq("No Vehicle")
        end
    end
  end
end

