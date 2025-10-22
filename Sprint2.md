# 🐾 Sprint 2 — Profiles, Matching & Chat

This sprint builds on the backend foundation by adding user profiles, a basic matching flow, and initial chat functionality.

---

## 👤 User Profiles

- [ ] **Extend database schema with profile fields**  
  - Add fields: `bio`, `location`, `dog_breed` (for owners), `services_offered` (for sitters/kennels)  
  - **Done when:** Migration adds fields without breaking existing schema  

- [ ] **API: Create & update profile endpoint**  
  - `POST /profile` and `PUT /profile`  
  - Validate input  
  - **Done when:** Authenticated users can create/update their profile  

- [ ] **Frontend: Profile screen (React Native)**  
  - Simple form for creating/updating profile  
  - **Done when:** Submitting form updates backend and reflects changes  

---

## 🔗 Matching System (MVP)

- [ ] **Database: Add matches table**  
  - Fields: `owner_id`, `sitter_id`, `status` (pending, accepted, rejected)  
  - **Done when:** Migration creates table  

- [ ] **API: Matching endpoints**  
  - `POST /match` (owner requests sitter/kennel)  
  - `PUT /match/:id` (accept/reject)  
  - **Done when:** Matching logic works and updates DB  

- [ ] **Frontend: Match requests list**  
  - Owners see pending requests  
  - Sitters/kennels see requests they’ve received  
  - **Done when:** Lists are populated with real DB data  

---

## 💬 Chat (Basic Version)

- [ ] **Database: Messages table**  
  - Fields: `match_id`, `sender_id`, `message`, `timestamp`  
  - **Done when:** Migration creates table  

- [ ] **API: Chat endpoints**  
  - `POST /messages` (send message)  
  - `GET /messages/:matchId` (fetch chat history)  
  - **Done when:** Messages persist to DB and can be retrieved  

- [ ] **Frontend: Chat UI**  
  - Basic chat screen (list messages + input box)  
  - Polling or simple refresh (WebSockets can be later)  
  - **Done when:** Two matched users can exchange messages  

---

## 🧪 Testing

- [ ] **Unit tests for profile endpoints**  
  - Create + update success/failure cases  

- [ ] **Unit tests for matching logic**  
  - Owner can request sitter  
  - Sitter can accept/reject  
  - Invalid actions return proper error  

- [ ] **Integration tests for chat API**  
  - Sending + retrieving messages works correctly  

---