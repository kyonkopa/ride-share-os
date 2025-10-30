namespace :annotate do
  desc "Add schema information to model files"
  task models: :environment do
    puts "Annotating models..."

    Dir.glob("app/models/*.rb").each do |file|
      model_name = File.basename(file, ".rb").camelize
      klass = model_name.constantize rescue nil

      next unless klass && klass < ActiveRecord::Base && klass.table_name.present?

      puts "Annotating #{model_name}..."

      # Get schema information
      info = "# == Schema Information\n"
      info << "#\n"
      info << "# Table name: #{klass.table_name}\n"
      info << "#\n"

      # Get column information
      columns = klass.columns
      columns.each do |column|
        info << "#  #{column.name.ljust(20)} :#{column.type.to_s.ljust(15)}"
        info << " not null" if !column.null
        info << " primary key" if column.name == klass.primary_key
        info << " default(#{column.default})" if column.default
        info << "\n"
      end

      info << "#\n"

      # Get indexes
      indexes = klass.connection.indexes(klass.table_name)
      if indexes.any?
        info << "# Indexes\n"
        info << "#\n"
        indexes.each do |index|
          info << "#  index_#{index.name.ljust(30)} (#{index.columns.join(', ')})"
          info << " UNIQUE" if index.unique
          info << "\n"
        end
        info << "#\n"
      end

      # Get foreign keys
      foreign_keys = klass.connection.foreign_keys(klass.table_name)
      if foreign_keys.any?
        info << "# Foreign Keys\n"
        info << "#\n"
        foreign_keys.each do |fk|
          info << "#  fk_rails_...  (#{fk.column} => #{fk.to_table}.#{fk.primary_key})\n"
        end
        info << "#\n"
      end

      # Read current file
      content = File.read(file)

      # Remove existing schema info
      content = content.gsub(/# == Schema Information.*?(?=\nclass|\nmodule|\n\z)/m, "")

      # Add new schema info at the top
      content = info + content

      # Write back to file
      File.write(file, content)

      puts "✓ Annotated #{model_name}"
    end

    puts "Done annotating models!"
  end
end

# Alias for the original task name
task annotate_models: "annotate:models"

# Run annotate:models after every migration
Rake::Task["db:migrate"].enhance do
  Rake::Task["annotate:models"].invoke
end

Rake::Task["db:rollback"].enhance do
  Rake::Task["annotate:models"].invoke
end
