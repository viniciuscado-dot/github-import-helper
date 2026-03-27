import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { DotLogo } from "@/components/DotLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function Intro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated, skip intro and go to dashboard
  if (!loading && isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleEnter = useCallback(() => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      scale: 6,
      filter: "blur(20px)",
      opacity: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => navigate("/auth"),
    });
  }, [navigate]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0f0505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        overflow: "hidden",
        willChange: "transform, filter, opacity",
      }}
    >
      {/* Radial glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(198,40,40,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 30% 60%, rgba(120,30,30,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <DotLogo size={48} />
      </div>

      {/* Title */}
      <h1
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
          fontWeight: 700,
          color: "rgba(255,255,255,0.92)",
          letterSpacing: "-0.02em",
          textAlign: "center",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        Módulo de Criação
      </h1>

      {/* Subtitle */}
      <p
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          color: "rgba(255,255,255,0.45)",
          textAlign: "center",
          margin: 0,
          maxWidth: "480px",
          lineHeight: 1.5,
        }}
      >
        Crie, organize e execute projetos com velocidade e clareza
      </p>

      {/* CTA Button */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-block",
          WebkitBoxReflect:
            "below 2px linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.4))",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={handleEnter}
          className="intro-cta-btn"
          type="button"
        >
          Criar
        </button>
      </div>

      {/* Scoped styles */}
      <style>{`
        .intro-cta-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 20px 72px;
          background: radial-gradient(67.54% 100.03% at 50% 0%, #FFEBEE 0%, #FFCDD2 25.48%, #E57373 62.5%, #C62828 100%);
          border: 1.2px solid rgba(255,255,255,0.3);
          border-radius: 16px;
          box-shadow: 0 6px 23px 0 rgba(198,40,40,0.20), 0 14px 54px 0 rgba(198,40,40,0.50);
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .intro-cta-btn::before {
          content: "";
          height: 100%;
          width: 100px;
          position: absolute;
          top: 0;
          left: -150px;
          opacity: 0;
          background: #fff;
          box-shadow: 0 0 30px 20px rgba(255,255,255,0.67);
          transform: skewX(-20deg);
          mix-blend-mode: plus-lighter;
          pointer-events: none;
          animation: intro-brilho 3s linear infinite;
        }
        .intro-cta-btn:hover {
          filter: brightness(1.1) saturate(1.2);
          transform: translateY(-8px);
        }
        .intro-cta-btn:active {
          transform: scale(0.95) translateY(-2px);
        }
        @keyframes intro-brilho {
          0%   { opacity: 0;   left: -150px; }
          20%  { opacity: 0.4; }
          50%  { opacity: 0.6; left: 50%; }
          80%  { opacity: 0.4; }
          100% { opacity: 0;   left: 150%; }
        }
      `}</style>
    </div>
  );
}
