type ProductCardProps = {
  id: string;
  brand: string;
  model: string;
  rating: number;
  reviewCount: number;
  highlights: string[];
};

export default function ProductCard({ brand, model, rating, reviewCount, highlights }: ProductCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{brand} {model}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {rating.toFixed(1)} / 5 · {reviewCount} doğrulanmış yorum
      </p>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
        {highlights.map((highlight) => (
          <li key={highlight} className="rounded-full bg-slate-100 px-3 py-1">
            #{highlight}
          </li>
        ))}
      </ul>
      <button className="mt-6 rounded-full border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700">
        Yorumları incele
      </button>
    </article>
  );
}
