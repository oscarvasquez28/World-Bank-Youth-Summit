# 🌍 UNMAPPED

AI-powered infrastructure that connects real-world skills to economic opportunities.

---

## 🚀 Overview

UNMAPPED is a configurable system that translates informal, unstructured skills into standardized profiles and maps them to relevant jobs, training programs, and income pathways.

Instead of building a single app for one country, UNMAPPED is designed as an **infrastructure layer** that can be adapted to different regions using local data.

---

## 🧠 Problem

Millions of young people have valuable skills but lack formal credentials or the language to describe them.

At the same time, opportunities exist — but are hard to access due to:
- lack of standardization  
- mismatched terminology  
- country-specific differences in labor markets  

---

## 💡 Solution

UNMAPPED bridges this gap by:

1. **Understanding informal input**  
   Converts free-text skills into structured capabilities  

2. **Normalizing skills**  
   Maps them to standardized roles and competencies  

3. **Matching opportunities**  
   Connects users to jobs, training, and income pathways  

4. **Adapting to local contexts**  
   Uses country-specific data instead of hardcoded assumptions  

---

## ⚙️ How It Works

1. User inputs skills in natural language  
   > “I help customers and use Excel”

2. AI processes and normalizes the input  
   → customer support, data entry  

3. System matches against local opportunity data  

4. Returns:
   - relevant jobs  
   - estimated salary  
   - suggested next steps  

---

## 🌎 Local Configuration

UNMAPPED is powered by configurable country data.

Example:

```json
{
  "country": "MX",
  "currency": "MXN",
  "roles": [
    {
      "name": "Customer Service Assistant",
      "skills": ["customer support", "communication"],
      "salary_range": [8000, 12000]
    }
  ]
}
