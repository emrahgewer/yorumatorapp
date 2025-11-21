import Link from "next/link";
import RatingStars from "./RatingStars";

type ProductCardProps = {
  id: string;
  brand: string;
  model: string;
  rating?: number;
  average_rating?: number;
  reviewCount?: number;
  highlights?: string[];
  summary?: string;
  priceRange?: string;
  tags?: string[];
  pros?: string[];
  cons?: string[];
};

export default function ProductCard({
  id,
  brand,
  model,
  rating,
  average_rating,
  reviewCount,
  highlights,
  summary,
  priceRange,
  tags = [],
  pros = [],
  cons = [],
}: ProductCardProps) {
  const normalizedRating = typeof average_rating === "number" ? average_rating : rating ?? 0;
  const reviewCountLabel = reviewCount ?? 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-500">
          Ürün görseli
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-500">{brand}</p>
              <h2 className="text-xl font-semibold">{model}</h2>
            </div>
            <RatingStars rating={normalizedRating} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {normalizedRating.toFixed(1)} / 5 · {reviewCountLabel} doğrulanmış yorum
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">{summary}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-700">
          <span className="block text-xs uppercase text-emerald-500">Fiyat aralığı</span>
          <strong>{priceRange}</strong>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-2 text-slate-700">
          <span className="block text-xs uppercase text-slate-400">Teslimat</span>
          3 günde kapında
        </div>
      </div>

      {!!tags.length && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {tags.map((tag) => (
            <li key={tag} className="rounded-full bg-slate-100 px-3 py-1">
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {!!highlights.length && (
        <ul className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
          {highlights.map((highlight) => (
            <li key={highlight} className="rounded-full bg-slate-100 px-3 py-1">
              {highlight}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        {pros.length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">Artılar</p>
            <ul className="mt-2 space-y-1">
              {pros.map((pro) => (
                <li key={pro}>• {pro}</li>
              ))}
            </ul>
          </div>
        )}
        {cons.length > 0 && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-rose-600">Eksiler</p>
            <ul className="mt-2 space-y-1">
              {cons.map((con) => (
                <li key={con}>• {con}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={{ pathname: "/products/[id]", query: { id } }}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Detayları gör
        </Link>
        <Link
          href={{ pathname: "/products/[id]", query: { id, section: "reviews" } }}
          className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          Yorumları incele
        </Link>
      </div>
    </article>
  );
}
