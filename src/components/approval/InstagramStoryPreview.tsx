import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstagramStoryPreviewProps {
  images: Array<{ url: string; name: string }>;
  clientName?: string;
  avatar?: string;
  caption?: string;
}

export function InstagramStoryPreview({
  images,
  clientName = "Cliente",
  avatar,
  caption,
}: InstagramStoryPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const nextImage = () => setCurrentIndex((p) => (p + 1) % images.length);
  const prevImage = () => setCurrentIndex((p) => (p - 1 + images.length) % images.length);

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg border border-border/30"
        style={{ width: 270, aspectRatio: "9/16", background: "#0f172a" }}
      >
        {/* Image */}
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-2 inset-x-2 flex gap-1 z-10">
          {images.map((_, idx) => (
            <div key={idx} className="flex-1 h-[2px] rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  idx < currentIndex
                    ? "bg-white w-full"
                    : idx === currentIndex
                    ? "bg-white w-full"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 inset-x-3 flex items-center gap-2 z-10">
          {avatar ? (
            <img src={avatar} alt={clientName} className="w-8 h-8 rounded-full border-2 border-white/80 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-white/80 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{clientName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-white text-xs font-semibold drop-shadow-sm">{clientName}</span>
          <span className="text-white/60 text-[10px] ml-auto">Patrocinado</span>
        </div>

        {/* Carousel arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-7 w-7 z-10"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-7 w-7 z-10"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Footer — fake message input */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          <div className="rounded-full border border-white/30 bg-black/20 backdrop-blur-sm px-4 py-2 flex items-center">
            <span className="text-white/50 text-xs">Enviar mensagem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
