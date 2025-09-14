# train.py
import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
from catboost import CatBoostClassifier
import joblib
import numpy as np

# Create models directory first thing
os.makedirs("models", exist_ok=True)

# 1. Load dataset
df = pd.read_csv("insurance_claims.csv")

# 2. Check target column
print("Columns in dataset:", df.columns)
# assume target column is 'fraud_reported'
target = 'fraud_reported'

# 3. Separate features and labels
X = df.drop(columns=[target, "_c39"], errors="ignore")  # remove weird column
y = df[target]

# Encode categorical target if needed
if y.dtype == 'O':
    le = LabelEncoder()
    y = le.fit_transform(y)
    # Save label encoder for later use
    joblib.dump(le, "models/label_encoder.pkl")
    print("Label encoder saved!")

# 4. Identify categorical columns for CatBoost
categorical_features = []
for col in X.columns:
    if X[col].dtype == 'object' or X[col].dtype.name == 'category':
        categorical_features.append(col)

print(f"Categorical features found: {categorical_features}")

# 5. Handle missing values - CatBoost can handle them, but let's be explicit
# For numerical columns, fill with median
# For categorical columns, fill with mode or 'Unknown'
for col in X.columns:
    if col in categorical_features:
        X[col] = X[col].fillna('Unknown')
    else:
        X[col] = X[col].fillna(X[col].median())

# 6. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# 7. Train CatBoost model
# CatBoost handles categorical features automatically - no need for scaling or encoding
catboost_model = CatBoostClassifier(
    iterations=1000,
    learning_rate=0.1,
    depth=8,
    cat_features=categorical_features,
    class_weights=[1, 3],  # Give more weight to fraud class (assuming it's minority)
    random_seed=42,
    verbose=100,  # Print progress every 100 iterations
    early_stopping_rounds=50,
    eval_metric='AUC'
)

# Fit the model
print("\nStarting model training...")
catboost_model.fit(
    X_train, y_train,
    eval_set=(X_test, y_test),
    plot=False  # Set to True if you want to see training plots
)

# 8. Evaluate model
y_pred = catboost_model.predict(X_test)
y_prob = catboost_model.predict_proba(X_test)[:, 1]

print("\n" + "="*50)
print("MODEL EVALUATION RESULTS")
print("="*50)

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 9. Feature importance
feature_importance = catboost_model.get_feature_importance()
feature_names = X.columns
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': feature_importance
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Important Features:")
print(importance_df.head(10))

# 10. Save model and preprocessing objects
joblib.dump(catboost_model, "models/catboost_model.pkl")
joblib.dump(categorical_features, "models/categorical_features.pkl")
importance_df.to_csv("models/feature_importance.csv", index=False)

print("\n✅ CatBoost model, categorical features list, and feature importance saved!")
print(f"✅ Model saved to: models/catboost_model.pkl")
print(f"✅ Categorical features saved to: models/categorical_features.pkl")
print(f"✅ Feature importance saved to: models/feature_importance.csv")

# 11. Quick prediction example (optional)
print("\n" + "="*50)
print("SAMPLE PREDICTIONS")
print("="*50)
sample_predictions = y_prob[:5]
sample_actual = y_test[:5] if hasattr(y_test, 'iloc') else y_test[0:5]
print("Sample probabilities (fraud likelihood):")
for i, (prob, actual) in enumerate(zip(sample_predictions, sample_actual)):
    print(f"Sample {i+1}: Fraud Probability = {prob:.4f}, Actual = {actual}")