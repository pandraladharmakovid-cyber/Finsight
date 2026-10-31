# FinSight v2.0 — Personal Financial Intelligence System

**FinSight** is a full-stack personal finance management application designed to help users manage their financial activities through a centralized, interactive dashboard.

It brings together account management, transaction tracking, budgeting, savings goals, debt management, recurring payments, financial analytics, and audit history in one platform.

Built with React, Vite, Node.js, Express, and PostgreSQL, FinSight focuses on practical financial visibility, organized data management, and an intuitive user experience.

---

## 1. Project Overview

FinSight provides a centralized financial workspace where users can:

- Monitor their overall financial position.
- Track income and expenses.
- Manage multiple financial accounts.
- Create and monitor budgets.
- Set savings goals and track progress.
- Manage outstanding debts.
- Track recurring payments.
- Analyze spending patterns.
- Review financial activity and audit history.

The application uses a PostgreSQL database for persistent financial data storage.

## 2. Key Features

### Dashboard
- Financial overview and net worth.
- Income and expense summaries.
- Account balance overview.
- Spending trends and visual charts.
- Budget utilization.
- Savings and debt summaries.
- Recent financial transactions.

### Transaction Management
- Create, view, update, and delete transactions.
- Track income and expenses.
- Search and filter transactions.
- Filter by transaction type, account, and date.
- Pagination and CSV export.
- Input validation.

### Account Management
- Manage multiple financial accounts.
- Support different account types.
- View account balances.
- Activate and deactivate accounts.
- Track account-related transactions.

### Category Management
- Create and manage income and expense categories.
- Organize transactions by category.
- Review category-wise spending.

### Budget Management
- Create and update budgets.
- Monitor spending against budget limits.
- View budget utilization.
- Identify over-budget situations.

### Savings Management
- Create savings goals.
- Set target amounts.
- Track current savings progress.
- Add contributions.
- Monitor completed and active goals.

### Debt Management
- Record outstanding debts.
- Track principal and remaining amounts.
- Log debt payments.
- Monitor overdue and paid debts.

### Recurring Payments
- Manage recurring financial transactions.
- Support daily, weekly, monthly, and yearly frequencies.
- Pause and resume recurring entries.
- Review recurring payment commitments.

### Financial Analytics
- Analyze financial performance.
- Review spending patterns.
- Explore account and budget analytics.
- Monitor savings and debt progress.
- View financial summaries.

### Audit Log
- Review financial activity history.
- Inspect recorded changes.
- View before-and-after data where available.

### Settings
- Manage user profile information.
- Customize application appearance.
- Change accent themes.
- Configure reduced-motion preferences.
- Check backend and database health.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite |
| Programming Language | JavaScript (ES Modules) |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Database Library | node-postgres (`pg`) |
| Routing | React Router |
| Icons | Lucide React |
| Styling | CSS |
| API Communication | REST API |
| Environment Configuration | dotenv |
| Version Control | Git and GitHub |

---

## 4. System Architecture

FinSight follows a frontend-backend-database architecture.

**Frontend**
- React components and pages.
- Dashboard and financial management interfaces.
- API client for backend communication.
- Client-side navigation and state management.

**Backend**
- Express REST API.
- Route and controller organization.
- Business logic and database queries.
- Request logging and error handling.
- Input validation.

**Database**
- PostgreSQL relational database.
- Persistent storage for financial records.
- Database views for financial summaries and analytics.
- Database triggers for balance maintenance and audit tracking.

### Application Data Flow

```text
User
  |
  v
React Frontend
  |
  v
API Client
  |
  v
Express REST API
  |
  v
Backend Services
  |
  v
PostgreSQL Database
  |
  v
API Response
  |
  v
Dashboard / UI Update
```

---

## 5. Database Structure

The project uses PostgreSQL with the `finance` schema.

### Main Tables

- users
- accounts
- categories
- transactions
- budgets
- savings_goals
- debts
- recurring_transactions
- audit_log

### Database Views

- account_balances
- budget_performance
- category_spending
- debt_summary
- monthly_expense_analysis
- savings_progress
- user_financial_summary

### Database Triggers

- `trg_update_account_balance`
- `trg_audit_transactions`
- `trg_users_updated_at`

---

## 6. Project Structure

```text
FinSight/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── db/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   │
│   ├── lib/
│   │   ├── api.js
│   │   ├── format.js
│   │   └── hooks.jsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── charts/
│   │
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Transactions.jsx
│       ├── Accounts.jsx
│       ├── Categories.jsx
│       ├── Budgets.jsx
│       ├── Savings.jsx
│       ├── Debts.jsx
│       ├── Recurring.jsx
│       ├── Analytics.jsx
│       ├── AuditLog.jsx
│       └── Settings.jsx
│
├── docs/
├── tests/
├── tools/
├── index.html
├── vite.config.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Installation and Local Setup

### Prerequisites

- Node.js
- npm
- PostgreSQL database
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/pandraladharmakovid-cyber/FinSight.git
cd FinSight
```

### Step 2: Install Dependencies

```bash
npm ci
npm ci --prefix backend
```

The frontend and backend have separate lockfiles and both need their dependencies installed.

### Step 3: Configure Environment Variables

Create or update `backend/.env`:

```env
PORT=5000

DB_HOST=your_postgresql_host
DB_PORT=your_postgresql_port
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# Verify the database certificate (recommended for remote databases).
DB_SSL=true

# For local development only, optionally bypass workspace sign-in.
# This flag is ignored in production and on Vercel.
FINSIGHT_DISABLE_AUTH=true
```

Create the frontend `.env`:

```env
VITE_API_BASE_URL=/api
VITE_FINSIGHT_USER_ID=1
```

For protected local sign-in instead of the development bypass, run
`node tools/generate-workspace-credentials.mjs`, add the printed hash and session
secret to `backend/.env`, and keep the generated workspace password private.

**Security:** Never commit `.env` files, database passwords, or private credentials to GitHub.

### Step 4: Build the Frontend

```bash
npm run build
```

### Step 5: Start the Application

```bash
npm start
```

The Express server serves the built frontend and API from the same origin.

Open:

```text
http://localhost:5000
```

---

## 8. API Endpoints

The backend exposes REST API endpoints under `/api`.

| Module | Main Endpoint |
|---|---|
| Health | `/api/health` |
| Metadata | `/api/meta` |
| Users | `/api/users/:userId` |
| Dashboard | `/api/dashboard/:userId` |
| Transactions | `/api/transactions/:userId` |
| Accounts | `/api/accounts/:userId` |
| Categories | `/api/categories` |
| Budgets | `/api/budgets/:userId` |
| Savings | `/api/savings/:userId` |
| Debts | `/api/debts/:userId` |
| Recurring | `/api/recurring/:userId` |
| Analytics | `/api/analytics/:userId` |
| Audit Log | `/api/audit/:userId` |

The API supports the appropriate GET, POST, PUT, and DELETE operations for its resources.

---

## 9. Running Tests

Backend integration tests (require a running API and a disposable database; the tests modify records):

```bash
npm test
```

Vercel routing smoke tests (no database connection required):

```bash
npm run test:vercel
```

Browser UI tests:

```bash
npm run test:ui
```

For protected test deployments, set `FINSIGHT_TEST_PASSWORD` in the test process so the integration and browser suites can sign in. The project source documentation records a previous test run of 96 backend checks and 45 browser checks. These results should not be interpreted as a guarantee that the current deployment has passed those tests.

---

## 10. Deployment to Vercel

The root `vercel.json` uses Vercel Services to build the Vite frontend and Express backend separately, routing `/api/*` to Express and other requests to the frontend. Import the repository with the root directory set to the repository root and the **Services** framework preset.

The application implements a **single-owner** password-protected workspace: the owner can read and modify all financial records, and it is not intended for separate multi-user accounts. Generate a high-entropy workspace password and server secrets with:

```bash
node tools/generate-workspace-credentials.mjs
```

Keep the printed password private. Store the two printed server values as **sensitive** Vercel environment variables; never commit them. Rotate both the password hash and session secret if access needs to be revoked. Sessions last up to 12 hours; the per-instance sign-in limiter is best-effort and is not a globally shared rate limiter. Vercel Authentication for **All Deployments** provides an additional recommended protection layer.

Configure these server-side variables for the desired Production and/or Preview environments:

| Variable | Value |
|---|---|
| `FINSIGHT_PASSWORD_HASH` | Generated `scrypt:...` hash for the workspace password |
| `FINSIGHT_SESSION_SECRET` | Generated signing key; at least 32 random bytes |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection details from the provider; keep the password secret |
| `DB_SSL` | Set to `true` for a TLS-enabled database. Server certificates are verified |
| `DB_SSL_CA` | Optional PEM-encoded provider CA for a private certificate authority |
| `DB_MAX_CONNECTIONS` | Optional; a small value such as `2` limits connections per serverless instance |
| `VITE_API_BASE_URL` | `/api` (same-origin) |
| `VITE_FINSIGHT_USER_ID` | The existing workspace user ID, normally `1` |

**A database without TLS sends financial records, and potentially credentials, unencrypted over the network.** Use a TLS-enabled database for real financial information. The database must already contain the `finance` schema, tables, views, and triggers described above; this repository does not currently include a schema migration or seed script.

After changing environment variables, redeploy. Sign in and check `/api/health`: its `database` field should contain database information. Also open and refresh a frontend route such as `/dashboard`. A successful frontend build alone does not verify the database. Run the full integration tests only against a disposable database: they create, update, and delete records.

For local development behind a path-prefixed proxy, set `VITE_BASE_PATH` when building (for example, `VITE_BASE_PATH=./ npm run build`). The default is `/` for Vercel.

---

## 11. Security Considerations

- Store database credentials in environment variables.
- Never expose private credentials in frontend code.
- Never commit `.env` files.
- Validate incoming API data.
- Use parameterized PostgreSQL queries.
- Restrict production database access appropriately.
- Prefer verified database TLS; never rely on unencrypted transport for real financial information.
- The workspace password grants access to all records; it is not multi-user authorization.
- For stronger access control, enable Vercel Authentication for All Deployments.

---

## 12. Future Improvements

- Add per-user authentication and authorization.
- Add a shared, distributed sign-in rate limiter and revocable sessions.
- Improve financial reporting and export options.
- Add more advanced financial insights.
- Expand automated testing.
- Improve mobile responsiveness and accessibility.

---

## 13. Author

**Project:** FinSight v2.0  
**Developer:** Pandrala Dharma Kovidh  
**GitHub:** [pandraladharmakovid-cyber](https://github.com/pandraladharmakovid-cyber)

---

## License

This project is distributed under the MIT License, as specified in the project configuration.

---

**FinSight — Understand Your Money. Control Your Future.**