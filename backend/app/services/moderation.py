from typing import Any, Dict


class ModerationService:
    def __init__(self, *, model_name: str = "openai/gpt-4o-mini"):
        self.model_name = model_name

    def score(self, text: str) -> Dict[str, Any]:
        # TODO: integrate with actual ML API or on-prem model
        return {"toxicity": 0.02, "spam": 0.01, "requires_review": False}
