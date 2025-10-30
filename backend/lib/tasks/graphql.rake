namespace :graphql do
  desc "Output the GraphQL schema definition"
  task schema: :environment do
    puts BackendSchema.to_definition
  end

  desc "Update the schema.gql file"
  task update_schema: :environment do
    File.write("schema.gql", BackendSchema.to_definition)
    puts "Schema updated in schema.gql"
  end
end
