from fastapi import APIRouter, HTTPException
from app.models import ChatRequest, ChatResponse, IrrigationRecommendationRequest, IrrigationRecommendation
from app import ai as ai_service
import anthropic

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI advisor chat. Takes the farmer's message plus optional live context
    (sensors, farm profile, weather, irrigation) and returns grounded advice."""
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
    """Rule-based irrigation decision. Returns should_irrigate, a reason, an
    optional duration, and an urgency of now | soon | later | hold."""
    try:
        return await ai_service.get_irrigation_recommendation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")
