'use client';

export function SectionDivider() {
  return (
    <div className="relative h-24 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent blur-sm" />
      </div>
    </div>
  );
}
