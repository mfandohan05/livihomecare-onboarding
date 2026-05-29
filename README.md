# Ready, Set, Onboard! 🌿

> A modern, full-stack caregiver onboarding platform built for home care agencies. Currently in production use for [Livi Home Care](https://livihomecare.com) in Mooresville, NC.

---

## Overview

Ready, Set, Onboard! is a web-based SaaS platform that digitizes and streamlines the entire caregiver hiring and onboarding process for home care agencies. It replaces paper-heavy workflows with a secure, guided digital experience for both caregivers and administrators.

Built from the ground up as a production system, it handles real employee data, legal compliance documents, and sensitive financial information for a live home care agency.

---

## Features

### Caregiver Onboarding Portal
- Guided multi-step onboarding flow customized by role (Caregiver, Nurse PRN, Nurse Director, Other)
- Document upload with real-time progress saving and auto-resume across sessions
- Digital form completion — I-9, W-4, W-9, NC-4EZ, Non-Compete, Drug Test Policy, and more
- New Hire Orientation with 6 sections, slide-based content, and scored quizzes (70% passing threshold)
- Bloodborne Pathogens training acknowledgement
- Competency checklist with 60+ skills across 9 categories
- Direct deposit setup with encrypted banking information storage
- Onboarding time tracking for orientation pay calculation
- Completion certificate generation
- Mobile-responsive design

### Admin Portal
- Dashboard with employee status overview and onboarding metrics
- Employee management with search, filtering by status/role, and skill-based filtering
- Real-time onboarding progress tracking per employee
- Document management — upload, download, and view all caregiver documents
- Admin e-signature workflows for Drug Test Policy, Non-Compete Agreement, and Orientation Checklist
- I-9 Section 2 completion — employer verification with List A or List B+C document support
- Geolocation-based caregiver map with client address search and distance sorting
- Sensitive data access with re-authentication required (SSN, EIN, banking details)
- Audit logging for all significant admin actions
- Superadmin role with dedicated audit log viewer and filtering
- Onboarding link management with 72-hour expiration and regeneration
- Caregiver preview mode — admins can view the onboarding portal as the caregiver sees it

### Security & Compliance
- AES-256 encryption for SSN, DOB, EIN, and banking information via pgcrypto
- Role-based access control (Caregiver / Admin / Superadmin)
- Row-level security on all sensitive database tables
- Private storage buckets with signed URL access
- JWT authentication for admin sessions
- 30-minute inactivity timeout with automatic sign-out
- Tax document retention compliance (IRS/ICE requirements)
- Full audit trail for I-9 completion, document signing, and sensitive data access
- Re-authentication required to view SSN or banking information

### Document Generation
- Automated PDF generation with caregiver data pre-filled
- Two-phase I-9 completion — Section 1 (caregiver) and Section 2 (employer)
- Admin signature embedding directly into PDFs at precise coordinates
- Section 1 fields locked (read-only) after caregiver submission
- All generated documents stored securely and downloadable at any time

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Mapbox GL JS
- pdf-lib (client-side PDF generation)

**Backend**
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Deno (Edge Functions runtime)
- pgcrypto (encryption)
- pg_cron (scheduled jobs)

**Infrastructure**
- Vercel (hosting + CI/CD)
- Resend (transactional email)
- GitHub Actions (Edge Function auto-deployment)

---

## Screenshots

> Coming soon

---

## Status

**Version:** 1.1.0  
**Production:** Live at [app.livihomecare.com](https://app.livihomecare.com)  
**Client:** Livi Home Care — Mooresville, NC

---

## License

This is a proprietary commercial product. All rights reserved.  
© 2026 MLF Technologies LLC

---

## Contact

Interested in using Ready, Set, Onboard! for your home care agency?  
Reach out at **[mlftechnologiesllc@gmail.com]**