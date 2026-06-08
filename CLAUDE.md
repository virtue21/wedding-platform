# Wedding Guest Management Platform — Product Requirements (v2 LOCKED)

> **Status:** Scope locked for MVP. Build from this. Stop refining.

---

## Product Summary

A multi-tenant wedding guest management platform. Couples sign up, configure their wedding, and share a unique URL (or QR code) with guests. Guests RSVP and browse the gift registry — all mobile-first, no app install, no guest login.

MVP is being tested with one beta couple. The data model supports multiple weddings from day one. The interface and language are wedding-specific, but the underlying architecture is event-generic for future expansion.

---

## What Is NOT in MVP

- Product landing/marketing page (couples reach sign-up directly)
- Custom domains per couple (use path-based: `yourdomain.com/couple-slug`)
- WhatsApp Business API integration (use `wa.me` deep links instead)
- Planner/collaborator roles (couple shares login manually for now)
- +1 / plus-one guest support
- Multi-event types (conferences, birthdays, etc.)
- Payment processing of any kind
- Vendor management

---

## Roles

| Role | Auth | Access |
|------|------|--------|
| **Couple (Admin)** | Email + password (sign-up/login) | Full control: configure wedding, manage guests, manage registry, manage tables |
| **Guest** | None — unauthenticated | RSVP form + registry view via shared link or QR code |

---

## Pages / Screens Overview

### Auth (not a landing page — functional only)
1. **Sign Up** — email, password, couple's names
2. **Login** — email, password
3. **Forgot Password** — email reset flow

### Admin Portal (web-first, responsive)
4. **Wedding Setup** — wedding details + URL slug + cover image
5. **Relationship Categories** — configure per-side categories
6. **Guest List** — table view with filters, search, stats, remove
7. **Gift Registry Management** — add/edit/remove items, mark received
8. **Table / Seating Management** — create tables, assign guests
9. **QR Code** — auto-generated, downloadable

### Guest-Facing (mobile-first)
10. **Wedding Page** — couple info, date, venue, CTA to RSVP
11. **RSVP Form** — name, phone, email (optional), side, category
12. **RSVP Confirmation** — success message + WhatsApp deep link
13. **Gift Registry View** — browse items, claim, see account details

---

## Module 1: Auth + Wedding Setup

### Sign Up
- Fields: email, password, bride's name, groom's name
- On sign-up: auto-create a Wedding record linked to this user
- Redirect to Wedding Setup

### Login
- Email + password
- Redirect to admin dashboard (Guest List as default view)

### Wedding Setup (Admin)
| Field | Required | Notes |
|-------|----------|-------|
| Bride's name | Yes | Pre-filled from sign-up |
| Groom's name | Yes | Pre-filled from sign-up |
| Wedding date | Yes | Date picker |
| Venue name | Yes | |
| Venue address | No | |
| URL slug | Yes | Auto-suggested from names (e.g., `ada-and-chike`). Couple can edit. Must be unique. Results in `yourdomain.com/ada-and-chike` |
| Cover image | No | Upload. Used as banner on guest-facing page. |

Couple can return to this page to edit details at any time.

**QR Code:** Auto-generated from the wedding URL. Displayed on the setup page with a "Download QR Code" button (PNG). Couple shares this on WhatsApp, social media, prints it, etc.

---

## Module 2: RSVP Flow (Guest-Facing, Mobile-First)

### Entry
Guest arrives at `yourdomain.com/couple-slug` via QR scan or direct link.

### Wedding Page (Screen 10)
- Couple's names, date, venue
- Cover image if uploaded
- CTA button: "Confirm Your Attendance"

### RSVP Form (Screen 11)
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Full name | Yes | Text | |
| Phone number | Yes | Phone input | +234 format. Used for duplicate detection. |
| Email address | No | Email | For confirmation delivery |
| Who do you know? | Yes | Single select | Bride / Groom / Both |
| How do you know them? | Yes | Single select | Populated from couple's configured categories for the selected side. If "Both," show combined list. |

**Duplicate detection:** If phone number already exists for this wedding → "This phone number is already registered." No duplicate RSVPs.

### Confirmation (Screen 12)
- Success message: "You're confirmed for [Bride] & [Groom]'s wedding on [Date] at [Venue]!"
- "Share on WhatsApp" button: `wa.me` deep link with pre-filled message (e.g., "I just confirmed my attendance for Ada & Chike's wedding! 🎉")
- Email confirmation sent if email was provided
- Below the confirmation: smooth transition/scroll into the Gift Registry (Screen 13)

---

## Module 3: Relationship Categories (Admin)

The couple defines the categories guests select during RSVP. Categories are per-side.

### Configuration UI
- Two sections: "Bride's Side" and "Groom's Side"
- Each section: list of categories with add/edit/delete/reorder
- Default starters (pre-populated, editable): Family, Church, Work, School, Friends

### Data
```
RelationshipCategory
├── id
├── wedding_id
├── side (enum: bride, groom)
├── label (e.g., "Church", "Work Colleagues")
├── sort_order
```

When guest selects "Both" for who they know, the RSVP form shows a combined list of all categories from both sides (deduplicated by label if identical).

---

## Module 4: Gift Registry

### How It Works

Each registry item is ONE item with TWO fulfillment paths:
1. **Buy the physical item** — guest uses the provided checkout link to purchase and ship it
2. **Send the cash equivalent** — guest transfers the item's price to the couple's bank account

The couple's bank account details are set once at the wedding level (not per item).

### Wedding-Level Account Details (Admin → Wedding Setup or Registry Settings)
| Field | Required |
|-------|----------|
| Bank name | Yes |
| Account number | Yes |
| Account name | Yes |

These are displayed on the registry page for guests who choose the cash route.

### Registry Item (Admin Creates)
| Field | Required | Notes |
|-------|----------|-------|
| Item name | Yes | e.g., "Samsung 500L Refrigerator" |
| Description | No | Specs, color, model |
| Photo | No | Upload |
| Price | Yes | Cash equivalent amount (e.g., ₦350,000) |
| Checkout link | No | URL to the product on Jumia/Amazon/etc. Guest clicks to buy directly. |
| Quantity needed | Yes | Default: 1 |
| Sort order | Yes | Controls display order for guests |

### Guest View (Screen 13, Mobile-First, No Auth Required)
- Grid/list of registry items: photo, name, price, quantity remaining
- Each item shows two actions:
  - **"Buy This Gift"** (if checkout link exists) → opens link in new tab
  - **"Send Cash Equivalent"** → reveals couple's bank details (bank name, account number, account name) + the item price
- **"I'm gifting this"** button → guest enters their name, claims one unit, quantity decrements by 1
- When quantity reaches 0 → item shows "Fully Claimed" (visible but greyed out)

### Couple View (Admin → Registry Management)
- List of all registry items with: name, price, quantity needed, quantity claimed, quantity remaining
- Per item: list of guests who claimed it (name linked to guest record)
- **"Mark as Received"** toggle per claim → visual indicator
- Add / edit / remove / reorder items

### Data
```
RegistryItem
├── id
├── wedding_id
├── name
├── description (nullable)
├── image_url (nullable)
├── price (decimal)
├── checkout_link (nullable)
├── quantity_needed (default 1)
├── quantity_claimed (default 0)
├── sort_order
├── created_at

GiftClaim
├── id
├── registry_item_id → RegistryItem.id
├── guest_name (text — not FK to Guest, because non-RSVP visitors may also gift)
├── claimed_at
├── is_received (boolean, default false)
```

**Note:** `guest_name` is free text, not a foreign key to the Guest table. This is intentional — the registry is visible to everyone with the link, so someone who hasn't RSVP'd might still claim a gift. The couple reconciles manually.

---

## Module 5: Guest Management (Admin)

### Guest List (Screen 6 — Default Admin View)
Table with columns:
- Name
- Phone
- Email
- Side (Bride / Groom / Both)
- Category (e.g., "Church")
- RSVP date

### Functionality
- **Filter** by side, by category
- **Search** by name or phone number
- **Summary stats** at top: total guests, breakdown by side, breakdown by category
- **Click a row** → Guest detail: full info + any gift claims linked by name match + internal notes field (couple's private notes, e.g., "Uncle from Enugu, needs hotel info")
- **Remove guest** → soft delete (is_removed = true). Removed guests are hidden from the list. If they try to RSVP again with the same phone number, they are blocked.
- **Export** → CSV download of full guest list

### Data
```
Guest
├── id
├── wedding_id
├── full_name
├── phone (unique per wedding_id)
├── email (nullable)
├── side (enum: bride, groom, both)
├── category_id → RelationshipCategory.id
├── rsvp_date
├── is_removed (boolean, default false)
├── notes (nullable)
├── created_at
```

---

## Module 6: Seating / Table Management (Admin)

Couple configures tables after they have a sense of guest count from the RSVP data.

### Table Configuration
- Create tables: name/number + capacity (max guests per table)
- Edit / delete tables
- Visual summary: list of tables with assigned count vs. capacity

### Guest Assignment
- Assign guests to tables from the guest list (dropdown or drag-and-drop)
- A guest can only be at one table
- Flag when a table exceeds capacity
- Unassigned guests are clearly visible (filtered view: "Not yet seated")

### Data
```
SeatTable
├── id
├── wedding_id
├── label (e.g., "Table 1", "Head Table", "Family Table")
├── capacity (integer)
├── sort_order
├── created_at

Guest (additional field)
├── table_id → SeatTable.id (nullable — null means unassigned)
```

---

## Full Data Model Summary

```
User
├── id (uuid, PK)
├── email (unique)
├── password_hash
├── bride_name
├── groom_name
├── created_at

Wedding
├── id (uuid, PK)
├── user_id → User.id
├── slug (unique — used in URL)
├── wedding_date
├── venue_name
├── venue_address (nullable)
├── cover_image_url (nullable)
├── bank_name (nullable)
├── account_number (nullable)
├── account_name (nullable)
├── created_at
├── updated_at

RelationshipCategory
├── id (uuid, PK)
├── wedding_id → Wedding.id
├── side (enum: bride, groom)
├── label
├── sort_order

Guest
├── id (uuid, PK)
├── wedding_id → Wedding.id
├── full_name
├── phone
├── email (nullable)
├── side (enum: bride, groom, both)
├── category_id → RelationshipCategory.id
├── table_id → SeatTable.id (nullable)
├── rsvp_date
├── is_removed (boolean, default false)
├── notes (nullable)
├── created_at
├── UNIQUE(wedding_id, phone)

RegistryItem
├── id (uuid, PK)
├── wedding_id → Wedding.id
├── name
├── description (nullable)
├── image_url (nullable)
├── price (decimal)
├── checkout_link (nullable)
├── quantity_needed (integer, default 1)
├── quantity_claimed (integer, default 0)
├── sort_order
├── created_at

GiftClaim
├── id (uuid, PK)
├── registry_item_id → RegistryItem.id
├── guest_name (text)
├── claimed_at
├── is_received (boolean, default false)

SeatTable
├── id (uuid, PK)
├── wedding_id → Wedding.id
├── label
├── capacity (integer)
├── sort_order
├── created_at
```

---

## Technical Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router) | SSR for guest pages (fast load, link previews), React for admin |
| Database + Auth | Supabase (Postgres + Auth + Storage) | Row-level security for multi-tenancy, built-in auth, image storage for registry items and cover photos |
| Hosting | Vercel | Zero-config Next.js, preview URLs, easy custom domain support later |
| Styling | Tailwind CSS | Rapid UI, responsive by default, mobile-first utilities |
| QR Code | `qrcode` npm package | Client-side generation, PNG download |
| Phone input | `react-phone-number-input` | +234 formatting and validation |
| WhatsApp (MVP) | `wa.me` deep link | No API needed — button opens WhatsApp with pre-filled text |

---

## Phase Plan

### Phase 1 — MVP (This Build)
- [ ] Auth: sign-up, login, forgot password
- [ ] Wedding setup: details, slug, cover image, bank details
- [ ] Relationship category configuration
- [ ] Guest-facing: wedding page + RSVP form + confirmation
- [ ] Email confirmation + WhatsApp deep link
- [ ] QR code generation + download
- [ ] Gift registry: couple creates items (name, price, photo, link, quantity)
- [ ] Gift registry: guest views, claims items, sees bank details for cash option
- [ ] Guest list: table view, filters, search, stats, export CSV
- [ ] Guest detail: info + claims + notes
- [ ] Remove guest (soft delete)
- [ ] Seating: create tables, assign guests, capacity warnings
- [ ] Mark gifts as received

### Phase 2 — After Beta Feedback
- [ ] Product landing page with demo
- [ ] Custom domain support per couple
- [ ] WhatsApp Business API (automated confirmations via Termii / Africa's Talking)
- [ ] Planner/collaborator role with scoped access
- [ ] +1 guest support
- [ ] Wedding page theme customization (colors, fonts)
- [ ] Guest-facing seating chart view (visual table map)

### Phase 3 — Growth
- [ ] Multi-event support (birthdays, conferences, etc.)
- [ ] Pricing tiers
- [ ] Vendor management
- [ ] Analytics dashboard
- [ ] Bulk guest actions
