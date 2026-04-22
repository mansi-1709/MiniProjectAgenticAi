# 6.5 System Agentization (The Core AI Integration)

The most architecturally significant engineering decision in PharmaBooks is the design of a fully modular, multi-agent AI backend. Rather than consolidating all intelligence into a single monolithic service, each reasoning concern is encapsulated as an independent agent class located under `/backend/src/agents/`. Every agent follows a consistent contract: it accepts a structured input, executes its domain logic (with or without an LLM call), and returns a standardized response object containing `success`, `data`, `reasoning`, and `executionTimeMs` fields. This design enables composability, independent testability, and observability at the agent level.

The system comprises eight agents as described below.

---

## 6.5.1 ConversationalPharmacistAgent.js

**Purpose:** This is the primary patient-facing intelligence layer and the most complex agent in the system. It simulates the reasoning of a licensed pharmacist during a real-time consultation.

**Operational Logic:**
When a pharmacist submits a patient message through the chat interface, this agent executes a multi-step pipeline:
1. Retrieves the patient record from MongoDB including age and known medical conditions.
2. Fetches the patient's complete approved-order history from the `Order` collection to understand prior medication exposure.
3. Queries all in-stock medicines from the `Medicine` collection.
4. Constructs a detailed system prompt embedding all of the above context and submits it to GPT-4 via the OpenAI Chat Completions API.
5. Receives a structured JSON response from the LLM specifying a `conversationType` (e.g., `needs_recommendation`, `needs_clarification`, `direct_order`, `prescription_required`), recommended medicines with dosage durations, safety warnings, and clarification questions.
6. Processes the AI output to either generate a confirmed order, request a human decision, or return educational guidance.

**Symptom-First Enforcement:** The agent system prompt contains an explicit rule that if the incoming message is solely a medicine name with no symptom or condition context, the agent must return `needs_clarification` and prompt for symptoms before proceeding. This prevents unsafe direct dispensing without clinical justification.

**Key Parameters:**
- Model: `gpt-4`
- Temperature: `0.3` (deterministic, clinically reliable outputs)
- Response format: Structured JSON object
- Fallback: Graceful degradation to safe error messaging if the LLM call fails

---

## 6.5.2 RecommendationAgent.js

**Purpose:** Provides AI-powered secondary medicine recommendations when a pharmacist or patient provides a symptom or condition but has not specified a medicine.

**Operational Logic:**
1. Queries the patient's past 10 approved orders to identify previously used medicines (history-informed recommendations).
2. Retrieves all in-stock medicines from the database with price, unit, stock quantity, and prescription flag.
3. Submits the combined context to GPT-4 to produce a `primaryRecommendation` and a list of `alternatives`, each with reasoning and dosage advice.
4. Applies age-sensitive rules directly in the LLM system prompt: elderly patients (60+) receive gentler medication recommendations; paediatric patients (<18) receive age-appropriate dosages.

**Output Schema:**
```json
{
  "primaryRecommendation": { "medicineName": "...", "reason": "...", "dosageAdvice": "..." },
  "alternatives": [{ "medicineName": "...", "reason": "..." }],
  "warnings": ["..."],
  "needsPrescription": true
}
```

**Fallback:** If the OpenAI call fails, the agent returns a safe fallback response advising manual consultation, rather than throwing an unhandled exception.

---

## 6.5.3 OrderingAgent.js

**Purpose:** Handles the structured processing of a confirmed medicine dispensing request, translating a pharmacist's chat instruction into a validated database order entry.

**Operational Logic:**
The `OrderingAgent` performs exclusively rule-based (non-LLM) processing. It receives a confirmed medicine name and quantity, validates the request against the current stock in MongoDB, checks the prescription requirement flag, deducts the appropriate stock quantity atomically, computes the billing total, and writes an `Order` document to the database. The agent ensures that all quantity values are non-negative integers and that rejected orders include an explicit `rejectionReason` field for audit traceability.

**Design Rationale:** By keeping order commitment logic outside the LLM processing pipeline, the system ensures that irreversible database mutations (stock deductions, order creation) are deterministic and do not depend on the probabilistic output of a language model.

---

## 6.5.4 SafetyAgent.js

**Purpose:** Acts as a pre-dispensing validation gate, analytically assessing each medicine request against a set of clinical and regulatory safety criteria before an order is committed.

**Operational Logic:**
The `SafetyAgent` receives a proposed order payload and evaluates it against multiple safety dimensions:
1. **Prescription Enforcement:** Queries the `Medicine` document's `prescriptionRequired` boolean. If `true` and no valid prescription reference exists, the agent returns `REJECTED` with the reason `prescription_required`.
2. **Stock Sufficiency:** Verifies that requested quantity does not exceed current `stockQty`. An order requesting more than available stock is rejected with `insufficient_stock`.
3. **Duplicate/Redundant Order Detection:** Inspects the patient's recent order history to flag if the same medicine was dispensed within a recent time window, returning a `warning` flag rather than a hard rejection.
4. **Dosage Sanity:** Validates that the requested quantity falls within a reasonable per-visit dispensing range based on the medicine's declared unit type.

All safety checks are executed synchronously without LLM involvement, ensuring that regulatory enforcement logic is not subject to AI non-determinism.

---

## 6.5.5 InventoryRefillAgent.js

**Purpose:** Monitors post-order stock levels and generates intelligent, urgency-graded refill alerts when a medicine's quantity falls at or below its configured `minStockThreshold`.

**Operational Logic:**
1. Triggered automatically following every approved order via the order processing pipeline.
2. Computes the ratio of `currentStock / minStockThreshold` to determine urgency classification: `CRITICAL` (0%), `HIGH` (1–25%), `MEDIUM` (26–50%), `LOW` (51–100%).
3. Submits the medicine name, current stock, and threshold values to GPT-4 for a context-aware `recommendedRefillQty` and human-readable `reasoning` string.
4. Returns a structured `alertData` object consumed by the `NotificationAgent` for downstream dispatch.

**Fallback:** A deterministic rule-based calculation (using threshold multipliers) activates if the LLM call fails, ensuring the system always produces a refill recommendation.

---

## 6.5.6 NotificationAgent.js

**Purpose:** A multi-channel notification dispatcher responsible for broadcasting operational alerts generated by other agents (primarily `InventoryRefillAgent`) to system administrators and pharmacy staff.

**Operational Logic:**
The `NotificationAgent` receives a `type` and `data` payload and routes a formatted notification through up to three channels simultaneously:
1. **Email (SMTP):** Uses `nodemailer` configured against the `EMAIL_HOST`, `EMAIL_USER`, and `EMAIL_PASS` environment variables to send structured alert emails for events including `LOW_STOCK`, `ORDER_APPROVED`, and `ORDER_REJECTED`.
2. **Webhook:** If a `WEBHOOK_URL` is configured in the environment, the agent dispatches a Slack-compatible block-kit message payload via HTTP POST using `axios`, enabling real-time integration with team communication tools.
3. **Console Logging:** Always logs the notification payload to the server console, ensuring visibility even in environments where email/webhook are not configured.

**Design:** The agent is intentionally non-blocking. Failures on any individual notification channel are caught and individually recorded in the response object without terminating the broader order processing pipeline.

---

## 6.5.7 InventoryNLPAgent.js

**Purpose:** Enables pharmacists to update medicine stock quantities using free-form natural language commands, eliminating the need to navigate table-based forms for routine restocking operations.

**Operational Logic:**
1. Receives a plain-text command such as *"add 30 amoxicillin in stock"* or *"set paracetamol to 100"*.
2. Submits the command to GPT-4 with a tightly scoped system prompt that extracts three fields: `action` (`add` / `subtract` / `set`), `quantity` (integer), and `medicineName` (string). Temperature is set to `0.1` for maximum parse consistency.
3. Performs a fuzzy medicine name lookup against MongoDB using case-insensitive regex, attempting an exact match first and then a partial match.
4. Applies the stock change atomically: `add` increments `stockQty`, `subtract` decrements it (floor zero), `set` replaces the value absolutely.
5. Returns a confirmation message, old and new stock values, and a low-stock warning flag if the resulting quantity falls at or below the medicine's `minStockThreshold`.

**Dual Parse Strategy:** If the GPT-4 call fails or times out, the agent automatically falls back to a regex-based parser covering common command patterns, ensuring operational continuity without LLM dependency.

**Exposed via:** `POST /api/inventory-agent/update` — accessible to both `pharmacist` and `admin` roles.

---

## 6.5.8 ObservabilityAgent.js

**Purpose:** Provides complete operational visibility into the multi-agent runtime by recording structured execution logs for every agent invocation into a persistent MongoDB collection.

**Operational Logic:**
The `ObservabilityAgent` intercepts agent execution results at the conclusion of each operation and persists a log document to the `AgentLog` schema. Each log entry captures:
- `agentName` — which agent produced the log
- `orderId` — the associated order (if applicable)
- `input` — the raw inputs provided to the agent
- `output` — the full structured response returned by the agent
- `reasoning` — the agent's self-described decision rationale
- `executionTimeMs` — wall-clock execution duration in milliseconds
- `timestamp` — UTC timestamp of log creation

These records are queryable through the Admin Dashboard under the **Logs** tab via `GET /api/logs`, allowing administrators to audit every AI decision, trace failed recommendations, monitor execution latencies, and validate that safety rules were correctly applied at every stage.

**Design:** The `ObservabilityAgent` is the only agent that does not perform domain logic. Its exclusive responsibility is to establish administrative accountability over the agentic layer, fulfilling the non-functional requirement of system auditability.

---

## 6.5.9 Agent Interaction Summary

The following table summarises the complete agent registry:

| # | Agent | LLM Used | Trigger | Primary Output |
|---|-------|----------|---------|----------------|
| 1 | ConversationalPharmacistAgent | GPT-4 | Pharmacist chat message | Medication recommendation / Order |
| 2 | RecommendationAgent | GPT-4 | Symptom-based query | Primary + alternative medicines |
| 3 | OrderingAgent | None | Confirmed dispensing request | Database Order record, bill |
| 4 | SafetyAgent | None | Pre-order validation | Approve / Reject + reason |
| 5 | InventoryRefillAgent | GPT-4 | Post-order stock deduction | Refill alert with urgency level |
| 6 | NotificationAgent | None | Refill/order events | Email + Webhook + Console alert |
| 7 | InventoryNLPAgent | GPT-4 | Pharmacist NL stock command | Stock quantity update |
| 8 | ObservabilityAgent | None | Post-execution of any agent | Persistent audit log entry |

---

*This modular architecture ensures that each concern — clinical safety, recommendation quality, stock management, and operational visibility — is independently maintainable, testable, and replaceable without affecting any other component of the system.*
