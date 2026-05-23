import { AssetAllocator } from "@/components/AssetAllocator";

export const metadata = {
  title: "Asset Allocation",
  description:
    "Get a personalised asset allocation across stocks, MFs, gold, bonds, US market, and real estate based on your age, goal, and risk profile.",
};

export default function AssetAllocationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Asset Allocation
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Build your portfolio mix
        </h1>
        <p className="mt-3 text-chalk-300 max-w-2xl">
          Tell us your goal, age, and risk appetite — and see a recommended
          allocation across Indian stocks, mutual funds, US market, gold, bonds,
          and real estate. Updates live as you adjust the inputs.
        </p>
      </header>
      <AssetAllocator />
    </div>
  );
}
