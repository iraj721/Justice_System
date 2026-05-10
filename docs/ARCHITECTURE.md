# System Architecture (Phase-1 to Phase-2)

## Roles

- `PUBLIC_USER`
- `INVESTIGATOR`
- `FORENSIC_ANALYST`
- `COURT`
- `PUBLIC_AUDITOR` (read-only transparency role)

## Core Modules

1. Auth & Identity
   - Registration/login
   - Role claims
   - Restricted role onboarding

2. FIR Module
   - FIR creation
   - FIR status tracking
   - Document attachment

3. Case Management
   - FIR to case conversion
   - Suspects/witnesses
   - Timeline and investigation notes

4. Evidence Module
   - Evidence upload metadata
   - SHA-256 hash generation
   - Hash verification endpoint
   - Chain-of-custody events

5. Forensic Module
   - Evidence intake
   - Lab result/report generation
   - Report hash and verification

6. Court Module
   - Case hearing workflow
   - Evidence/report verification
   - Judgment writing
   - Judgment hash anchoring

7. Public Transparency
   - Non-sensitive data viewing
   - Hash and state audit trail

## Decentralized Data Strategy

- Primary file payloads -> IPFS CID
- Hash references -> blockchain (Phase-2 smart contracts)
- Sensitive private details -> encrypted before IPFS upload
- Public explorer -> only allowed/sanitized metadata

## Single Dashboard Pattern

- Frontend route: `/app`
- After login, backend returns role and permissions
- Frontend renders role-specific layout from permission map
- Unauthorized tabs hidden + backend access blocked with RBAC

## Security Baseline

- JWT auth
- RBAC on every protected API
- All evidence/report/judgment records include immutable hash
- Every state change logged as audit event
