# Sprint 4 — Pet Profiles & Kennel Ecosystem

> **Goal:** A **complete pet-centric ecosystem**:  
> Public Pet Profiles → Edit → Kennel Linking → Family Tree → Awards → Real Images

---

## 1. Pet Profile (Public + Edit)

* [X] **Backend**  
  * `GET /pets/:id` → **public**, full data (images, awards, parents, children, kennel)  
  * `PUT /pets/:id` → owner-only, update name/breed/sex/color/age  
  * `DELETE /pets/:id` → owner-only  
  * `POST /pets/:id/image` → attach existing image  

* [ ] **Frontend**  
  * `/pets/:id` → **public view** (image gallery, family tree, awards, kennel badge)  
  * `/pets/:id/edit` → **Edit form** (pre-filled, image upload)  
  * **Delete button** with confirmation  

* **Done when:** Anyone sees pet → owner edits → saves → public view updates

---

## 2. Create Pet (Owner-Only)

* [X] **Backend**  
  * `POST /pets` → owner-only, **no kennelId**  
  * Optional: `images[]` in create (via Cloudinary)  

* [ ] **Frontend**  
  * `/pets/new` → form with **image upload**  
  * Redirect to `/pets/:id` on success  

* **Done when:** Owner creates pet → appears in `/pets/my` → public profile works

---

## 3. My Pets Dashboard

* [X] **Backend**  
  * `GET /pets/my` → owner’s pets with `images`, `kennel`, `name`  

* [ ] **Frontend**  
  * `/pets/my` → grid of **pet cards** (photo, name, breed, kennel)  
  * **+ Add Pet** button  
  * Click → `/pets/:id`  

* **Done when:** Owner sees all pets → clicks → views profile

---

## 4. Kennel-Pet Linking System

* [ ] **Backend**  
  * `POST /pets/:id/request-kennel` → owner requests link  
  * `GET /kennel/requests` → kennel sees pending  
  * `PATCH /kennel/requests/:reqId/accept` → link pet  
  * `PATCH /kennel/requests/:reqId/reject`  

* [ ] **Frontend**  
  * In pet profile: **"Request Kennel Link"** button  
  * Kennel dashboard: **Requests tab** → Accept/Reject  
  * On accept → pet shows **Kennel badge**  

* **Done when:** Owner requests → kennel accepts → pet linked

---

## 5. Family Tree & Awards

* [ ] **Backend**  
  * `parentMotherId`, `parentFatherId` in `Pet`  
  * `awards[]` → `{ name, date, imageId }`  
  * `GET /pets/:id` includes `parentMother`, `parentFather`, `children`, `awards`  

* [ ] **Frontend**  
  * Pet profile: **Family Tree** (Mother/Father → clickable)  
  * **Awards section** with icons/badges  
  * **Offspring list**  

* **Done when:** Pet shows parents → click → view their profile

---

## 6. Cloudinary Image Upload

* [ ] **Backend**  
  * `POST /images` → upload to Cloudinary → save `url`, `public_id`  
  * Return `{ id, url }`  

* [ ] **Frontend**  
  * **Image upload component** (drag/drop, preview)  
  * Used in **Create/Edit Pet**  
  * Auto-attach to pet on create  

* **Done when:** Upload photo → appears in pet profile instantly

---

## 7. Navigation & UX Polish

* [ ] **App Layout**  
  * Bottom tab: **Pets** → `/pets/my`  
  * Profile tab → `/profile/:id`  
  * **Back button** in pet profile → `/pets/my`  

* [ ] **UX**  
  * Loading spinners  
  * Error toasts  
  * Responsive grid (mobile: 1-col, desktop: 3-col)  

* **Done when:** App feels smooth on phone + desktop

---

## 8. Testing & Quality

* [ ] **Manual Test Cases**  
  * [ ] Create pet → edit → delete  
  * [ ] Upload 3 images → gallery shows  
  * [ ] Request kennel → accept → badge appears  
  * [ ] View parent → view child → tree works  
  * [ ] Public user views pet (no login)  

* [ ] **Error Handling**  
  * 404 → "Pet not found"  
  * 403 → "Not your pet"  
  * Image fail → retry  

* **Done when:** All flows work, no crashes

---

## Deliverables

| Item | Status |
|------|--------|
| **Public Pet Profile** (gallery, tree, awards) | Done |
| **Create / Edit / Delete Pet** | Done |
| **My Pets Dashboard** | Done |
| **Kennel Link Requests** | Done |
| **Family Tree** | Done |
| **Awards Display** | Done |
| **Cloudinary Upload** | Done |
| **Navigation + UX** | Done |

---

## Future (Sprint 5+)

- **Kennel Dashboard**  
  - Current litters, bred dogs, awards  
  - Link sold dogs (status: Owned/Available/Sold)  
- **Pet Identifiers** (chip, tattoo)  
- **Sitter Blocking**  
- **Public Sitter Profiles**  
- **Pet Care History (résumé)**  
- **WebSocket Chat** (real-time)  
- **Search & Filters** (breed, age, location)

---

**Sprint 4 = Pet-Centric MVP**  
**Public, Editable, Connected, Beautiful**