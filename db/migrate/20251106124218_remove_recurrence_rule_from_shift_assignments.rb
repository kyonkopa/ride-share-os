class RemoveRecurrenceRuleFromShiftAssignments < ActiveRecord::Migration[8.0]
  def change
    remove_column :shift_assignments, :recurrence_rule, :string
  end
end
