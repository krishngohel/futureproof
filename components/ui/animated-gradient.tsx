"use client";

interface Props {
  /** When true: position:absolute, clips inside a position:relative overflow:hidden parent.
   *  When false (default): position:fixed, covers the full viewport. */
  contained?: boolean;
}

export default function AnimatedGradient({ contained = false }: Props) {
  const pos = contained ? "absolute" : "fixed";

  return (
    <>
      <style>{`
        @keyframes orb-orange {
          0%   { transform: translate(0px,   0px)   scale(1);    }
          25%  { transform: translate(380px, 220px) scale(1.2);  }
          50%  { transform: translate(220px, 420px) scale(0.85); }
          75%  { transform: translate(-80px, 280px) scale(1.1);  }
          100% { transform: translate(0px,   0px)   scale(1);    }
        }
        @keyframes orb-purple {
          0%   { transform: translate(0px,    0px)    scale(1);    }
          33%  { transform: translate(-380px, -260px) scale(1.25); }
          66%  { transform: translate(-180px, -460px) scale(0.8);  }
          100% { transform: translate(0px,    0px)    scale(1);    }
        }
        @keyframes orb-blue {
          0%   { transform: translate(0px,    0px)    scale(1);   }
          40%  { transform: translate(-300px,  200px) scale(1.3); }
          80%  { transform: translate(-120px, -180px) scale(0.85);}
          100% { transform: translate(0px,    0px)    scale(1);   }
        }
        @keyframes orb-red {
          0%,100% { transform: translate(0px,    0px)    scale(1);   }
          50%     { transform: translate(260px, -320px) scale(1.2); }
        }
        @keyframes orb-center {
          0%,100% { transform: translate(0px,  0px)   scale(1);    opacity: 0.6; }
          50%     { transform: translate(60px,-40px)  scale(1.35); opacity: 1;   }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: pos,
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Orange — brand color, top-left, sweeps across center */}
        <div style={{
          position: "absolute", width: 820, height: 820, borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,67,0,0.28) 0%, rgba(255,67,0,0.1) 40%, transparent 68%)",
          filter: "blur(32px)", top: -200, left: -200,
          animation: "orb-orange 12s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Purple — bottom-right, sweeps toward center */}
        <div style={{
          position: "absolute", width: 900, height: 900, borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(110,0,240,0.22) 0%, rgba(80,0,180,0.08) 40%, transparent 68%)",
          filter: "blur(40px)", bottom: -250, right: -200,
          animation: "orb-purple 16s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Blue — top-right */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(0,100,220,0.2) 0%, rgba(0,80,160,0.07) 40%, transparent 68%)",
          filter: "blur(36px)", top: 0, right: -180,
          animation: "orb-blue 20s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Deep red — bottom-left, drifts up */}
        <div style={{
          position: "absolute", width: 620, height: 620, borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(200,30,0,0.18) 0%, rgba(160,20,0,0.06) 40%, transparent 68%)",
          filter: "blur(40px)", bottom: -120, left: -80,
          animation: "orb-red 14s ease-in-out infinite",
          willChange: "transform",
        }} />

        {/* Center ambient — keeps the middle from going flat */}
        <div style={{
          position: "absolute", width: 560, height: 560, borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,67,0,0.1) 0%, rgba(120,0,200,0.06) 50%, transparent 70%)",
          filter: "blur(50px)", top: "30%", left: "35%",
          animation: "orb-center 9s ease-in-out infinite",
          willChange: "transform, opacity",
        }} />
      </div>
    </>
  );
}
