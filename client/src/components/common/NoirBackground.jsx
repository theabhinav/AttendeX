import React from 'react';

const NoirBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Deep Obsidian & Crimson Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#180405] via-[#050505] to-black" />

      {/* Animated Star Layers */}
      <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]" />
      <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]" />

      {/* Primary Ambient Red Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] bg-red-600/10 rounded-full blur-[140px]" />

      {/* Secondary Edge Glow */}
      <div className="absolute -bottom-20 right-10 w-[500px] h-[500px] bg-red-700/5 rounded-full blur-[120px]" />

      {/* Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_45%,transparent_85%)]" />
    </div>
  );
};

export default NoirBackground;
