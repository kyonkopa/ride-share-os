# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :clock_in, mutation: Mutations::ClockIn
    field :clock_out, mutation: Mutations::ClockOut
    field :create_session, mutation: Mutations::CreateSession
    field :update_vehicle, mutation: Mutations::UpdateVehicle
  end
end
