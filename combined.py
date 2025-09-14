
import os

from logics import AutoInsuranceFraudDetector  # your first system
from perpbot import get_catboost_prediction, analyze_claim_perplexity

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")


def hybrid_fraud_analysis(claim_df, rule_scores):
    # --- Step 1: Rule-based score (precomputed for all claims) ---
    cid = claim_df.iloc[0]["policy_number"]
    rule_result = rule_scores.get(cid, {"score": 0})
    rule_score = rule_result["score"]

    # --- Step 2: CatBoost prediction (per-claim) ---
    catboost_result = get_catboost_prediction(claim_df)
    catboost_prob = catboost_result.get("fraud_probability", 0.0)

    # --- Step 3: Combine scores ---
    combined_score = (0.6 * (rule_score / 100) + 0.4 * catboost_prob) * 100

    # --- Step 4: Phase 1 → Call Perplexity for reasoning ---
    claim_details = claim_df.iloc[0].to_dict()
    evidence = {
        "rule_based_score": rule_score,
        "catboost_result": catboost_result,
        "combined_score": combined_score
    }

    ai_result = analyze_claim_perplexity(
        claim_details=claim_details,
        catboost_result=evidence,
        extra_docs=None,
        api_key=PERPLEXITY_API_KEY
    )

    # --- Step 5: Handle AI requesting extra documents ---
    import base64, os
    def load_image_as_base64(path: str) -> str:
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    if ai_result.get("action") == "request_documents":
        extra_docs = {
            "photo_with_plate": {
                "filename": "vehicle_front_plate.png",
                "content": load_image_as_base64("C:/Users/acqul/OneDrive/Desktop/Fraud/fraud/vehicle_front_plate.png"),
                "type": "image/png"
            },
            "service_bill": {
                "filename": "service_invoice.png",
                "content": load_image_as_base64("C:/Users/acqul/OneDrive/Desktop/Fraud/fraud/service_invoice.png"),
                "type": "image/png"
            }
        }

        ai_result = analyze_claim_perplexity(
            claim_details=claim_details,
            catboost_result=evidence,
            extra_docs=extra_docs,
            api_key=PERPLEXITY_API_KEY
        )

        ai_result["follow_up_questions"] = []
        ai_result["action"] = "final_decision"

    # --- Step 6: Sync fraud_score ---
    ai_result["fraud_score"] = round(combined_score, 2)

    return ai_result


def run_batch_analysis(user_data):
    # --- Step A: Run rule-based analysis on ALL claims once ---
    detector = AutoInsuranceFraudDetector()
    detector.load_data(user_data).run_full_analysis()
    rule_scores = detector.fraud_scores  # dict keyed by policy_number

    # --- Step B: AI analysis per-claim ---
    results = []
    for i in range(len(user_data)):
        claim_df = user_data.iloc[[i]]
        result = hybrid_fraud_analysis(claim_df, rule_scores)
        result["claim_index"] = i
        ## immediate output
        yield result  # allows streaming instead of waiting


if __name__ == "__main__":
    import pandas as pd


    user_data = pd.DataFrame( [
    {
        "months_as_customer": 24,
        "age": 40,
        "policy_number": 302001,
        "policy_bind_date": "2020-01-15",
        "policy_state": "CA",
        "policy_csl": "100/300",
        "policy_deductable": 1000,
        "policy_annual_premium": 1500.00,
        "umbrella_limit": 0,
        "insured_zip": 90210,  # Same zip
        "insured_sex": "MALE",
        "insured_education_level": "College",
        "insured_occupation": "Teacher",
        "insured_hobbies": "reading",
        "insured_relationship": "husband",
        "capital-gains": 0,
        "capital-loss": 0,
        "incident_date": "2024-06-15",  # Same date
        "incident_type": "Multi-vehicle Collision",
        "collision_type": "Front Collision",
        "incident_severity": "Major Damage",
        "authorities_contacted": "Police",
        "incident_state": "CA",
        "incident_city": "Beverly Hills",
        "incident_location": "Sunset Blvd",
        "incident_hour_of_the_day": 15,
        "number_of_vehicles_involved": 2,
        "property_damage": "YES",
        "bodily_injuries": 1,
        "witnesses": 1,
        "police_report_available": "YES",
        "total_claim_amount": 25000,  # Same amount
        "injury_claim": 15000,
        "property_claim": 5000,
        "vehicle_claim": 5000,
        "auto_make": "BMW",  # Same make
        "auto_model": "X5",  # Same model
        "auto_year": 2020,
        "fraud_reported": "N"
    },
    {
        "months_as_customer": 36,
        "age": 35,
        "policy_number": 302002,
        "policy_bind_date": "2019-03-20",
        "policy_state": "CA",
        "policy_csl": "100/300",
        "policy_deductable": 1000,
        "policy_annual_premium": 1600.00,
        "umbrella_limit": 0,
        "insured_zip": 90210,  # DUPLICATE
        "insured_sex": "FEMALE",
        "insured_education_level": "Masters",
        "insured_occupation": "Engineer",
        "insured_hobbies": "yoga",
        "insured_relationship": "wife",
        "capital-gains": 0,
        "capital-loss": 0,
        "incident_date": "2024-06-15",  # DUPLICATE
        "incident_type": "Multi-vehicle Collision",
        "collision_type": "Side Collision",
        "incident_severity": "Major Damage",
        "authorities_contacted": "Police",
        "incident_state": "CA",
        "incident_city": "Beverly Hills",
        "incident_location": "Hollywood Blvd",
        "incident_hour_of_the_day": 16,
        "number_of_vehicles_involved": 3,
        "property_damage": "YES",
        "bodily_injuries": 2,
        "witnesses": 2,
        "police_report_available": "YES",
        "total_claim_amount": 25000,  # DUPLICATE
        "injury_claim": 12000,
        "property_claim": 8000,
        "vehicle_claim": 5000,
        "auto_make": "BMW",  # DUPLICATE
        "auto_model": "X5",  # DUPLICATE
        "auto_year": 2019,
        "fraud_reported": "N"
    },
        {
            "months_as_customer": 12,
            "age": 28,
            "policy_number": 302003,
            "policy_bind_date": "2023-01-10",
            "policy_state": "TX",
            "policy_csl": "250/500",
            "policy_deductable": 500,
            "policy_annual_premium": 2000.00,
            "umbrella_limit": 5000000,
            "insured_zip": 75001,
            "insured_sex": "MALE",
            "insured_education_level": "High School",
            "insured_occupation": "Driver",
            "insured_hobbies": "sports",
            "insured_relationship": "own-child",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2024-09-01",
            "incident_type": "Parked Car",  # Expected avg: 8000
            "collision_type": "Front Collision",
            "incident_severity": "Minor Damage",  # Multiplier: 0.5
            "authorities_contacted": "None",
            "incident_state": "TX",
            "incident_city": "Dallas",
            "incident_location": "Parking Lot",
            "incident_hour_of_the_day": 10,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 0,
            "police_report_available": "NO",
            "total_claim_amount": 50000,  # Way higher than expected (8000*0.5*2.5=10000)
            "injury_claim": 0,
            "property_claim": 50000,
            "vehicle_claim": 0,
            "auto_make": "Ferrari",
            "auto_model": "488",
            "auto_year": 2023,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 60,
            "age": 45,
            "policy_number": 302003,
            "policy_bind_date": "2018-01-01",
            "policy_state": "NY",
            "policy_csl": "100/300",
            "policy_deductable": 1000,
            "policy_annual_premium": 1800.00,
            "umbrella_limit": 0,
            "insured_zip": 10001,
            "insured_sex": "FEMALE",
            "insured_education_level": "Masters",
            "insured_occupation": "Manager",
            "insured_hobbies": "shopping",
            "insured_relationship": "wife",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2025-05-13",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Minor Damage",
            "authorities_contacted": "Police",
            "incident_state": "NY",
            "incident_city": "New York",
            "incident_location": "Street_0",
            "incident_hour_of_the_day": 9,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 1,
            "police_report_available": "YES",
            "total_claim_amount": 8000,
            "injury_claim": 0,
            "property_claim": 4000,
            "vehicle_claim": 4000,
            "auto_make": "Honda",
            "auto_model": "Civic",
            "auto_year": 2018,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 60,
            "age": 45,
            "policy_number": 302003,
            "policy_bind_date": "2018-01-01",
            "policy_state": "NY",
            "policy_csl": "100/300",
            "policy_deductable": 1000,
            "policy_annual_premium": 1800.00,
            "umbrella_limit": 0,
            "insured_zip": 10001,
            "insured_sex": "FEMALE",
            "insured_education_level": "Masters",
            "insured_occupation": "Manager",
            "insured_hobbies": "shopping",
            "insured_relationship": "wife",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2025-06-13",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Minor Damage",
            "authorities_contacted": "Police",
            "incident_state": "NY",
            "incident_city": "New York",
            "incident_location": "Street_1",
            "incident_hour_of_the_day": 10,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 1,
            "police_report_available": "YES",
            "total_claim_amount": 9000,
            "injury_claim": 0,
            "property_claim": 4500,
            "vehicle_claim": 4500,
            "auto_make": "Honda",
            "auto_model": "Civic",
            "auto_year": 2018,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 60,
            "age": 45,
            "policy_number": 302003,
            "policy_bind_date": "2018-01-01",
            "policy_state": "NY",
            "policy_csl": "100/300",
            "policy_deductable": 1000,
            "policy_annual_premium": 1800.00,
            "umbrella_limit": 0,
            "insured_zip": 10001,
            "insured_sex": "FEMALE",
            "insured_education_level": "Masters",
            "insured_occupation": "Manager",
            "insured_hobbies": "shopping",
            "insured_relationship": "wife",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2025-07-13",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Minor Damage",
            "authorities_contacted": "Police",
            "incident_state": "NY",
            "incident_city": "New York",
            "incident_location": "Street_2",
            "incident_hour_of_the_day": 11,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 1,
            "police_report_available": "YES",
            "total_claim_amount": 10000,
            "injury_claim": 0,
            "property_claim": 5000,
            "vehicle_claim": 5000,
            "auto_make": "Honda",
            "auto_model": "Civic",
            "auto_year": 2018,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 60,
            "age": 45,
            "policy_number": 3020031,
            "policy_bind_date": "2018-01-01",
            "policy_state": "NY",
            "policy_csl": "100/300",
            "policy_deductable": 1000,
            "policy_annual_premium": 1800.00,
            "umbrella_limit": 0,
            "insured_zip": 10001,
            "insured_sex": "FEMALE",
            "insured_education_level": "Masters",
            "insured_occupation": "Manager",
            "insured_hobbies": "shopping",
            "insured_relationship": "wife",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2025-08-13",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Minor Damage",
            "authorities_contacted": "Police",
            "incident_state": "NY",
            "incident_city": "New York",
            "incident_location": "Street_3",
            "incident_hour_of_the_day": 12,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 1,
            "police_report_available": "YES",
            "total_claim_amount": 11000,
            "injury_claim": 0,
            "property_claim": 5500,
            "vehicle_claim": 5500,
            "auto_make": "Honda",
            "auto_model": "Civic",
            "auto_year": 2018,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 6,
            "age": 22,
            "policy_number": 303001,
            "policy_bind_date": "2024-03-15",
            "policy_state": "FL",
            "policy_csl": "50/100",
            "policy_deductable": 2000,
            "policy_annual_premium": 3000.00,
            "umbrella_limit": 0,
            "insured_zip": 33101,
            "insured_sex": "MALE",
            "insured_education_level": "High School",
            "insured_occupation": "unemployed",  # Suspicious occupation
            "insured_hobbies": "racing",  # High-risk hobby
            "insured_relationship": "own-child",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2024-08-20",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Total Loss",
            "authorities_contacted": "None",
            "incident_state": "FL",
            "incident_city": "Miami",
            "incident_location": "Remote Highway",
            "incident_hour_of_the_day": 2,  # Late night (2 AM)
            "number_of_vehicles_involved": 1,  # Single vehicle
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 0,  # No witnesses
            "police_report_available": "NO",  # No police report
            "total_claim_amount": 75000,  # High value single vehicle
            "injury_claim": 0,
            "property_claim": 25000,
            "vehicle_claim": 50000,
            "auto_make": "Lamborghini",
            "auto_model": "Huracan",
            "auto_year": 2022,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 48,
            "age": 38,
            "policy_number": 303002,
            "policy_bind_date": "2020-05-10",
            "policy_state": "WA",  # Policy state
            "policy_csl": "100/300",
            "policy_deductable": 750,
            "policy_annual_premium": 1400.00,
            "umbrella_limit": 0,
            "insured_zip": 98101,
            "insured_sex": "FEMALE",
            "insured_education_level": "College",
            "insured_occupation": "Nurse",
            "insured_hobbies": "hiking",
            "insured_relationship": "wife",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2024-07-25",
            "incident_type": "Multi-vehicle Collision",
            "collision_type": "Rear Collision",
            "incident_severity": "Major Damage",
            "authorities_contacted": "Police",
            "incident_state": "FL",  # Different from policy state (WA vs FL)
            "incident_city": "Orlando",
            "incident_location": "Interstate 4",
            "incident_hour_of_the_day": 14,
            "number_of_vehicles_involved": 2,
            "property_damage": "YES",
            "bodily_injuries": 1,
            "witnesses": 3,
            "police_report_available": "YES",
            "total_claim_amount": 22000,
            "injury_claim": 12000,
            "property_claim": 5000,
            "vehicle_claim": 5000,
            "auto_make": "Toyota",
            "auto_model": "Prius",
            "auto_year": 2019,
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 18,
            "age": 25,
            "policy_number": 303003,
            "policy_bind_date": "2023-03-01",
            "policy_state": "NV",
            "policy_csl": "50/100",
            "policy_deductable": 1500,
            "policy_annual_premium": 2200.00,
            "umbrella_limit": 0,
            "insured_zip": 89101,
            "insured_sex": "MALE",
            "insured_education_level": "Some College",
            "insured_occupation": "Mechanic",
            "insured_hobbies": "cars",
            "insured_relationship": "own-child",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2024-08-30",
            "incident_type": "Single Vehicle Collision",
            "collision_type": "Front Collision",
            "incident_severity": "Total Loss",
            "authorities_contacted": "Police",
            "incident_state": "NV",
            "incident_city": "Las Vegas",
            "incident_location": "Desert Road",
            "incident_hour_of_the_day": 18,
            "number_of_vehicles_involved": 1,
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 1,
            "police_report_available": "YES",
            "total_claim_amount": 45000,  # High claim for old vehicle
            "injury_claim": 0,
            "property_claim": 15000,
            "vehicle_claim": 30000,
            "auto_make": "Ford",
            "auto_model": "Focus",
            "auto_year": 2008,  # 17 years old (>15) with high claim
            "fraud_reported": "N"
        },
        {
            "months_as_customer": 999,  # Extremely high
            "age": 95,  # Extremely high
            "policy_number": 303004,
            "policy_bind_date": "1950-01-01",
            "policy_state": "AK",
            "policy_csl": "500/1000",
            "policy_deductable": 10000,  # Extremely high
            "policy_annual_premium": 50000.00,  # Extremely high
            "umbrella_limit": 10000000,
            "insured_zip": 99501,
            "insured_sex": "MALE",
            "insured_education_level": "PhD",
            "insured_occupation": "Retired",
            "insured_hobbies": "extreme sports",
            "insured_relationship": "husband",
            "capital-gains": 0,
            "capital-loss": 0,
            "incident_date": "2024-09-10",
            "incident_type": "Vehicle Theft",
            "collision_type": "Unknown",
            "incident_severity": "Total Loss",
            "authorities_contacted": "Police",
            "incident_state": "AK",
            "incident_city": "Anchorage",
            "incident_location": "Remote Area",
            "incident_hour_of_the_day": 23,  # Late night
            "number_of_vehicles_involved": 10,  # Extremely high
            "property_damage": "YES",
            "bodily_injuries": 0,
            "witnesses": 0,
            "police_report_available": "YES",
            "total_claim_amount": 500000,  # Extremely high
            "injury_claim": 0,
            "property_claim": 250000,
            "vehicle_claim": 250000,
            "auto_make": "Bugatti",
            "auto_model": "Chiron",
            "auto_year": 2024,
            "fraud_reported": "N"
        }
]
)

    all_results = []

    print("\nFinal Hybrid Fraud Analysis Results (all claims):")
    for res in run_batch_analysis(user_data):  # yields per-claim
        print(f"Claim {res['claim_index']} -> Fraud Score: {res['fraud_score']}, Action: {res['action']}")
        print("Explanation:", res["explanation"], "\n")
        all_results.append(res)  # store for later

    # --- optional: save to CSV/JSON for auditing ---
    import json

    with open("fraud_analysis_results.json", "w") as f:
        json.dump(all_results, f, indent=4)

    pd.DataFrame(all_results).to_csv("fraud_analysis_results.csv", index=False)
