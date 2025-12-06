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

* [X] **Frontend**  
  * `/pets/new` → form with **image upload**  
  * Redirect to `/pets/:id` on success  

* **Done when:** Owner creates pet → appears in `/pets/my` → public profile works

---

## 3. My Pets Dashboard

* [X] **Backend**  
  * `GET /pets/my` → owner’s pets with `images`, `kennel`, `name`  

* [X] **Frontend**  
  * `/pets/my` → grid of **pet cards** (photo, name, breed, kennel)  
  * **+ Add Pet** button  
  * Click → `/pets/:id`  

* **Done when:** Owner sees all pets → clicks → views profile

---

## 4. Kennel-Pet Linking System

* [X] **Backend**  
  * `POST /pets/:id/request-kennel` → owner requests link  
  * `GET /kennel/requests` → kennel sees pending  
  * `PATCH /kennel/requests/:reqId/accept` → link pet  
  * `PATCH /kennel/requests/:reqId/reject`  

* [X] **Frontend**  
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
- **Pet Care History (résumé)**  
- **Search & Filters** (breed, age, location)

---

**Sprint 4 = Pet-Centric MVP**  
**Public, Editable, Connected, Beautiful**

Recommendations for Sitters:
We recommend that sitters using our service always remain truthful and humble.
As not doing so might come with consequences such as the following:
- Injury to self. (Icon: Dog biting hand image)
- Damage to property. (Icon: Dog piss on box)
- Harm to animals. (Icon: Dog biting dog)
- Danger to others. (Icon: Dog bark at humans - pulling at leesh)
We do not take responsibility in the result of any of the services provided through us, we provide a hosting service.
We claim the right to terminate accounts that do not share our values or disregard for their own or others safety.

Make introduction/guide for newly created clubs/kennels/owners/sitters, further explaining what the website provides and how to get started.
As Admin Create Notification Banners, with link to more information and set time for duration.
As Trainer, Kennel, Company, Advertisers be able to purchase the ability to create announcement Notification banners based on duration, time, geographical area, amount.
Receipts should have unique identifier foil. (Stars, Circles, Squares, Triangles, Moons, Arrows..)*(Rotation)*(Colors)*(Direction of parallax).
Reciepts should be able to be combined for easier monthly/yearly accounting.
Chat's should be able to link/show direction (gps).


WORKING ON APPLYING CLUBS CORRECTLY.

Need to add APPROVE/REJECT cards to club. (Necessary for awards - might need to look at that logic).
Expired token should log you out -> using the website should update your token.
Courses need to be able to be deleted.
People who request certification for their pet can be denied (Exists), but should not be prevented from requesting again.
Uncaught ReferenceError: handleJoin is not defined when attempting to access Club Profile. Should be a redirect most likely?
Request Membership (/clubs) link does not work. sends you to /club/id, also breaks entire webpage. Auth system is not working correctly.
- Auth is definetly not functioning correctly.
KennelDashboard is giving Club Dashboard error setClubs is not defined... -FIXED REMOVED CourseForm.jsx

I would like for ClubDashboard to have a similar Incoming Requests as the KennelDashboard, it was very nice and everything ended up in one container.

Auth / token stability (high)

Auto-logout on expired/invalid token (401).
Ensure login persistently stores token and user.
Refresh token on use (optional later, but at least update token on any successful refresh endpoint).
Competition UI → API alignment (high)

Use CompetitionAllowedAwarder endpoints for competitions (you already found this).
Add approve/reject UI in ClubDashboard cards for awarders.
Fix broken navigation / form behaviors (medium)

Fix handleJoin undefined (redirect to login / call join API).
Fix "Request Membership (/clubs)" link behavior (should go to club request route).
Ensure buttons inside forms have type="button" to avoid navigation POSTs.
Data and UX fixes (medium)

Courses deletion API+UI.
Allow re-request of pet certification after rejection (status flow: rejected → can re-request).
Add incoming requests view to ClubDashboard (mirror KennelDashboard).
Add consistent cards for Approve / Reject flows.
Cleanup / polish (low)

Improve messages for 409s (Nomination already exists).
Prevent duplicate nominations in UI (disable nominate button when already nominated).

all protected Routes need to be fixed api.get*

REQUIRED BACKEND ENDPOINTS.
// club.js
GET /clubs/my-managed        → where role IN ("OWNER", "EMPLOYEE")
GET /clubs/requests/my-all   → all pending requests from my clubs

// courses.js
GET /courses/my-managed      → courses from clubs I manage

// competitions.js
GET /competitions/my-managed → competitions from clubs I manage

routes /me might need to be a join table later, and then distributed correctly.

12-06
Club -> Courses -> Edit
Club -> Competitions -> Edit 
Club -> Competitions -> Awards (Reward Pet)