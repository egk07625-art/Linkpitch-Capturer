'use client';

export function DataStreamGap() {
  return (
    <div className="relative w-full h-[600px] flex justify-center items-center overflow-hidden bg-black">
      {/* The Static Line */}
      <div className="w-[1px] h-full bg-white/5 relative">
        {/* The Moving Light (Data Stream) */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-drop-stream" />
      </div>
    </div>
  );
}

