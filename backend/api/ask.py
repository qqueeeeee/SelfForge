from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_service import ask_ai
from fastapi import APIRouter

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    answer = ask_ai(req.question)
    return {"response": answer}
