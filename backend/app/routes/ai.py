from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse, IrrigationRecommendationRequest, IrrigationRecommendation
from app import ai as ai_service
import anthropic

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main AI advisor chat endpoint.

    Send the farmer's message along with optional live context:
    - sensor_data: current temperature, humidity, soil moisture
    - farm_profile: crop, growth stage, soil type
    - weather: forecast with rain probability
    - irrigation: current irrigation state and reservoir level

    The AI will use all provided context to give specific, grounded advice.
    """
    try:
        return await ai_service.get_ai_response(req)
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Anthropic API key. Check your .env file.",
        )
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Rate limit hit. Please wait a moment and try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/recommend-irrigation", response_model=IrrigationRecommendation)
async def recommend_irrigation(req: IrrigationRecommendationRequest):
    """
    Automated irrigation recommendation engine.

    Given current sensor data, crop profile, weather forecast, and irrigation
    status — returns a should_irrigate decision with reason and urgency level.

    This is called by the backend scheduler or the frontend on page load.
    Urgency levels: "now" | "soon" | "later" | "hold"
    """
    try:
        return await ai_service.get_irrigation_recommendation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")
