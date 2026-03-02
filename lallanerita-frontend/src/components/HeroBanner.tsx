import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";

const DEFAULT_SLIDES = [
  { image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&h=400&fit=crop", alt: "Carne de res fresca - Los mejores cortes" },
  { image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=1200&h=400&fit=crop", alt: "Carne de cerdo premium" },
  { image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&h=400&fit=crop", alt: "Frutas frescas del dia" },
  { image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=400&fit=crop", alt: "Verduras y hortalizas frescas" },
];

interface Banner { id: number; image_url: string; alt: string | null; display_order: number; is_active: number; }

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    api.getBanners(true).then(setBanners).catch(() => {});
  }, []);

  const slides = banners.length > 0
    ? banners.map((b) => ({ image: b.image_url.startsWith("http") ? b.image_url : api.getFileUrl(b.image_url), alt: b.alt || "" }))
    : DEFAULT_SLIDES;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <section className="w-full py-6 bg-white flex justify-center px-4">
      <div className="w-full max-w-5xl">
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div key={i} className="min-w-full">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-48 md:h-72 object-cover block"
                />
              </div>
            ))}
          </div>

          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600/40 text-white p-2 rounded-full transition-colors cursor-pointer z-20"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600/40 text-white p-2 rounded-full transition-colors cursor-pointer z-20"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex justify-center gap-2.5 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                i === current ? "bg-blue-600" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
