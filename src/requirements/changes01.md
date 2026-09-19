# Change Request: Expand Civic DNA Topic Framework

## Objective

Expand the existing Civic DNA topic system from its current small/demo topic set into a production-ready framework capable of capturing the major civic, political, economic, technological, social, and geopolitical issues defining the current global moment.

The goal is **not simply to increase the number of topics to 25**. The system should contain however many distinct issues are necessary to meaningfully capture the current civic landscape, with an initial target of approximately **20–25 topics**.

The existing JSON structure, scoring methodology, and downstream compatibility should be preserved wherever possible.

---

# 1. Preserve the Existing Core Scoring Model

The existing system uses:

```json
{
  "min": 0,
  "max": 100,
  "neutral": 50
}
```

Continue using this scale.

Maintain the invariant:

* `min = 0`
* `max = 100`
* `neutral = 50`

Do not introduce asymmetric scales.

Each topic should continue to have:

```json
{
  "id": "...",
  "topicName": "...",
  "category": "...",
  "description": "...",
  "leftAnchorLabel": "...",
  "rightAnchorLabel": "...",
  "nationalAvg": "...",
  "demographicSplits": "...",
  "source": "...",
  "weight": "..."
}
```

Do not break existing consumers of this schema without providing a migration path.

---

# 2. Expand the Topic Universe

Replace the current limited/demo topic list with a broader topic framework.

Target approximately **22 topics initially**, rather than artificially forcing exactly 25.

The system should prioritize **distinctiveness and coverage over hitting an arbitrary number**.

The topics should represent the major issues currently shaping civic identity and public debate.

The initial proposed topics are:

### Technology

1. Artificial Intelligence Governance
2. AI Automation & the Future of Work
3. AI Data Centers & Infrastructure
4. Cryptocurrency & Digital Assets
5. Digital Privacy & Surveillance
6. Big Tech, Platforms & Online Speech

### Geopolitics & Security

7. Israel, Palestine & Gaza
8. Iran & Middle East Security
9. Russia, Ukraine & European Security
10. U.S.–China Strategic Competition
11. Defense Spending & Military Intervention
12. Immigration & Border Policy

### Economy / Environment / Society

13. Climate Change & Environmental Policy
14. Energy Security & Nuclear Power
15. Cost of Living & Inflation
16. Housing Affordability & Homelessness
17. Taxation, Wealth & Inequality
18. Labor Unions & Worker Power
19. Healthcare System & Access
20. Democracy, Elections & Institutional Power
21. Social Rights & Personal Autonomy
22. Education & Public Schools
23. Firearm Regulation

The implementation should allow the list to grow or shrink without requiring application logic changes.

---

# 3. Use the Following Topic Definitions

Implement the following descriptions and policy spectra.

## 1. Artificial Intelligence Governance

**ID:** `artificial-intelligence-governance`

Description:

> How should governments balance rapid AI development and private innovation against safety requirements, accountability, transparency, and restrictions on high-risk uses?

Anchors:

* `leftAnchorLabel`: `Minimal AI Regulation`
* `rightAnchorLabel`: `Comprehensive AI Oversight`

Suggested weight: `1.4`

---

## 2. AI Automation & the Future of Work

**ID:** `ai-automation-and-work`

Description:

> As AI changes or replaces parts of human work, should society prioritize unrestricted automation and productivity, or require stronger worker protections, transition support, and redistribution of its gains?

Anchors:

* `leftAnchorLabel`: `Unrestricted Automation`
* `rightAnchorLabel`: `Strong Worker Protection`

Suggested weight: `1.2`

---

## 3. AI Data Centers & Infrastructure

**ID:** `data-center-infrastructure`

Description:

> How should communities and governments manage the construction of energy- and water-intensive data centers, including their effects on electricity prices, land, jobs, water, and the power grid?

Anchors:

* `leftAnchorLabel`: `Fast Private-Led Expansion`
* `rightAnchorLabel`: `Strict Public Planning & Cost Controls`

Suggested weight: `1.1`

---

## 4. Cryptocurrency & Digital Assets

**ID:** `cryptocurrency-and-digital-assets`

Description:

> Should cryptocurrency and decentralized financial systems operate with broad freedom from government control, or should governments impose extensive consumer protections, financial rules, and oversight?

Anchors:

* `leftAnchorLabel`: `Open Crypto Markets`
* `rightAnchorLabel`: `Strict Financial Regulation`

Suggested weight: `0.9`

---

## 5. Digital Privacy & Surveillance

**ID:** `digital-privacy-and-surveillance`

Description:

> How should society balance personal data privacy and limits on government and corporate surveillance against security, law enforcement, and the convenience of data-driven services?

Anchors:

* `leftAnchorLabel`: `Broad Data Freedom & Access`
* `rightAnchorLabel`: `Strong Privacy & Surveillance Limits`

Suggested weight: `1.1`

---

## 6. Big Tech, Platforms & Online Speech

**ID:** `platform-power-and-online-speech`

Description:

> Should large online platforms have broad discretion over moderation and product design, or should governments impose stronger competition rules, platform accountability, and protections for online speech and users?

Anchors:

* `leftAnchorLabel`: `Platform Autonomy`
* `rightAnchorLabel`: `Strong Platform Regulation`

Suggested weight: `1.1`

---

## 7. Israel, Palestine & Gaza

**ID:** `palestine-israel-and-gaza`

Description:

> What approach should the United States take toward the Israeli-Palestinian conflict, including civilian protection, humanitarian assistance, military aid, Palestinian self-determination, Israeli security, settlements, accountability, and the political future of Gaza?

Anchors:

* `leftAnchorLabel`: `Unconditional Strategic Support for Israel`
* `rightAnchorLabel`: `Conditional Aid & Strong Palestinian Self-Determination`

Suggested weight: `1.4`

This topic must be handled as a policy question. Do not frame the survey as support for or opposition to a population, ethnicity, nationality, or religion.

---

## 8. Iran & Middle East Security

**ID:** `iran-and-middle-east-policy`

Description:

> Should the United States prioritize military deterrence and pressure against Iran, or emphasize diplomacy, negotiated limits on nuclear capabilities, sanctions relief, and reduced military involvement in the region?

Anchors:

* `leftAnchorLabel`: `Military Deterrence & Maximum Pressure`
* `rightAnchorLabel`: `Diplomacy & Reduced Military Involvement`

Suggested weight: `1.3`

---

## 9. Russia, Ukraine & European Security

**ID:** `russia-ukraine-war`

Description:

> What role should the United States play in the Russia-Ukraine war and European security, including military assistance, sanctions, negotiations, territorial questions, and long-term security commitments?

Anchors:

* `leftAnchorLabel`: `Limited U.S. Involvement`
* `rightAnchorLabel`: `Sustained Support for Ukraine & European Security`

Suggested weight: `1.2`

---

## 10. U.S.–China Strategic Competition

**ID:** `china-us-strategic-competition`

Description:

> How should the United States manage its relationship with China across trade, technology, Taiwan, military power, diplomacy, and economic interdependence?

Anchors:

* `leftAnchorLabel`: `Engagement & Economic Interdependence`
* `rightAnchorLabel`: `Strategic Containment & Reduced Dependence`

Suggested weight: `1.3`

---

## 11. Defense Spending & Military Intervention

**ID:** `defense-spending-and-intervention`

Description:

> How much should the United States spend on defense, and when should it use military force abroad to defend allies, deter threats, protect national interests, or respond to humanitarian crises?

Anchors:

* `leftAnchorLabel`: `Restrained Defense & Non-Intervention`
* `rightAnchorLabel`: `Expanded Defense & Active Intervention`

Suggested weight: `1.1`

---

## 12. Immigration & Border Policy

**ID:** `immigration-and-border-policy`

Description:

> How should the United States balance border enforcement, legal immigration, asylum, deportation, labor needs, humanitarian obligations, and pathways to legal status?

Anchors:

* `leftAnchorLabel`: `Open Immigration & Expanded Legal Entry`
* `rightAnchorLabel`: `Strict Border Enforcement & Restricted Entry`

Suggested weight: `1.3`

---

## 13. Climate Change & Environmental Policy

**ID:** `climate-change-and-environment`

Description:

> How aggressively should governments act to reduce greenhouse-gas emissions and protect ecosystems, including through regulation, carbon pricing, public investment, and restrictions on high-emission activities?

Anchors:

* `leftAnchorLabel`: `Market-Led Climate Adaptation`
* `rightAnchorLabel`: `Aggressive Public Climate Action`

Suggested weight: `1.3`

---

## 14. Energy Security & Nuclear Power

**ID:** `energy-and-nuclear-power`

Description:

> How should governments balance affordable and reliable energy, fossil-fuel production, renewable energy, nuclear power, energy independence, and emissions reduction?

Anchors:

* `leftAnchorLabel`: `Energy Abundance & Market Choice`
* `rightAnchorLabel`: `Planned Clean-Energy Transition`

Suggested weight: `1.1`

---

## 15. Cost of Living & Inflation

**ID:** `cost-of-living-and-inflation`

Description:

> What should governments prioritize when addressing high prices and declining affordability, including monetary policy, fiscal spending, competition, price controls, and income support?

Anchors:

* `leftAnchorLabel`: `Market Adjustment & Fiscal Restraint`
* `rightAnchorLabel`: `Active Government Price & Income Intervention`

Suggested weight: `1.3`

---

## 16. Housing Affordability & Homelessness

**ID:** `housing-affordability`

Description:

> How should governments address housing costs and homelessness through zoning reform, private construction, public housing, rent regulation, housing assistance, and supportive services?

Anchors:

* `leftAnchorLabel`: `Private Housing Markets & Deregulation`
* `rightAnchorLabel`: `Public Housing & Strong Housing Intervention`

Suggested weight: `1.2`

---

## 17. Taxation, Wealth & Inequality

**ID:** `taxation-inequality-and-wealth`

Description:

> How should governments distribute the costs and benefits of economic growth, including taxes on income, wealth, corporations, capital gains, and inheritances, as well as social transfers?

Anchors:

* `leftAnchorLabel`: `Low Taxes & Limited Redistribution`
* `rightAnchorLabel`: `Progressive Taxation & Strong Redistribution`

Suggested weight: `1.2`

---

## 18. Labor Unions & Worker Power

**ID:** `labor-unions-and-worker-power`

Description:

> How much power should workers and labor unions have in setting wages, working conditions, benefits, and workplace rules, and how should this be balanced against employer flexibility?

Anchors:

* `leftAnchorLabel`: `Employer Flexibility`
* `rightAnchorLabel`: `Strong Collective Worker Power`

Suggested weight: `1.0`

---

## 19. Healthcare System & Access

**ID:** `healthcare-system`

Description:

> Should healthcare be guaranteed through a more publicly funded and regulated system, or should private insurance, competition, and individual choice remain the primary means of providing coverage?

Anchors:

* `leftAnchorLabel`: `Private Market Healthcare`
* `rightAnchorLabel`: `Universal Publicly Guaranteed Coverage`

Suggested weight: `1.2`

---

## 20. Democracy, Elections & Institutional Power

**ID:** `democracy-and-institutional-trust`

Description:

> How should the political system balance broad participation, election access, institutional checks and balances, executive power, election administration, and safeguards against abuse of power?

Anchors:

* `leftAnchorLabel`: `Decentralized Governance & Executive Flexibility`
* `rightAnchorLabel`: `Strong Institutional Checks & Broad Participation`

Suggested weight: `1.3`

---

## 21. Social Rights & Personal Autonomy

**ID:** `social-rights-and-personal-autonomy`

Description:

> How should governments balance individual freedom in matters of identity, reproduction, sexuality, religion, and personal life against collective norms, public interests, and legal restrictions?

Anchors:

* `leftAnchorLabel`: `Maximum Personal Autonomy`
* `rightAnchorLabel`: `Greater Public Regulation & Traditional Social Norms`

Suggested weight: `1.2`

---

## 22. Education & Public Schools

**ID:** `education-and-public-schools`

Description:

> How should society organize and fund education, including public schools, school choice, curriculum authority, parental rights, higher education, and the role of government in educational opportunity?

Anchors:

* `leftAnchorLabel`: `School Choice & Decentralized Control`
* `rightAnchorLabel`: `Strong Public Education & Central Standards`

Suggested weight: `1.0`

---

## 23. Firearm Regulation

**ID:** `firearm-regulation`

Description:

> Should the federal government tighten or relax the rules around who can buy guns, which weapons are legal, and how firearms are carried in public?

Anchors:

* `leftAnchorLabel`: `Broad Firearm Access`
* `rightAnchorLabel`: `Strict Firearm Regulation`

Suggested weight: `1.0`

---

# 4. Important: Do Not Fabricate Demographic Data

For all newly added topics:

```json
"nationalAvg": null,
"demographicSplits": null,
"source": null
```

unless the system already has a verified data pipeline capable of supplying these values.

Do **not** invent averages or demographic differences merely to populate the UI.

The production architecture should support subsequently adding:

```json
"nationalAvg": 54,
"demographicSplits": {
  "gender": {},
  "race": {},
  "income": {},
  "urbanicity": {}
},
"source": "..."
```

once empirical data has been validated.

---

# 5. Improve the Meaning of the Anchors

The existing system calls the endpoints `leftAnchorLabel` and `rightAnchorLabel`.

Retain those field names for backwards compatibility.

However, do **not** interpret them as literal political "left" and "right."

They represent the two ends of a particular policy spectrum.

For example:

```text
Private Market Healthcare ←—— 50 ——→ Universal Public Coverage
```

does not necessarily mean:

```text
Republican ←—— 50 ——→ Democrat
```

The Civic DNA system should therefore avoid describing the resulting score as simply "left-wing" or "right-wing."

The purpose of the model is to identify a person's **pattern of civic positions across issues**.

---

# 6. Add Salience as a Separate Concept

If the existing questionnaire architecture permits it, introduce a separate per-topic measurement:

```json
{
  "position": 67,
  "salience": 82,
  "confidence": 74
}
```

Definitions:

* `position`: where the respondent falls on the issue spectrum.
* `salience`: how important the issue is to the respondent.
* `confidence`: how certain the respondent is about their position.

Do not automatically make these required fields if doing so would break the current system.

If this requires a larger architectural change, implement it as a backwards-compatible extension.

This distinction is important because someone who is neutral on crypto because they don't care about it should not necessarily be treated identically to someone who has deeply considered crypto and genuinely occupies the ideological midpoint.

---

# 7. Account for Multi-Dimensional Issues

Do not assume that every topic is fundamentally one-dimensional simply because the current database represents it with one score.

In particular, flag these topics for future multi-question modeling:

* Artificial Intelligence
* Israel / Palestine / Gaza
* Iran
* Democracy
* China
* Climate / Energy
* Big Tech / Online Speech

For the first implementation, retain the existing 0–100 topic score for compatibility.

However, structure the code so that a topic can eventually contain multiple underlying dimensions.

Potential future structure:

```json
{
  "id": "artificial-intelligence-governance",
  "dimensions": [
    "innovation_vs_regulation",
    "open_vs_controlled_models",
    "automation_vs_worker_protection",
    "privacy_vs_ai_surveillance"
  ]
}
```

Do not implement this multi-dimensional model unless necessary for the current application; simply avoid hard-coding assumptions that make it impossible later.

---

# 8. Separate Permanent and Current-Moment Issues

Architect the topic system so topics can eventually have a lifecycle/status.

Suggested optional fields:

```json
{
  "topicStatus": "core",
  "activeFrom": null,
  "activeUntil": null
}
```

Potential values:

* `core` — durable civic issue
* `current` — important to the present political moment
* `emerging` — growing issue
* `archived` — no longer actively used

This will allow Civic DNA to evolve.

For example, AI may become a permanent core topic, while a particular geopolitical crisis may eventually move into an archived state.

---

# 9. Do Not Force Exactly 25 Topics

The application should not contain logic such as:

```javascript
if (topics.length !== 25) throw ...
```

The number should be configurable.

Use:

```json
"totalTopics": 23
```

based on the actual active topic list.

The editorial target is approximately 20–25.

The correct number is the smallest number that provides meaningful coverage of the civic landscape without creating redundant measurements.

---

# 10. Update Metadata

The resulting metadata should resemble:

```json
"meta": {
  "schemaVersion": 2,
  "totalTopics": 23,
  "scale": {
    "min": 0,
    "max": 100,
    "neutral": 50
  },
  "dataStatus": "Editorial topic framework; demographic data pending validation",
  "geographicScope": "United States civic attitudes with global issues included"
}
```

Increment the schema version because the topic model is being substantially expanded.

If the existing application has strict schema compatibility requirements, implement a migration rather than breaking existing stored data.

---

# 11. Preserve Existing User Data

Existing respondent records must remain valid.

Do not reinterpret historical scores simply because the topic list has expanded.

If a historical respondent has:

```json
{
  "firearm-regulation": 72,
  "universal-healthcare": 61,
  "trade-offshoring": 44
}
```

those scores should continue to mean exactly what they meant under the old schema.

New topics should be represented as missing/null for historical respondents until the respondent answers them.

Do not automatically assign neutral `50` to unanswered questions unless the existing scoring architecture explicitly requires it.

---

# 12. Composite Civic DNA Calculation

Review the existing composite calculation to ensure that adding topics does not unintentionally cause the new issues to dominate the result.

At minimum, use topic weights so that:

```text
Civic DNA =
Σ(position × topicWeight)
────────────────────────
Σ(topicWeight)
```

For a respondent who has not answered a topic, exclude that topic from both numerator and denominator rather than treating it as a neutral answer.

If salience is implemented, consider eventually supporting:

```text
effectiveWeight =
topicWeight × respondentSalience
```

but do not silently introduce this into the existing score without testing because it changes the meaning of historical Civic DNA results.

---

# 13. Validation Requirements

Add validation tests for:

### Schema

* Every topic has a unique `id`.
* Every topic has a `topicName`.
* Every topic has a description.
* Every topic has both anchor labels.
* Every topic has a valid weight > 0.
* No topic has duplicate IDs.
* `neutral === (min + max) / 2`.

### Scoring

* Scores cannot fall below 0.
* Scores cannot exceed 100.
* 50 remains the exact neutral midpoint.
* Missing topics do not automatically become 50 unless explicitly configured.
* Topic weights are normalized correctly.
* Existing respondent scores remain backward compatible.

### Editorial

Detect potentially duplicated topics.

For example:

* Healthcare vs Universal Healthcare
* AI Governance vs AI Automation
* Climate vs Energy
* Taxation vs Inequality

These should remain separate only when the underlying questions actually measure materially different beliefs.

---

# 14. UX Expectations

The expanded topic system should not feel like a 23-question partisan quiz.

The UI should present each topic as a genuine policy question.

For example:

> **AI & Government**
>
> How should society balance rapid AI innovation with government oversight of powerful or high-risk AI systems?
>
> `Minimal Regulation ───────────── Comprehensive Oversight`

The respondent should understand the issue without needing to know the political terminology associated with it.

Avoid partisan labels such as:

* Democrat
* Republican
* Liberal
* Conservative
* Left
* Right

as the primary response choices.

Those labels can be derived later if desired, but they should not define the underlying Civic DNA model.

---

# 15. Acceptance Criteria

The change is complete when:

1. The existing Civic DNA system supports approximately 20–25 active topics.
2. The initial implementation contains the 23 topics specified above.
3. Existing topic IDs remain compatible with historical data.
4. New topics follow the existing JSON structure.
5. The 0–100 scoring system remains unchanged.
6. `50` remains the exact mathematical midpoint.
7. New demographic statistics are not fabricated.
8. The system supports missing/null demographic data.
9. The composite score correctly handles unanswered topics.
10. Topic weights are supported.
11. The topic list can grow or shrink without application-code changes.
12. The system does not equate the Civic DNA score with a simple left/right political identity.
13. The architecture leaves room for future multi-dimensional topics.
14. The architecture supports distinguishing durable "core" issues from temporary "current moment" issues.
15. Existing respondent data and historical Civic DNA scores are not silently changed.

## Final Product Principle

The Civic DNA system should answer:

> **"What combination of civic issues, values, and policy instincts describes this person?"**

rather than merely:

> **"How liberal or conservative is this person?"**

The expanded topic set should therefore maximize **coverage of the civic landscape, independence between measurements, and temporal relevance** rather than maximizing the number of questions.
