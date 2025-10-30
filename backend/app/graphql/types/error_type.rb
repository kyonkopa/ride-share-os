module Types
  class ErrorType < Types::BaseObject
    description "Represents an error in the system"

    field :code, String, null: true
    field :field, String, null: true
    field :message, String, null: false
  end
end
