# 🛠️ RailGuard AI Platform — Master Integration Contract & API Specification

**Author:** Master Integrator (OCC & Portals Lead)  
**Target Team:** Ritu (AI/OCC Backend Lead), Rewas (Driver & Passenger Portals Lead), & Live Map Team  
**Sector:** 100km Ambala-Kurukshetra-Panipat Sector  

---

## 🎯 Objective
This document defines the **strict API Contract and Integration Checklist** between Ritu's Express/Gemini AI OCC server, Rewas's Passenger and Driver Portals, and the Live Railway Movement Simulation Map.

---

## 🆔 1. Standardized Train ID Mapping

To prevent cross-platform crashes during live fetching, all endpoints, map components, and portals **MUST** use these standardized Train IDs:

| Standardized Train ID | Train Name | Type | Direction | Route | Priority | Special SLA Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `T1_Local` | Local 1 (`64511`) | Local Passenger | DOWN | Station B $\rightarrow$ Station A (Return) | Priority 4 | Crossover synchronization at km 50 |
| `T2_Local` | Local 2 (`64532`) | Local MEMU | UP | Station A $\rightarrow$ Station C | Priority 4 | Dynamic rolling overtake candidate |
| `T3_Express` | Express (`12926`) | Express | UP | Station A $\rightarrow$ Station C | Priority 2 | Preemptive speed regulation (Loop 2) |
| `T4_Fast` | Fast Train (`12012` Vande Bharat) | High-Speed Premium | UP | Station A $\rightarrow$ Station C | Priority 1 | Green Wave priority route |
| `T5_Freight` | Heavy Freight (`BOXN-582`) | 5,000t Freight | UP | Station A $\rightarrow$ Station C | Priority 4 | **₹4.5 Lakh Power Plant Coal SLA** |

*Note: Ritu's backend includes an automatic alias resolver supporting `T1_Local`, `64511`, or `Local 1`.*

---

## 🔌 2. Core API Endpoints Specification

Ritu's Express server runs on `http://localhost:3001` (or deployed host).

### Endpoint 1: The Timeline Feed (For Live Map UI)
- **Route:** `GET /api/occ/timeline`
- **Response:**
```json
{
  "sector": "100km Ambala-Kurukshetra-Panipat Sector",
  "total_steps": 6,
  "active_step": 1,
  "current_minute": 16,
  "simulation_timeline": [ ... ]
}
```

### Endpoint 2: The Driver Portal Hook (For Rewas's Loco Pilot App)
- **Route:** `GET /api/driver/messages/:train_id`
- **Example Request:** `GET /api/driver/messages/T2_Local`
- **Response:**
```json
{
  "timestamp": "2026-08-22T19:30:00.000Z",
  "simulation_minute": 16,
  "time_label": "07:16 AM (Min 16)",
  "train_id": "T2_Local",
  "standardized_id": "T2_Local",
  "llm_hit": true,
  "active_advisories": [
    {
      "train": "Local 2",
      "message": "AI ALERT: Do not halt. Maintain 45 km/h. Take Loop Line 1 at km 30 for rolling overtake by Express. Mainline reentry at km 32."
    }
  ]
}
```

### Endpoint 3: The Live Train Status & PNR/Food Vendor Feed (For Passenger Portal)
- **Route:** `GET /api/passenger/status/:train_id`
- **Example Request:** `GET /api/passenger/status/T3_Express`
- **Response:**
```json
{
  "timestamp": "2026-08-22T19:30:00.000Z",
  "minute": 21,
  "time_label": "07:21 AM (Min 21)",
  "train_id": "T3_Express",
  "standardized_id": "T3_Express",
  "train_name": "Express",
  "current_position_km": 46,
  "speed_kmh": 30,
  "status": "DIVERTED",
  "delay_minutes": 3,
  "legacy_delay_minutes": 28,
  "time_saved_by_ai": 25,
  "llm_rerouting_active": true,
  "pnr_update_banner": "AI Rerouting Active. Recovering 25 mins of delay.",
  "food_delivery_prediction": {
    "station": "Station C (Panipat Jn)",
    "original_eta": "08:15 AM",
    "updated_eta": "08:00 AM +3m",
    "vendor_instruction": "FOOD VENDOR ALERT: On-time arrival recovered by AI! Prepare order for Coach B4 at 08:00 AM sharp."
  }
}
```

---

## ⚡ 3. Simulation Control & Synchronization Endpoints

- **Get Active Step:** `GET /api/occ/step`
- **Advance Step (Broadcasts via WebSocket):** `POST /api/occ/step/next`
- **Set Specific Step:** `POST /api/occ/step/set` (Body: `{ "stepIndex": 3 }`)

---

## ✅ 4. Master Integration Checklist

Before starting the live pitch, verify every item:

- [x] **CORS Enabled**: `app.use(cors())` is active on Express server.
- [x] **Consistent Train IDs**: Standardized IDs (`T1_Local` through `T5_Freight`) mapped app-wide.
- [x] **WebSocket Event Broadcasting**: Socket.io event `step:update` emitted to sync map and portals.
- [x] **Fallback Hardcoding**: Server falls back to pre-generated JSON if Gemini API is rate-limited.
- [x] **Food Vendor & PNR Reactivity**: Rewas's passenger portal pings `/api/passenger/status/:train_id` to update ETA and vendor orders dynamically when `llm_hit` fires.

---

## 🧪 5. Verification Commands

Run the backend server:
```bash
npm run server
```

Test endpoints in terminal:
```bash
# 1. Timeline feed
curl http://localhost:3001/api/occ/timeline

# 2. Driver Portal message for Local 2
curl http://localhost:3001/api/driver/messages/T2_Local

# 3. Passenger Portal PNR & Food Vendor status for Express
curl http://localhost:3001/api/passenger/status/T3_Express

# 4. Advance timeline step across all portals
curl -X POST http://localhost:3001/api/occ/step/next
```
