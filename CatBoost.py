# catboost_fraud.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
from catboost import CatBoostClassifier, Pool
import matplotlib.pyplot as plt

# ======================================================
# Preprocessing function
# ======================================================
def preprocess_data(df):
    # Drop irrelevant or datetime columns
    drop_cols = ['policy_number', 'incident_location', 'policy_bind_date', 'incident_date']
    df = df.drop(columns=[col for col in drop_cols if col in df.columns], errors='ignore')

    # Encode target variable
    if 'fraud_reported' in df.columns:
        le = LabelEncoder()
        df['fraud_reported'] = le.fit_transform(df['fraud_reported'])

    # One-hot encode categorical features
    df = pd.get_dummies(df, drop_first=True)

    # Scale numeric features
    scaler = StandardScaler()
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns.tolist()
    if 'fraud_reported' in numeric_cols:
        numeric_cols.remove('fraud_reported')
    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

    return df

# ======================================================
# Load dataset
# ======================================================
df = pd.read_csv("insurance_claims.csv")
df.replace('?', np.nan, inplace=True)

# Preprocess
df = preprocess_data(df)

# Target column
target = "fraud_reported"
X = df.drop(columns=[target])
y = df[target]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print(f"Training rows: {X_train.shape[0]}, Testing rows: {X_test.shape[0]}")

# ======================================================
# Train CatBoost
# ======================================================
catboost_model = CatBoostClassifier(
    iterations=500,
    learning_rate=0.05,
    depth=6,
    eval_metric="F1",
    random_seed=42,
    verbose=100
)

catboost_model.fit(X_train, y_train, eval_set=(X_test, y_test), use_best_model=True)

# ======================================================
# Evaluation
# ======================================================
y_pred = catboost_model.predict(X_test)
y_pred_proba = catboost_model.predict_proba(X_test)[:, 1]

print("\nEvaluation Metrics:")
print("Accuracy :", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall   :", recall_score(y_test, y_pred))
print("F1 Score :", f1_score(y_test, y_pred))
print("ROC AUC  :", roc_auc_score(y_test, y_pred_proba))

print("\nClassification Report:\n", classification_report(y_test, y_pred))
print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

# ======================================================
# Feature Importance
# ======================================================
feature_importances = catboost_model.get_feature_importance()
feat_imp = pd.DataFrame({
    "Feature": X.columns,
    "Importance": feature_importances
}).sort_values("Importance", ascending=False)

plt.figure(figsize=(10, 6))
plt.barh(feat_imp["Feature"][:20], feat_imp["Importance"][:20])
plt.gca().invert_yaxis()
plt.title("Top 20 Feature Importances (CatBoost)")
plt.show()
