# Sprint 3 — Core MVP: Profile, Matching,, Chat, Kennel

> **Goal:** A **fully functional loop**:  
> Login → Edit Profile → Find Match → Chat → View Kennel

---

## 1. Fix Profile Update (Frontend + Backend)

* [X] **Backend**  
  * `POST /profile` → updates `Profile` row  
  * Return full updated `profile` object  
  * Validate required fields  

* [X] **Frontend**  
  * `Profile.jsx` → `api.updateProfile()` on submit  
  * Show success toast  
  * Reload profile on save  

* **Done when:** User edits name/bio → saves → sees update instantly

---

## 2. Matching System

* [X] **Backend**  
  * `GET /match` → returns `sentMatches` and `receivedMatches`  
  * `POST /match` → owner sends request to sitter  
  * `PATCH /match/:id/accept` & `/reject`  

* [X] **Frontend**  
  * `/matches` screen  
  * Tabs: **Sent**, **Received**  
  * Action buttons: **Accept**, **Reject**, **Cancel**  

* **Done when:** Owner sends request → sitter sees → accepts → status = ACCEPTED

---

## 3. Chat (Real-Time Messaging)

* [X] **Backend**  
  * `GET /message/:matchId` → all messages  
  * `POST /message` → `{ matchId, message }`  
  * Include `senderId`, `timestamp`  

* [ ] **Frontend**  
  * `/chat/:matchId`  
  * Auto-poll every 3s (or use WebSocket later)  
  * Scroll to bottom, show sender name  

* **Done when:** Two users send messages → both see them instantly

---

## 4. Kennel List

* [ ] **Backend**  
  * `GET /kennel` → list with `name`, `location`, `members[]`, `dogs[]`  

* [ ] **Frontend**  
  * `/kennels` screen  
  * Card list: name, location, member count  
  * Click → view members (optional)  

* **Done when:** User sees all kennels from DB

---

## 5. Navigation & UX

* [ ] **App Layout**  
  * Bottom tabs: **Home**, **Matches**, **Chat**, **Kennels**, **Profile**  
  * Auto-redirect `/` → `/profile/:id` if logged in  

* [ ] **Logout Button**  
  * Clear `localStorage`, go to `/login`  

* **Done when:** Full app flow feels natural

---

## 6. Testing & Quality

* [ ] **Manual Test Cases**  
  * [ ] Login → Profile → Edit → Save  
  * [ ] Owner → Send Match → Sitter Accepts  
  * [ ] Open Chat → Send 3 messages  
  * [ ] View Kennels  

* [ ] **Error Handling**  
  * Show toast on API fail  
  * Loading spinners  

* **Done when:** All flows work on mobile + desktop

## Deliverables

| Item | Status |
|------|--------|
| Working **Profile Update** | Done |
| **Matching** (send/accept/reject) | Done |
| **Chat** (real messages) | Done |
| **Kennel List** | Done |
| **Navigation + Logout** | Done |
| **No crashes, good UX** | Done |

---

## Future

Backend:

Update/Change/Add Roles (Multiple Role option) Sitter/Owner/Employee...
 - An Owner can be a sitter, a Employee can be sitter, owner and so on, more roles might need to be added to backend as project develops. Like Certifiers, or things like that.
Kennel (improvements)
 - Current Dogs[] available
 - Dogs Bred (Connected table)
 - Family Trees (Connected Table)
 - Rewards/Prices (Connected Table?)
 - Diplomas (Connected Table?)
 - Certificates (Connected Table?)
 - Current Main Two Parent Dogs of Current Litter
 - Litter Dog Identifier Images[] -> From profile
 - Parent Dog Identifier Images[] -> From Profile
Pet profile
  - Rewards/Prices (Connected Table?)
  - Diplomas (Connected Table?)
  - Family Tree (Connected Table?)
  - Kennel (Connected Table)
  - Identifiers
  - Male/Female
  - Color
  - Breed
  - Age
  - Images[]
Sitters -> Potential to block future requests from ID
Sitters -> Pet Care History (As proof of work, resumé)
View Sitters Profiles (Public)
