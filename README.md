# MethodVault

A premium platform for selling and distributing manually-created methods. Users can receive methods via 24-character unlock codes or purchase them directly through the marketplace.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Express, TypeScript |
| Database | PostgreSQL / Supabase |
| Auth | JWT (HS256), bcrypt (12 rounds) |
| Payments | Razorpay |

---

## Project Structure

```
methodvault/
├── backend/
│   ├── src/
│   │   ├── db/pool.ts            # PostgreSQL connection pool
│   │   ├── middleware/auth.ts    # JWT auth + role guards
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /auth/register, /auth/login, GET /auth/me
│   │   │   ├── adminMethods.ts   # CRUD /admin/methods + code generation
│   │   │   ├── adminCodes.ts     # POST /admin/codes/:id/revoke
│   │   │   ├── adminUsers.ts     # GET /admin/users
│   │   │   ├── adminPurchases.ts # GET /admin/purchases
│   │   │   ├── myMethods.ts      # GET /me/methods, POST /me/redeem
│   │   │   ├── marketplace.ts    # GET /marketplace/methods
│   │   │   └── purchases.ts      # POST /purchases/orders, /purchases/verify
│   │   ├── index.ts              # Express app entry point
│   │   └── seed.ts               # Admin user creation script
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── auth/login/           # Login page
│   │   ├── auth/register/        # Register page
│   │   ├── dashboard/            # User area
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── methods/          # My Methods list + detail
│   │   │   ├── marketplace/      # Browse + purchase
│   │   │   ├── purchases/        # Purchase history
│   │   │   └── redeem/           # Code redemption
│   │   └── admin/                # Admin area
│   │       ├── page.tsx          # Overview
│   │       ├── methods/          # CRUD + code generation
│   │       ├── codes/            # All codes overview
│   │       ├── users/            # User list
│   │       └── purchases/        # Purchase log
│   ├── components/MethodForm.tsx  # Shared create/edit form
│   ├── lib/api.ts                # Typed API client
│   └── lib/auth-context.tsx      # Auth state (React context)
└── database/
    └── schema.sql                # Full PostgreSQL schema
```

---

## Setup

### 1. Database

Run `database/schema.sql` against your PostgreSQL database (or Supabase SQL editor):

```sql
-- Creates tables: users, methods, method_codes, user_methods, purchases
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, Razorpay keys
npm install
npm run dev        # development with ts-node-dev
npm run build      # compile TypeScript
npm start          # production
```

### 3. Create the Admin Account

```bash
cd backend
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=securepassword ts-node src/seed.ts
```

Or set those vars in `.env` before running. This creates the first admin user. After that, log in at `/auth/login` — you'll be redirected to the admin dashboard automatically.

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev        # development on :3001
npm run build      # production build
npm start          # production server
```

---

## API Endpoints

All endpoints match the attached Postman collection. Point `baseUrl` at your backend and run the collection as-is.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | — | Register new user |
| POST | /auth/login | — | Login, receive JWT |
| GET | /auth/me | Bearer | Get current user |

### Admin (role=admin required)
| Method | Path | Description |
|---|---|---|
| GET | /admin/methods | List all methods |
| POST | /admin/methods | Create method |
| GET | /admin/methods/:id | Get method with content |
| PATCH | /admin/methods/:id | Update method |
| DELETE | /admin/methods/:id | Delete method |
| POST | /admin/methods/:id/codes | Generate codes (count: 1/5/10/50/100) |
| GET | /admin/methods/:id/codes | List codes for method |
| POST | /admin/codes/:id/revoke | Revoke unused code |
| GET | /admin/users | List all users |
| GET | /admin/purchases | List all purchases |

### User
| Method | Path | Description |
|---|---|---|
| GET | /me/methods | List owned methods |
| GET | /me/methods/:id | Get owned method content |
| POST | /me/redeem | Redeem 24-char code |

### Marketplace (public)
| Method | Path | Description |
|---|---|---|
| GET | /marketplace/methods | List published marketplace methods |
| GET | /marketplace/methods/:id | Get marketplace method (no content) |

### Purchases
| Method | Path | Description |
|---|---|---|
| POST | /purchases/orders | Create Razorpay order |
| POST | /purchases/verify | Verify payment server-side + grant access |
| GET | /purchases | List user's purchases |

---

## Security

- **Passwords** hashed with bcrypt (12 rounds) — never stored or logged in plain text
- **JWT** signed with HS256 using `JWT_SECRET` — validated server-side on every protected request
- **Admin role** enforced server-side — frontend role claims are ignored on the backend
- **Prices** fetched server-side on purchase — frontend can never send a manipulated price
- **Code redemption** is atomic — the UPDATE flips status from `unused` to `redeemed` in a single transaction; a code cannot be double-redeemed
- **Razorpay signature** verified via HMAC-SHA256 on the backend before access is granted — payment cannot be faked from the frontend
- **Razorpay secret key** never sent to the frontend — only the public key_id goes to the client
- **Method content** is never returned by marketplace endpoints — only returned via `/me/methods/:id` for verified owners

---

## Code Format

Codes are:
- Exactly **24 characters**
- Characters: **A–Z and 0–9** (uppercase only)
- Generated using `crypto.randomBytes` (cryptographically secure)
- Globally unique (checked before insert)
- Tied to exactly one method
- Redeemable **exactly once** — atomically via a single UPDATE with WHERE status = 'unused'

---

## Payments (Razorpay)

The correct flow:
1. Frontend calls `POST /purchases/orders` → backend creates Razorpay order, returns `razorpay_order_id` and public `key_id`
2. Frontend opens Razorpay checkout with those values
3. After payment, Razorpay returns `razorpay_payment_id` and `razorpay_signature` to the frontend handler
4. Frontend calls `POST /purchases/verify` with all three IDs
5. Backend verifies HMAC signature, marks purchase as paid, grants method access

If `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not set, the purchase endpoints return `503 PAYMENT_NOT_CONFIGURED` rather than pretending payment succeeded.

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@host:5432/methodvault
JWT_SECRET=<at least 64 random chars — generate with: openssl rand -hex 64>
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
