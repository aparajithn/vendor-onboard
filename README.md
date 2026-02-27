# VendorOnboard

A self-service vendor onboarding portal for small businesses. Simplify vendor document collection with automated invites, self-service uploads, and a centralized admin dashboard.

## Features

- **Self-Service Portal** — Vendors upload their own documents (W-9, COI, banking details, business license)
- **Admin Dashboard** — Track vendor onboarding status in one place
- **Email Invites** — Send unique invite links to vendors
- **Document Management** — Secure storage with Supabase
- **Status Tracking** — Monitor vendors from invited → approved

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Email:** Resend (transactional emails)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)
- Resend API key (for emails)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/aparajithn/vendor-onboard.git
cd vendor-onboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The database schema is in `supabase-schema.sql`. Run it in your Supabase SQL editor to create the required tables and policies.

## Usage

### For Business Owners

1. **Sign up** at `/login`
2. **Invite vendors** from the dashboard
3. **Track progress** as vendors upload documents
4. **Review and approve** completed vendor submissions

### For Vendors

1. **Receive invite email** with unique link
2. **Upload required documents** (drag & drop)
3. **Submit for review** once all documents are uploaded

## Project Structure

```
vendor-onboard/
├── app/
│   ├── dashboard/         # Admin dashboard
│   ├── onboard/          # Vendor onboarding pages
│   ├── api/              # API routes
│   └── login/            # Auth pages
├── components/           # React components
├── lib/                  # Utilities (Supabase client)
├── types/                # TypeScript types
└── supabase-schema.sql   # Database schema
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Roadmap

- [ ] Email notifications via Resend
- [ ] Document expiration tracking
- [ ] Multi-business support
- [ ] Custom required documents per vendor
- [ ] Analytics dashboard
- [ ] DocuSign integration

## License

MIT
