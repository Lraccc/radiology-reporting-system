# Hospital Radiology Image/Video Management System

A comprehensive web application for managing radiological images, videos, and diagnostic reports. This system replaces the manual process of emailing images through Gmail and typing reports in Microsoft Word with a unified, secure, and efficient platform.

## Features

### For Radiological Technicians (Rad Techs)
- Upload medical images (X-rays, CT scans, MRIs, etc.)
- Upload medical videos
- Assign cases to specific doctors
- Track case status (pending, in progress, completed)
- View complete case history
- Access uploaded files and reports

### For Doctors
- View all assigned cases in an organized dashboard
- Review medical images and videos with built-in viewer
- Create and edit diagnostic reports directly in the system
- Update case status as work progresses
- Filter cases by status (pending, in progress, completed)
- Download medical files for offline review

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React

## Database Schema

### Tables

1. **profiles** - User profiles with roles (rad_tech, doctor)
2. **cases** - Medical cases with patient information
3. **media_files** - Images and videos linked to cases
4. **reports** - Diagnostic reports created by doctors

### Security

All tables have Row Level Security (RLS) enabled with appropriate policies:
- Rad techs can create and view cases they uploaded
- Doctors can view and edit cases assigned to them
- Media files are accessible only to related case participants
- Reports can only be created/edited by assigned doctors

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project settings.

### 3. Database Setup

The database migrations have already been applied. Your Supabase database should have:
- All required tables (profiles, cases, media_files, reports)
- Row Level Security policies
- Storage bucket for medical files
- Indexes for performance

### 4. Storage Configuration

A storage bucket named `medical-files` has been created with appropriate access policies.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### First Time Setup

1. **Create Accounts**
   - Navigate to `/signup`
   - Create accounts for both rad techs and doctors
   - Select the appropriate role during signup

2. **For Rad Techs**
   - Login to access the rad tech dashboard
   - Click "New Case" to upload medical files
   - Fill in patient information and study type
   - Select files (images/videos) to upload
   - Assign the case to a doctor
   - Track case progress from your dashboard

3. **For Doctors**
   - Login to access the doctor dashboard
   - View all assigned cases organized by status
   - Click "View" on any case to see details
   - Review uploaded medical images/videos
   - Type diagnostic reports in the built-in editor
   - Update case status as you work
   - Save reports for rad techs to view

### Case Workflow

1. **Rad Tech**: Uploads images/videos and creates a new case
2. **System**: Case appears in assigned doctor's dashboard as "Pending"
3. **Doctor**: Reviews media files and changes status to "In Progress"
4. **Doctor**: Types and saves diagnostic report
5. **Doctor**: Marks case as "Completed" when done
6. **Both**: Can view the complete case including media and report

## Key Features

### Media Viewer
- Built-in image viewer with zoom and download capabilities
- Video player for radiological videos
- Thumbnail navigation for multiple files
- File size and metadata display

### Report Editor
- Simple text area for typing diagnostic reports
- Auto-save functionality
- Edit history (timestamps)
- View-only mode for rad techs

### Dashboard Features
- Statistics cards (pending, in progress, completed)
- Filterable case lists
- Real-time status updates
- Search and sort capabilities

### Security
- Authentication required for all pages
- Role-based access control
- Secure file storage with signed URLs
- RLS policies prevent unauthorized access

## File Structure

```
├── app/
│   ├── dashboard/
│   │   ├── cases/[id]/     # Case detail view
│   │   ├── doctor/          # Doctor dashboard
│   │   ├── rad-tech/        # Rad tech dashboard
│   │   └── page.tsx         # Dashboard router
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── layout.tsx           # Root layout with auth provider
│   └── page.tsx             # Home page (redirects)
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── dashboard-layout.tsx # Shared dashboard layout
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── auth-context.tsx     # Authentication context
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Netlify

The project is configured for Netlify deployment:
- `netlify.toml` is already configured
- Next.js plugin is included
- Environment variables must be set in Netlify dashboard

### Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel project settings.

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Verify environment variables are set correctly
   - Check Supabase project URL and anon key
   - Ensure email confirmation is disabled in Supabase Auth settings

2. **File upload fails**
   - Verify storage bucket exists and is named "medical-files"
   - Check storage policies are correctly applied
   - Ensure file size is within limits

3. **Cases not appearing**
   - Verify RLS policies are enabled
   - Check user role in profiles table
   - Ensure cases are properly assigned

## Future Enhancements

Potential features for future versions:
- PDF export for reports
- Email notifications for case assignments
- Advanced image manipulation tools
- DICOM file support
- Audit logs for compliance
- Search across all cases
- Patient history tracking
- Integration with existing hospital systems

## Support

For issues or questions, please contact your system administrator.

## License

Proprietary - Hospital Internal Use Only
