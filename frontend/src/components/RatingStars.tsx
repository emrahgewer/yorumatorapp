type RatingStarsProps = {
  rating: number;
};

const MAX_STARS = 5;

export default function RatingStars({ rating }: RatingStarsProps) {
  const clampedRating = Math.max(0, Math.min(MAX_STARS, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_STARS }).map((_, index) => {
        if (index < fullStars) {
          return (
            <span key={index} aria-hidden="true" className="text-base text-amber-500">
              ★
            </span>
          );
        }
        if (index === fullStars && hasHalfStar) {
          return (
            <span key={index} aria-hidden="true" className="text-base text-amber-500">
              ☆
            </span>
          );
        }
        return (
          <span key={index} aria-hidden="true" className="text-base text-slate-300">
            ☆
          </span>
        );
      })}
      <span className="text-xs font-medium text-slate-500">{clampedRating.toFixed(1)}</span>
    </div>
  );
}

