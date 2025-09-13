# Quiet Hours Scheduler

A focused study time management application that helps users schedule quiet study blocks with automated email reminders. Built with Next.js, Supabase, and Gmail SMTP.

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase Auth
- 📅 **Study Block Management** - Create and manage focused study sessions
- ⏰ **Email Reminders** - Automatic email notifications 10 minutes before study blocks
- 🚫 **Overlap Prevention** - Prevents scheduling conflicts for the same user
- 🌍 **IST Timezone Support** - All times stored and displayed in Indian Standard Time
- 📱 **Responsive Design** - Clean, modern UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom fonts
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Supabase Auth
- **Email Service**: Gmail SMTP via Nodemailer
- **Deployment**: Vercel with CRON jobs
- **Timezone**: IST (Indian Standard Time)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account
- A Gmail account with App Password
- A Vercel account (for deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/quiet-hours-scheduler.git
cd quiet-hours-scheduler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings → API

#### 3.2 Set Up Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `setup-database-complete.sql`
3. Click "Run" to create tables, policies, and functions

#### 3.3 Enable Email Authentication

1. Go to Authentication → Settings in Supabase Dashboard
2. Enable "Email" provider
3. Configure email settings (optional for development)

### 4. Set Up Gmail SMTP

#### 4.1 Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

#### 4.2 Generate App Password

1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Generate a new app password for "Mail"
4. Save this password (you'll need it for environment variables)

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CRON Security (for production)
CRON_SECRET=your_random_secret_key

# Gmail SMTP Configuration
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
quiet-hours-scheduler/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── cron/          # CRON job for email reminders
│   │   ├── create/            # Create study block page
│   │   ├── dashboard/         # Main dashboard
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   └── globals.css        # Global styles
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   └── lib/
│       ├── supabaseClient.ts  # Supabase client configuration
│       └── emailGmail.ts      # Gmail SMTP email service
├── setup-database-complete.sql # Database setup script
├── vercel.json                # Vercel deployment configuration
└── package.json
```

## Database Schema

### Tables

#### `profiles`
- `id` (UUID, Primary Key) - References auth.users
- `email` (Text) - User's email address
- `full_name` (Text) - User's full name
- `avatar_url` (Text) - User's avatar URL
- `created_at` (Timestamptz) - Creation timestamp
- `updated_at` (Timestamptz) - Last update timestamp

#### `quiet_blocks`
- `id` (UUID, Primary Key) - Unique block identifier
- `user_id` (UUID, Foreign Key) - References auth.users
- `title` (Text) - Study block title
- `start_time` (Timestamptz) - Block start time (IST)
- `end_time` (Timestamptz) - Block end time (IST)
- `is_active` (Boolean) - Whether block is currently active
- `reminder_sent` (Boolean) - Whether email reminder was sent
- `created_at` (Timestamptz) - Creation timestamp
- `updated_at` (Timestamptz) - Last update timestamp

### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

- **SELECT**: Users can view their own records
- **INSERT**: Users can create records for themselves
- **UPDATE**: Users can modify their own records
- **DELETE**: Users can delete their own records

## Features in Detail

### 1. User Authentication

- **Sign Up**: Users can create accounts with email/password
- **Sign In**: Secure authentication with Supabase Auth
- **Profile Management**: Automatic profile creation on signup
- **Session Management**: Persistent sessions across browser refreshes

### 2. Study Block Management

- **Create Blocks**: Simple form with title, start time, and end time
- **IST Timezone**: All times stored and displayed in Indian Standard Time
- **Overlap Prevention**: Prevents scheduling conflicts for the same user
- **Auto-cleanup**: Expired blocks are automatically deactivated

### 3. Email Reminders

- **Automatic Scheduling**: CRON job runs every 5 minutes
- **10-minute Reminders**: Emails sent 10 minutes before block starts
- **Gmail SMTP**: Reliable email delivery via Gmail
- **No Duplicates**: Each block gets only one reminder

### 4. Dashboard

- **Active Blocks**: Shows only current and upcoming study blocks
- **Status Indicators**: Visual indicators for block status (upcoming, active, completed)
- **Real-time Updates**: Refresh button for manual updates
- **Clean Interface**: Minimal, focused design

## Deployment

### Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

2. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local` file

3. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Set up external CRON service (see CRON-SETUP-GUIDE.md)

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_random_secret
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

## CRON Job Configuration

The application uses external CRON services for email reminders:

- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Endpoint**: `/api/cron`
- **Service**: cron-job.org (free) or UptimeRobot
- **Functionality**: Sends reminders 10 minutes before study blocks

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**:
   - Ensure you've run the database setup script
   - Check that RLS policies are properly created

2. **Email Not Sending**:
   - Verify Gmail SMTP credentials
   - Check if 2FA is enabled and app password is correct
   - Ensure CRON_SECRET is set in production

3. **Authentication Issues**:
   - Verify Supabase environment variables
   - Check if email authentication is enabled in Supabase

4. **Timezone Issues**:
   - All times are stored in IST (+05:30)
   - Ensure your system timezone is correct

### Development vs Production

- **Development**: CRON jobs don't run automatically
- **Production**: CRON jobs run every 5 minutes automatically
- **Testing**: Use manual CRON endpoint calls for testing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the Supabase and Vercel documentation
3. Open an issue on GitHub

---

**Happy Studying! 📚✨**