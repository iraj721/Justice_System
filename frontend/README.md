# Frontend Structure (React)

Is stage par runnable React (Vite + TypeScript) starter add ho chuka hai.

```text
frontend/
  src/
    app/
      routes.tsx
      roleConfig.ts
    features/
      auth/
        LoginPage.tsx
        RegisterPage.tsx
      dashboard/
        DashboardShell.tsx
        roleViews/
          PublicUserView.tsx
          InvestigatorView.tsx
          ForensicView.tsx
          CourtView.tsx
          PublicAuditorView.tsx
    shared/
      components/
      services/
        apiClient.ts
        auth.ts
```

## Single URL Dashboard Pattern

- Login/Register same pages for everyone
- Login ke baad app `/app` route open kare
- `role` ko decode karke role-specific component render kare

Example mapping idea:

- `PUBLIC_USER` -> FIR create/view
- `INVESTIGATOR` -> case + evidence + suspects + witnesses
- `FORENSIC_ANALYST` -> evidence verification + report generation
- `COURT` -> hearing + verification + judgment
- `PUBLIC_AUDITOR` -> transparency read-only explorer

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`
