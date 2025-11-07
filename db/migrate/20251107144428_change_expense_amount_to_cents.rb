class ChangeExpenseAmountToCents < ActiveRecord::Migration[8.0]
  def up
    # Convert existing decimal amounts to cents (integer)
    # Multiply by 100 and round to nearest integer
    # Use a temporary column to avoid type conflicts
    add_column :expenses, :amount_cents, :integer
    
    execute <<-SQL
      UPDATE expenses
      SET amount_cents = ROUND(amount * 100)::integer
    SQL
    
    # Remove old column and rename new one
    remove_column :expenses, :amount
    rename_column :expenses, :amount_cents, :amount
    
    # Add not null constraint
    change_column_null :expenses, :amount, false
  end

  def down
    # Convert cents back to dollars
    # Use a temporary column to avoid type conflicts
    add_column :expenses, :amount_decimal, :decimal, precision: 10, scale: 2
    
    execute <<-SQL
      UPDATE expenses
      SET amount_decimal = amount / 100.0
    SQL
    
    # Remove old column and rename new one
    remove_column :expenses, :amount
    rename_column :expenses, :amount_decimal, :amount
    
    # Add not null constraint
    change_column_null :expenses, :amount, false
  end
end
