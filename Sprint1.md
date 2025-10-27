#  Sprint 1 — Core Setup

This sprint focuses on establishing the foundation: database, backend, containerization, CI/CD, and initial testing.

---

##  Database & Schema

- [X] **Design initial MySQL schema**  
  - Create ERD for tables: `users`, `profiles`, `roles`  
  - Write SQL migration script for schema creation  
  - **Done when:** Migration runs successfully, schema matches ERD  

- [X] **Add Prisma schema + migration**  
  - Translate DB schema into `schema.prisma`  
  - Run `npx prisma migrate dev`  
  - **Done when:** Prisma generates correct tables in DB  

- [X] **Write seed script for test data**  
  - Add 2 owners, 2 sitters, 1 kennel with dummy data  
  - **Done when:** `npm run seed` populates DB  

---

##  Backend Setup

- [X] **Initialize Node.js backend with Express**  
  - Create boilerplate app  
  - Add `/health` route returning `"OK"`  
  - **Done when:** `npm run dev` starts server successfully  

- [ ] **Implement authentication (JWT)**  
  - `POST /auth/register`  
  - `POST /auth/login`  
  - Hash passwords with bcrypt  
  - Return JWT on login  
  - **Done when:** Valid login returns working JWT  

- [ ] **Role management middleware**  
  - Middleware to check `role` (owner, sitter, kennel)  
  - Example: `/kennel/dashboard` restricted to kennels  
  - **Done when:** Wrong role returns `403`  

- [ ] **Dockerize backend**  
  - Add `Dockerfile` + `.dockerignore`  
  - Build and run backend via Docker  
  - **Done when:** `docker run` starts app successfully  

---

##  CI/CD

- [ ] **Setup GitHub Actions pipeline**  
  - Add lint + test + build steps  
  - **Done when:** Workflow passes on every push  

- [ ] **Add coverage badge to README**  
  - Configure Jest + NYC  
  - Update README with badge  
  - **Done when:** Badge shows coverage percentage  

---

##  Testing

- [ ] **Unit tests for authentication**  
  - Test register + login success and failure  
  - **Done when:** All cases covered  

- [ ] **Integration test for DB connection**  
  - Simple query test (e.g., select users)  
  - **Done when:** Test passes confirming DB connectivity# Dog-Sit