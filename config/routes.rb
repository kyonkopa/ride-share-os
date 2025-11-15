Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Root route - serve the frontend SPA
  root to: 'static#index'

  # Catch-all route to serve the frontend SPA for any route that doesn't match above routes
  # This ensures client-side routes work when users reload the page
  # Must be last route - matches any GET request that doesn't match above routes
  get '*path', to: 'static#index', constraints: lambda { |req|
    # Exclude API routes
    return false if req.path.start_with?('/graphql') || req.path.start_with?('/up')
    
    # Exclude requests for static assets (files with extensions)
    # Static files should be served by Rails static file server if they exist
    return false if req.path.match?(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|xml|txt|pdf|zip|map|webp)$/i)
    
    # Match all other GET requests (SPA routes like /revenue, /vehicles, etc.)
    # Note: We don't check for XHR here because browser navigation requests
    # (like when reloading /revenue) are regular GET requests, not XHR
    true
  }
end
