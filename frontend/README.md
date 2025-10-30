# KED Transport Services - Driver App

A React PWA (Progressive Web App) for managing ride-sharing fleet operations, specifically designed for drivers working with Uber and Bolt.

## Features

### Shift & Clocking Epic (Current Implementation)

- **Clock In/Out System**: Complete shift management with vehicle selection, odometer tracking, and battery monitoring
- **GPS Integration**: Automatic location capture for shift start/end
- **Real-time Dashboard**: Live shift status, today's summary, and overall statistics
- **Offline Support**: Data is cached locally and syncs when connection is restored
- **PWA Ready**: Installable on mobile devices with offline capabilities

### Core Functionality

1. **Home Dashboard**

   - Current shift status
   - Quick clock-in/out buttons
   - Today's shift summary
   - Overall statistics

2. **Clock In Process**

   - Vehicle selection from fleet
   - Start odometer reading
   - Battery level recording
   - GPS location capture
   - Optional notes

3. **Clock Out Process**
   - End odometer reading
   - Final battery level
   - Revenue tracking
   - Expense recording
   - Shift summary with calculations

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **React Router** for navigation
- **Lucide React** for icons
- **PWA** capabilities with service worker

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
yarn build
```

The built files will be in the `dist` directory, ready for deployment.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── ClockInForm.tsx # Clock-in form component
│   ├── ClockOutForm.tsx # Clock-out form component
│   └── HomeScreen.tsx  # Main dashboard
├── hooks/              # Custom React hooks
│   └── useShift.ts     # Shift management logic
├── lib/                # Utility functions
│   └── utils.ts        # Common utilities
├── types/              # TypeScript type definitions
│   └── shift.ts        # Shift-related types
└── App.tsx             # Main application component
```

## User Stories Implemented

### US-3: Clock in / start shift (driver)

- ✅ Clock-in form with car ID, odometer, and battery %
- ✅ GPS location auto-filled
- ✅ System stores timestamp and driver ID
- ✅ Offline support with local caching

### US-4: Clock out / end shift (driver)

- ✅ Clock-out captures end odometer and battery %
- ✅ System computes distance driven and battery usage
- ✅ Revenue and expense tracking
- ✅ Optional notes and shift summary

## Data Storage

The app currently uses localStorage for data persistence, which provides:

- Offline functionality
- Data persistence across sessions
- Fast access to shift data

## Future Enhancements

- Backend API integration
- Real-time synchronization
- Push notifications
- Advanced reporting
- Multi-driver support
- Fleet management features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for KED Transport Services.
