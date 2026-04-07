import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";


interface Banner { id: number; image_url: string; alt: string | null; display_order: number; is_active: number; }

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    api.getBanners(true).then(setBanners).catch(() => {});
  }, []);

  const slides = banners.map((b) => ({ image: b.image_url.startsWith("http") ? b.image_url : api.getFileUrl(b.image_url), alt: b.alt || "" }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  if (slides.length === 0) return null;

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
