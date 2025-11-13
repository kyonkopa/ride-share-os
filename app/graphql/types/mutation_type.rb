# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :clock_in, mutation: Mutations::ClockIn
    field :clock_out, mutation: Mutations::ClockOut
    field :create_expense, mutation: Mutations::CreateExpense
    field :create_revenue_record, mutation: Mutations::CreateRevenueRecord
    field :create_session, mutation: Mutations::CreateSession
    field :pause_shift, mutation: Mutations::PauseShift
    field :resume_shift, mutation: Mutations::ResumeShift
    field :update_vehicle, mutation: Mutations::UpdateVehicle
  end
end
