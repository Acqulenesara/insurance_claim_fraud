import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

class AutoInsuranceFraudDetector:
    def __init__(self):
            """Initialize the auto insurance fraud detection system"""
            self.df = None
            self.fraud_results = {}
            self.fraud_scores = {}

            # Thresholds (set dynamically later)
            self.duplicate_threshold = None
            self.amount_threshold = None
            self.frequency_threshold = None
            self.frequency_months = 6
            self.high_risk_amount = None

            # Average claim amounts by incident type (can still be domain-informed)
            self.incident_avg_amounts = {
                "Multi-vehicle Collision": 25000,
                "Single Vehicle Collision": 15000,
                "Vehicle Theft": 30000,
                "Parked Car": 8000,
                "Property Damage": 5000,
                "Bodily Injury": 35000
            }

            # Suspicious patterns
            self.suspicious_occupations = ['unemployed', 'student', 'retired']
            self.high_risk_hobbies = ['racing', 'extreme sports', 'motorcycling']


    def set_dynamic_thresholds(self):
            """Compute thresholds dynamically based on dataset distribution"""
            if self.df is None:
                raise ValueError("No data loaded")

            # Amount-based thresholds
            if 'total_claim_amount' in self.df.columns:
                self.high_risk_amount = self.df['total_claim_amount'].quantile(0.95)  # top 5% claims
                mean_amt = self.df['total_claim_amount'].mean()
                std_amt = self.df['total_claim_amount'].std()
                self.amount_threshold = (mean_amt + 2 * std_amt) / mean_amt if mean_amt > 0 else 2.5
            else:
                self.high_risk_amount = 50000
                self.amount_threshold = 2.5

            # Frequency threshold (flag customers above 95th percentile claim count)
            if 'policy_number' in self.df.columns and 'incident_date' in self.df.columns:
                cutoff_date = datetime.now() - timedelta(days=30 * self.frequency_months)
                recent_claims = self.df[self.df['incident_date'] >= cutoff_date]

                freq = recent_claims.groupby('policy_number').size()  # ✅ changed from insured_zip
                self.frequency_threshold = freq.quantile(0.95) if not freq.empty else 3
            else:
                self.frequency_threshold = 3
            # Duplicate threshold (usually 1 is fine)
            self.duplicate_threshold = 1

            print(f"Dynamic thresholds set:")
            print(f"- High risk amount: {self.high_risk_amount:.2f}")
            print(f"- Amount threshold multiplier: {self.amount_threshold:.2f}")
            print(f"- Frequency threshold: {self.frequency_threshold}")

    def load_data(self, df):
            """Load claims data"""
            self.df = df.copy()

            # Convert dates safely
            for col in ['incident_date', 'policy_bind_date']:
                if col in self.df.columns:
                    self.df[col] = pd.to_datetime(self.df[col], errors='coerce')

            # Drop rows without incident_date (cannot analyze)
            self.df = self.df.dropna(subset=['incident_date'])

            # Add claim_id if missing
            if 'claim_id' not in self.df.columns:
                self.df['claim_id'] = 'CLAIM_' + self.df.index.astype(str).str.zfill(6)

            # 🔥 Set thresholds dynamically after data is loaded
            self.set_dynamic_thresholds()

            print(f"Loaded {len(self.df)} claims")
            return self

    def detect_duplicate_claims(self):
        cols = ['insured_zip', 'incident_date', 'total_claim_amount', 'auto_make', 'auto_model']
        available_cols = [c for c in cols if c in self.df.columns]

        if len(available_cols) < 3:
            self.fraud_results['duplicate_claims'] = {'flagged_claims': [], 'total_flagged': 0, 'risk_level': 'LOW'}
            return []

        duplicates = self.df[self.df.duplicated(subset=available_cols, keep=False)]
        flagged = duplicates['claim_id'].tolist()

        self.fraud_results['duplicate_claims'] = {
            'method': 'Duplicate Claims Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level': 'HIGH' if flagged else 'LOW'
        }
        print(f"Duplicate claims detected: {len(flagged)}")
        return flagged

    def detect_suspicious_amounts(self):
        flagged = []
        for idx, row in self.df.iterrows():
            claim_amount = row.get('total_claim_amount', 0)
            incident_type = row.get('incident_type', 'Unknown')
            incident_severity = row.get('incident_severity', 'Unknown')

            expected = self.incident_avg_amounts.get(incident_type, 20000)
            severity_multiplier = {'Minor Damage':0.5, 'Major Damage':1.5, 'Total Loss':2.0}.get(incident_severity,1.0)
            adjusted = expected * severity_multiplier

            if claim_amount > adjusted * self.amount_threshold:
                flagged.append(row['claim_id'])

        self.fraud_results['suspicious_amounts'] = {
            'method': 'Suspicious Amount Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level': 'HIGH' if flagged else 'LOW'
        }
        print(f"Suspicious amounts detected: {len(flagged)}")
        return flagged

    import pandas as pd
    from datetime import datetime

    def detect_excessive_frequency(self):
        """
        Detect customers filing excessive claims within the last N months (default: 6).
        Groups by policy_number to identify unique customers.
        """
        if self.df is None:
            raise ValueError("No data loaded")

        # Ensure incident_date is datetime
        self.df["incident_date"] = pd.to_datetime(self.df["incident_date"], errors="coerce")
        self.df = self.df.dropna(subset=["incident_date"])

        # Cutoff date for N months lookback
        cutoff_date = datetime.now() - timedelta(days=30 * self.frequency_months)
        recent_claims = self.df[self.df["incident_date"] >= cutoff_date]

        if recent_claims.empty:
            self.fraud_results["excessive_frequency"] = {
                "method": "Excessive Frequency Detection",
                "flagged_claims": [],
                "total_flagged": 0,
                "risk_level": "LOW"
            }
            print("Excessive frequency detected: 0 (no recent claims)")
            return []

        # Always group by policy_number
        freq = recent_claims.groupby("policy_number").size().reset_index(name="claim_count")

        # If dynamic threshold not set, fallback = 3
        threshold = self.frequency_threshold if self.frequency_threshold else 3

        # Customers who exceed threshold
        excessive_customers = freq[freq["claim_count"] > threshold]["policy_number"].tolist()

        flagged = recent_claims[recent_claims["policy_number"].isin(excessive_customers)]["claim_id"].tolist()

        self.fraud_results["excessive_frequency"] = {
            "method": "Excessive Frequency Detection",
            "flagged_claims": flagged,
            "total_flagged": len(flagged),
            "risk_level": "MEDIUM" if flagged else "LOW"
        }

        print(f"Excessive frequency detected: {len(flagged)}")
        return flagged

    def detect_suspicious_patterns(self):
        flagged = []
        for idx, row in self.df.iterrows():
            reasons = []

            if row.get('witnesses', 0)==0 and str(row.get('police_report_available','')).lower()=='no':
                reasons.append("No witnesses & no police report")

            hour = row.get('incident_hour_of_the_day',12)
            if hour>=22 or hour<=4:
                reasons.append("Late night incident")

            if row.get('number_of_vehicles_involved',2)==1 and row.get('total_claim_amount',0)>self.high_risk_amount:
                reasons.append("High-value single vehicle incident")

            occ = str(row.get('insured_occupation','')).lower()
            if any(o in occ for o in self.suspicious_occupations):
                reasons.append("High-risk occupation")
            hobby = str(row.get('insured_hobbies','')).lower()
            if any(h in hobby for h in self.high_risk_hobbies):
                reasons.append("High-risk hobby")

            if reasons:
                flagged.append(row['claim_id'])

        self.fraud_results['suspicious_patterns'] = {
            'method': 'Suspicious Pattern Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level': 'MEDIUM' if flagged else 'LOW'
        }
        print(f"Suspicious patterns detected: {len(flagged)}")
        return flagged

    def detect_geographic_anomalies(self):
        flagged = []
        for idx, row in self.df.iterrows():
            if 'incident_state' in row and 'policy_state' in row:
                if str(row['incident_state']).upper() != str(row['policy_state']).upper():
                    flagged.append(row['claim_id'])

        self.fraud_results['geographic_anomalies'] = {
            'method': 'Geographic Anomaly Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level': 'MEDIUM' if flagged else 'LOW'
        }
        print(f"Geographic anomalies detected: {len(flagged)}")
        return flagged

    def detect_vehicle_age_anomalies(self):
        flagged = []
        current_year = datetime.now().year
        for idx,row in self.df.iterrows():
            auto_year = row.get('auto_year',current_year)
            claim_amount = row.get('total_claim_amount',0)
            try:
                age = current_year - int(auto_year)
                if age>15 and claim_amount>30000:
                    flagged.append(row['claim_id'])
            except: continue

        self.fraud_results['vehicle_age_anomalies'] = {
            'method':'Vehicle Age Anomaly Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level':'MEDIUM' if flagged else 'LOW'
        }
        print(f"Vehicle age anomalies detected: {len(flagged)}")
        return flagged

    def detect_outliers(self):
        cols = ['total_claim_amount','months_as_customer','age','policy_annual_premium','incident_hour_of_the_day','number_of_vehicles_involved']
        available_cols = [c for c in cols if c in self.df.columns and pd.api.types.is_numeric_dtype(self.df[c])]
        if not available_cols:
            self.fraud_results['statistical_outliers'] = {'flagged_claims':[],'total_flagged':0,'risk_level':'LOW'}
            return []

        data = self.df[available_cols].fillna(self.df[available_cols].median())
        scaler = StandardScaler()
        scaled = scaler.fit_transform(data)

        iso = IsolationForest(contamination=0.05, random_state=42)
        preds = iso.fit_predict(scaled)
        flagged = self.df[preds==-1]['claim_id'].tolist()

        self.fraud_results['statistical_outliers'] = {
            'method':'Statistical Outlier Detection',
            'flagged_claims': flagged,
            'total_flagged': len(flagged),
            'risk_level':'MEDIUM' if flagged else 'LOW'
        }
        print(f"Statistical outliers detected: {len(flagged)}")
        return flagged

    def calculate_fraud_scores(self):
        scores = {}
        for idx,row in self.df.iterrows():
            cid = row['claim_id']
            score = 0
            reasons = []

            for method, result in self.fraud_results.items():
                if cid in result['flagged_claims']:
                    if method=='duplicate_claims': score+=40; reasons.append('Duplicate claim')
                    elif method=='suspicious_amounts': score+=35; reasons.append('Suspicious amount')
                    elif method=='excessive_frequency': score+=25; reasons.append('Excessive frequency')
                    elif method=='suspicious_patterns': score+=20; reasons.append('Suspicious pattern')
                    elif method=='geographic_anomalies': score+=15; reasons.append('Geographic anomaly')
                    elif method=='vehicle_age_anomalies': score+=15; reasons.append('Vehicle age anomaly')
                    elif method=='statistical_outliers': score+=10; reasons.append('Statistical outlier')

            if str(row.get('fraud_reported','')).lower()=='y':
                score+=50; reasons.append('Previously flagged as fraud')

            score = min(score,100)
            if score>=70: level='HIGH'
            elif score>=40: level='MEDIUM'
            elif score>=20: level='LOW'
            else: level='MINIMAL'

            scores[cid]={'score':score,'risk_level':level,'reasons':reasons,'claim_amount':row.get('total_claim_amount',0),'incident_type':row.get('incident_type','Unknown')}

        self.fraud_scores = scores
        print(f"Fraud scores calculated for {len(scores)} claims")
        return scores

    def run_full_analysis(self):
        if self.df is None: raise ValueError("No data loaded")
        self.detect_duplicate_claims()
        self.detect_suspicious_amounts()
        self.detect_excessive_frequency()
        self.detect_suspicious_patterns()
        self.detect_geographic_anomalies()
        self.detect_vehicle_age_anomalies()
        self.detect_outliers()
        self.calculate_fraud_scores()
        print("Full analysis complete ✅")
        return self

# --- Main execution ---
# --- Main execution ---
if __name__ == "__main__":
    try:
        # Load real dataset instead of generating sample
        df = pd.read_csv("insurance_claims.csv")
        print("✅ insurance_claims.csv loaded successfully!")
    except FileNotFoundError:
        print("⚠️ insurance_claims.csv not found, falling back to sample data...")
        # df = create_sample_auto_data()

    detector = AutoInsuranceFraudDetector()
    detector.load_data(df).run_full_analysis()

    # Show top 5 high-risk claims
    sorted_claims = sorted(detector.fraud_scores.items(), key=lambda x: x[1]['score'], reverse=True)
    print("\nTop 5 Suspicious Claims:")
    for cid, info in sorted_claims[:5]:
        print(f"{cid}: Score {info['score']}/100 - {info['risk_level']} Risk, Amount ${info['claim_amount']}")
