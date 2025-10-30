# Heroku Deployment Guide

This guide explains how to deploy the KED Transport Services OS application to Heroku.

## Prerequisites

1. Heroku CLI installed
2. Git repository
3. Heroku account

## Deployment Steps

### 1. Create Heroku App

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini
```

### 2. Set Environment Variables

```bash
# Set Rails master key (get this from your Rails credentials)
heroku config:set RAILS_MASTER_KEY=your_master_key_here

# Set any other environment variables
heroku config:set NODE_ENV=production
heroku config:set RAILS_ENV=production
```

### 3. Deploy

```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/your-app-name.git

# Deploy to Heroku
git push heroku main
```

### 4. Run Database Migrations

```bash
# Run migrations
heroku run rails db:migrate

# Seed database (optional)
heroku run rails db:seed
```

### 5. Open Your App

```bash
# Open the app in your browser
heroku open
```

## Build Process

The deployment process automatically:

1. Installs Node.js dependencies
2. Builds the React frontend
3. Installs Ruby dependencies
4. Runs database migrations
5. Starts the Rails server

## Configuration

- Frontend is served from `/` and all routes
- API endpoints are available at `/graphql`
- Health check is available at `/up`
- Static files are served from the frontend build directory

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are properly installed
2. **Database errors**: Ensure PostgreSQL addon is added and migrations are run
3. **CORS errors**: Check CORS configuration in `backend/config/initializers/cors.rb`
4. **Static files not loading**: Ensure frontend build completed successfully

### Logs

```bash
# View application logs
heroku logs --tail

# View specific process logs
heroku logs --tail --dyno=web
```

## Environment Variables

Required environment variables:

- `RAILS_MASTER_KEY`: Rails credentials master key
- `DATABASE_URL`: Automatically set by Heroku PostgreSQL addon
- `RAILS_ENV`: Set to "production"
- `NODE_ENV`: Set to "production"

Optional environment variables:

- `RAILS_LOG_LEVEL`: Log level (default: "info")
- `PORT`: Port number (automatically set by Heroku)
