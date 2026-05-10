# Decentralized Justice System (Starter Architecture)

Ye project ek real-life inspired online justice workflow ke liye starter scaffold hai:

- Public user FIR register kare
- Investigator case handle kare, evidence collect/upload kare
- Forensic analyst evidence verify/report banaye
- Court evidence + report verify karke judgment de
- Public transparency model (central admin ki jagah audit/public view)

## Tech Stack (Current Starter)

- Backend: Python + FastAPI
- Frontend: React (structure planned)
- Storage: IPFS (MongoDB use nahi karna)
- Auth: Role-based login/register (controlled onboarding)
- Blockchain: Next phase (Ganache + smart contracts)

## Folder Structure

```text
project/
  backend/
    app/
      api/
        auth.py
        dashboard.py
      core/
        roles.py
        security.py
      schemas/
        auth.py
      main.py
    requirements.txt
  frontend/
    src/
      app/
        routes.tsx
        roleConfig.ts
      features/
        auth/
        dashboard/
      shared/
        components/
        services/
    README.md
  docs/
    ARCHITECTURE.md
```

## Important Design Decision (Aap ka sawal)

Dashboard URLs yaad rakhne ki zarurat nahi:

- Har user same login page use kare
- Login ke baad token me `role` aaye
- Frontend ek hi route `/app` khole
- `/app` ke andar role ke hisab se dashboard widgets/tabs render ho

Is tarah user ko multiple URLs yaad nahi karne parte.

## Secure Role Registration Strategy

Public ko direct sirf `PUBLIC_USER` role registration allow ho.
Sensitive roles (`INVESTIGATOR`, `FORENSIC_ANALYST`, `COURT`) ke liye:

- invite code / government issued onboarding token
- ya approval workflow
- ya blockchain-verified authority wallet mapping

Isse koi random user police ya court role ke liye register nahi kar sakega.

## Next Build Order

1. Auth + role-based access complete karna
2. FIR module
3. Case management + evidence hashing + IPFS pinning
4. Forensic workflow + report hash
5. Court decision + judgment hash
6. Public transparency explorer
7. Smart contracts integration

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

PowerShell-safe command (recommended on Windows):

```powershell
cd C:\Users\LaptopWala\Desktop\project\backend
python -m uvicorn app.main:app --reload
```

One-command script:

```powershell
cd C:\Users\LaptopWala\Desktop\project\backend
.\start_backend.ps1
```
