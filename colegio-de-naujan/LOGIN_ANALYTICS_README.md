# Real-Time Login Analytics Feature

## Overview
A real-time dashboard on the admin login page that displays the number of users logging into the system, divided by department. This feature is only visible to admin users.

## Features Implemented

### 1. **Login Tracking System**
- Automatically records every login with:
  - Department information
  - Username
  - Timestamp
  - User's local time
- Stores up to 200 recent login records in localStorage

### 2. **Real-Time Analytics Dashboard**
Located at: [`src/components/Dashboard/LoginAnalytics.jsx`](src/components/Dashboard/LoginAnalytics.jsx)

Features include:
- **Live Statistics Cards**
  - Total logins in current session
  - Number of departments
  - Real-time status indicator

- **Multiple Chart Views**
  - **Bar Chart**: Shows total logins per department
  - **Line Chart**: Displays login timeline (last 60 minutes)
  - **Pie Chart**: Shows department distribution with percentages

- **Recent Logins Table**
  - Last 10 login entries
  - Department badge with color coding
  - Username and timestamp

- **Auto-Refresh**
  - Updates every 2 seconds for real-time data

### 3. **Department Support**
The system tracks logins for these departments:
- BSIS
- BTVTED-WFT
- BTVTED-CHS
- WFT
- Admin

### 4. **User Accounts for Testing**
Added new test accounts with department info:

```
Admin Account:
  Username: admin
  Password: bsis2026
  Department: Admin

Student Accounts:
  Username: bsis      | Password: cdn2026  | Department: BSIS
  Username: wft       | Password: cdn2026  | Department: BTVTED-WFT
  Username: chs       | Password: cdn2026  | Department: BTVTED-CHS
```

## Files Modified/Created

### New Files:
1. **[`src/components/Dashboard/LoginAnalytics.jsx`](src/components/Dashboard/LoginAnalytics.jsx)**
   - Main analytics component with charts and real-time data
   - Exports `recordLogin()` function for tracking

2. **[`src/styles/login-analytics.css`](src/styles/login-analytics.css)**
   - Complete styling for the analytics dashboard
   - Responsive design for mobile and desktop
   - Modern UI matching the existing design system

### Modified Files:
1. **[`src/components/Login/Login.jsx`](src/components/Login/Login.jsx)**
   - Added department tracking to user accounts
   - Calls `recordLogin()` on successful authentication
   - Stores user info including department in localStorage

2. **[`src/components/Dashboard/AccountPage.jsx`](src/components/Dashboard/AccountPage.jsx)**
   - Imports and displays `LoginAnalytics` component
   - Only shows analytics to admin users (role-based access control)

### Dependencies Added:
- **recharts** (v0.0.0): For creating beautiful, responsive charts

## How to Use

### For Admins:
1. Log in with admin credentials:
   - Username: `admin`
   - Password: `bsis2026`

2. Navigate to "Account" section
3. Scroll down to see "Live Login Analytics" dashboard
4. Switch between chart types using the buttons
5. Watch real-time updates as new users log in

### To Test:
1. Open the app in multiple browser windows/tabs
2. Log in with different user accounts (bsis, wft, chs)
3. Admin can see all logins in real-time on the analytics dashboard
4. The charts update automatically every 2 seconds

## Data Storage
Login analytics are stored in localStorage:
- Key: `cdn_login_analytics`
- Format: JSON with login records and department counts
- Max records: 200 (older records are removed)

## Technical Details

### Real-Time Updates
- Uses `setInterval` to poll localStorage every 2 seconds
- No backend required - all data stored client-side
- Persists across page refreshes

### Responsive Design
- Desktop: Multi-column grid layout
- Tablet: Single column with adjusted spacing
- Mobile: Optimized for small screens

### Security
- Only accessible to admin users
- No sensitive data exposed
- Department tracking is non-invasive

## Future Enhancements
- Export analytics to CSV/PDF
- Date range filtering
- Hourly/daily/weekly statistics
- Department-specific admin views
- Backend integration for persistent data storage
- Graph animations on data updates
