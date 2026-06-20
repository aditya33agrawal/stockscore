import { AssetAllocator } from "@/components/AssetAllocator";

export const metadata = {
  title: "Asset Allocation",
  description:
    "Build a wealth-creation portfolio mix or a goal-based allocation across equity, debt, metal, real estate, bonds, foreign markets, and cash - based on your amount, age, risk appetite, and time horizon.",
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
          Choose <strong className="text-chalk-100">Wealth Creation</strong> to size a full
          portfolio across equity, debt, metal, real estate, bonds &amp; bills, foreign
          markets, and cash - or <strong className="text-chalk-100">Goal-Based</strong> to
          plan around a specific lump sum or SIP goal. Sign in to save each computation to
          your history.
        </p>
      </header>
      <AssetAllocator />
    </div>
  );
}
