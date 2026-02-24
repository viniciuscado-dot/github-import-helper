import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface VideoStoryPreviewProps {
  videoUrl: string;
  clientName?: string;
  avatar?: string;
}

export function VideoStoryPreview({
  videoUrl,
  clientName = "Cliente",
  avatar,
}: VideoStoryPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg border border-border/30 cursor-pointer"
        style={{ width: 270, aspectRatio: "9/16", background: "#0f172a" }}
        onClick={togglePlay}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Progress bar at top */}
        <div className="absolute top-2 inset-x-2 z-10 pointer-events-none">
          <div className="h-[2px] rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-4 inset-x-3 flex items-center gap-2 z-10 pointer-events-none">
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

        {/* Play/Pause overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-7 w-7 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Pause icon (brief flash feel — shown while playing on hover) */}
        {playing && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Pause className="h-7 w-7 text-white" />
            </div>
          </div>
        )}

        {/* Footer — fake message input */}
        <div className="absolute bottom-3 inset-x-3 z-10 pointer-events-none">
          <div className="rounded-full border border-white/30 bg-black/20 backdrop-blur-sm px-4 py-2 flex items-center">
            <span className="text-white/50 text-xs">Enviar mensagem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
