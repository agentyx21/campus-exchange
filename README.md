# CampusExchange

A peer-to-peer marketplace for FAU students, gated behind `@fau.edu` email
verification.

## Features

- `@fau.edu` email + 6-digit OTP verification
- Listings with photos, category, condition, and price
- Fixed-price or bidding with an end date (auto-close when the timer expires)
- Private buyer-seller chat
- Ratings after a sale
- Listing reports with an admin review queue

## Tech Stack

Angular 21 + NestJS 11 + MySQL 8 + TypeScript shared types, in an NX
monorepo. Auth via JWT + bcrypt. Container via Docker Compose.

## Setup

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/CampusExchange-Team/campusexchange.git
cd campusexchange
cp .env.example .env
```

Fill `.env` with at minimum:

```env
DB_PASSWORD=any_local_password
MYSQL_ROOT_PASSWORD=any_local_root_password
JWT_SECRET=<openssl rand -hex 64>
```

Then:

```bash
docker compose up --build
```

First build takes 2–3 minutes. Open **http://localhost:3000** and sign in
with a seed account below.

`GMAIL_USER` / `GMAIL_APP_PASSWORD` are optional — only needed to test the
registration OTP flow. Seed accounts are already verified.

## Default Accounts

Seeded for local dev. Password is `password123` for all three:

| Role    | Email            |
|---------|------------------|
| Student | `john@fau.edu`   |
| Student | `jane@fau.edu`   |
| Admin   | `admin@fau.edu`  |

Remove or reset these before deploying — see `.docker/mysql/init.sql`.

## Environment Variables

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| `DB_HOST`             | ✅       | `db` inside Docker Compose               |
| `DB_PORT`             | ✅       | `3306`                                   |
| `DB_USERNAME`         | ✅       | MySQL user (default `campususer`)        |
| `DB_PASSWORD`         | ✅       | Password for the MySQL user              |
| `DB_DATABASE`         | ✅       | Database name (default `campusexchange`) |
| `MYSQL_ROOT_PASSWORD` | ✅       | MySQL root password                      |
| `JWT_SECRET`          | ✅       | 64+ char random string                   |
| `GMAIL_USER`          |          | Gmail address used to send OTPs          |
| `GMAIL_APP_PASSWORD`  |          | 16-char Gmail App Password               |
| `PORT`                |          | Backend port (default `3000`)            |
| `CORS_ORIGIN`         |          | Allowed frontend origin                  |

Never commit `.env` — it's already in `.gitignore`.

## Email Verification (optional)

Registration sends a 6-digit code from a Gmail account you control. Seed
accounts are pre-verified, so skip this section unless you want to test
registration end-to-end.

1. Use or create a Gmail account
2. Enable 2-Step Verification
3. Create an App Password (Google Account → Security → App Passwords)
4. Put both into `.env`:

```env
GMAIL_USER=your-sender@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

## Project Structure

```
apps/
  backend/    NestJS API + serves the built Angular app
    src/
      auth/         register, login, OTP, JWT
      users/        profile endpoints
      listings/     listings CRUD + images + auction scheduler
      bids/         pessimistic-lock bidding
      messages/     buyer-seller conversations
      reviews/      post-sale ratings
      reports/      listing reports + admin queue
      common/       validators, sanitize pipe, constants
  frontend/   Angular 21 app
    src/app/
      pages/        route components
      components/   shared UI
      services/     HTTP services + auth interceptor
      guards/       auth, admin
libs/shared/  TypeScript types shared across the repo
.docker/mysql/init.sql   schema + seed data
```

## Commands

```bash
# Docker
docker compose up --build           # build + start
docker compose logs -f backend      # tail logs
docker compose down -v              # stop + wipe DB volume

# Local (requires Node 20+ and MySQL 8)
npm install
npm run backend                     # :3000, watch mode
npm run frontend                    # :4200

# Quality
npm run build
npm run lint
npm run format
npm test
```

## Troubleshooting

**"Cannot connect to database"** — `DB_HOST=db` for Docker Compose,
`localhost` for bare-metal.

**"Account pending email verification" on login** — use a seed account, or
configure Gmail (see above) to complete the OTP flow.

**Schema out of date** — `synchronize: false`, so schema changes in
`init.sql` only apply to fresh databases:

```bash
docker compose down -v
docker compose up --build
```

## Security Notes

- Input validation via `class-validator` + HTML stripping via `sanitize-html`
- SSRF: private IP ranges blocked from being used as image URLs
- Uploaded images verified by magic-byte sniffing (not just MIME)
- Rate limiting: 60/min global, 5/min on auth endpoints
- OTP: 15-min expiry, 5-attempt lockout
- Helmet security headers on every response
- JWT re-fetches the user on every request — deleted or demoted users lose
  access immediately

## Team

| Contributor                                              | Ownership                              |
|----------------------------------------------------------|----------------------------------------|
| [@agentyx21](https://github.com/agentyx21)               | Monorepo setup, auth & OTP, deployment |
| [@561emir](https://github.com/561emir)                   | Project setup, integration, security   |
| [@hema-chodisetti](https://github.com/hema-chodisetti)   | Messaging                              |
| [@Roleo96](https://github.com/Roleo96)                   | Image upload                           |
| [@krishnanjalivu](https://github.com/krishnanjalivu)     | Seller-buyer review system             |

## Acknowledgments

Parts of this codebase were developed with the help of
[Claude Code](https://claude.com/claude-code) (Anthropic). All AI-assisted
changes were reviewed and tested by the team.

## License

UNLICENSED — Software Engineering coursework project at Florida Atlantic
University.
