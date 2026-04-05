"""
AI Rent Prediction using Scikit-learn.
Trains on synthetic data and saves a model file, or loads existing model.
"""
import numpy as np
import joblib
import os
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), "rent_model.pkl")

# City-based base multipliers (relative to Tier-2 city avg)
CITY_MULTIPLIERS = {
    "mumbai": 3.5, "delhi": 3.0, "bangalore": 2.8, "hyderabad": 2.2,
    "pune": 2.0, "chennai": 1.9, "kolkata": 1.7, "ahmedabad": 1.5,
    "jaipur": 1.3, "lucknow": 1.2, "other": 1.0,
}

TYPE_BASE = {
    "1BHK": 10_000,
    "2BHK": 17_000,
    "3BHK": 26_000,
    "Commercial": 35_000,
}


def _generate_training_data(n=5000):
    """Generate synthetic rental data for model training."""
    np.random.seed(42)
    types = ["1BHK", "2BHK", "3BHK", "Commercial"]
    cities = list(CITY_MULTIPLIERS.keys())

    X, y = [], []
    for _ in range(n):
        ptype = np.random.choice(types)
        city = np.random.choice(cities)
        size = np.random.uniform(300, 3000)
        amenities = np.random.randint(0, 10)

        base = TYPE_BASE[ptype]
        multiplier = CITY_MULTIPLIERS[city]
        size_factor = size / 1000
        amenity_bonus = amenities * 500

        rent = (base * multiplier * size_factor + amenity_bonus) * np.random.uniform(0.85, 1.15)

        type_enc = types.index(ptype)
        city_enc = CITY_MULTIPLIERS[city]
        X.append([type_enc, city_enc, size, amenities])
        y.append(rent)

    return np.array(X), np.array(y)


def train_and_save():
    """Train the rent prediction model and persist it."""
    X, y = _generate_training_data()
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("ridge", Ridge(alpha=1.0)),
    ])
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"✅ Rent prediction model saved to {MODEL_PATH}")
    return model


def load_model():
    """Load existing model or train a new one."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return train_and_save()


# Lazy-load model
_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def predict_rent(property_type: str, size: float, city: str, amenities_count: int) -> dict:
    """Predict monthly rent given property features."""
    types = ["1BHK", "2BHK", "3BHK", "Commercial"]
    type_enc = types.index(property_type) if property_type in types else 0
    city_lower = city.lower().strip()
    city_mult = CITY_MULTIPLIERS.get(city_lower, CITY_MULTIPLIERS["other"])

    X = np.array([[type_enc, city_mult, size, amenities_count]])
    model = get_model()
    pred = float(model.predict(X)[0])

    # Confidence bounds ±15%
    return {
        "predicted_rent": round(pred, 2),
        "range_low": round(pred * 0.85, 2),
        "range_high": round(pred * 1.15, 2),
        "confidence": "High" if city_lower in CITY_MULTIPLIERS else "Medium",
    }
