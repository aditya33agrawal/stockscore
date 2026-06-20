"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  preview: string;
  label?: string;
}

export function AggressionSlider({ value, onChange, preview, label = "How aggressive do you want to be?" }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs text-chalk-300">{label}</label>
        <span className="num text-xs text-chalk-50">{value}/100</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-chalk-300/60">
        <span>Conservative</span>
        <span>Aggressive</span>
      </div>
      <p className="mt-2 rounded-md border border-accent/15 bg-accent/5 px-2.5 py-1.5 text-xs text-chalk-200 transition-all">
        {preview}
      </p>
    </div>
  );
}
