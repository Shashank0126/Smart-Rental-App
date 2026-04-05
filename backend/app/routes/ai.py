"""
AI routes: rent prediction and property recommendations.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.models.schemas import RentPredictRequest, RentPredictResponse
from app.ai.rent_predictor import predict_rent
from app.ai.recommender import get_recommendations

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/predict-rent", response_model=RentPredictResponse)
async def predict_rent_endpoint(body: RentPredictRequest):
    """
    Predict monthly rent using ML model.
    Input: property_type, size (sq ft), location_city, amenities_count.
    """
    try:
        result = predict_rent(
            property_type=body.property_type.value,
            size=body.size,
            city=body.location_city,
            amenities_count=body.amenities_count,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/recommendations")
async def recommendations(user: dict = Depends(get_current_user)):
    """
    Get personalized property recommendations based on user's favorites.
    Falls back to newest listings for new users (cold start).
    """
    try:
        recs = await get_recommendations(str(user["_id"]))
        return {"recommendations": recs, "count": len(recs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")
