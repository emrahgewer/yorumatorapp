from dataclasses import dataclass
from typing import List


@dataclass
class ReviewSummary:
    summary: str
    positive_ratio: float
    negative_ratio: float


class NLPService:
    def summarize(self, reviews: List[str]) -> ReviewSummary:
        positive_ratio = 0.8 if reviews else 0
        negative_ratio = 0.2 if reviews else 0
        return ReviewSummary(
            summary="Çoğu kullanıcı ürünün pil ömründen memnun.",
            positive_ratio=positive_ratio,
            negative_ratio=negative_ratio,
        )
