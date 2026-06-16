import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  SpikeRevertChart,
  LifeBellChart,
  ProfessionLindyChart,
  SpikeVsSlopeChart,
} from "@/components/MeanReversionCharts";

export const metadata = {
  title: "The Mean Reversion of Everything",
  description:
    "What a stock chart taught me about life, careers, and why carpenters will outlast software engineers.",
};

export default function BlogPost() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300 hover:text-chalk-50 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
          BLOG · Aditya Agrawal
        </p>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-chalk-50">
          The Mean Reversion<br className="hidden sm:block" /> of Everything
        </h1>
        <div className="mt-6 w-16 h-0.5 bg-accent/40 rounded-full" />
        <p className="mt-6 text-chalk-300 text-xl leading-relaxed serif">
          What a stock chart taught me about life, careers, and why carpenters
          will outlast software engineers.
        </p>
      </header>

      <div className="mb-10">
        <SpikeRevertChart />
      </div>

      <section className="space-y-5 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          It starts with a chart
        </h2>
        <p>
          Pull up any stock that has rallied 40% in a week. Wait. Six months
          later - almost without exception - most of that move is gone. Not all
          of it; rarely all of it. But the spike comes back down to meet the
          slope it left behind.
        </p>
        <p>
          The textbook reasons are manipulation, news cycles, exhaustion of
          buyers. I think the real reason is simpler, and it has a name traders
          use without ceremony: <em>profit booking</em>. When fear arrives,
          people don&apos;t sell what is losing - they sell what is winning.
          That&apos;s where the gains are locked in. The biggest winners get
          cut down first. The boring, sideways names barely move, because
          there was nothing in them to take off the table.
        </p>
        <p>
          This is the seed of an idea I&apos;ve been carrying around for a
          while. I&apos;ll call it the <strong className="text-chalk-50">
            Profit-Booking Principle</strong>. And I don&apos;t think it lives
          only in stock charts.
        </p>

        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans pt-4">
          This isn&apos;t really about stocks
        </h2>
        <p>
          The same shape - rise too fast, fall back hard - shows up almost
          anywhere I&apos;ve looked. Once you start seeing it, it becomes hard
          to unsee.
        </p>
        <p>
          The most obvious version is gravity. Throw something hard enough and
          it climbs; it always comes back. We accept this so totally we
          don&apos;t even count it as a pattern. But every other example below
          is just gravity wearing different clothes.
        </p>
      </section>

      <div className="my-10 grid gap-5 md:grid-cols-2">
        <LifeBellChart />
        <SpikeVsSlopeChart />
      </div>

      <section className="space-y-5 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          Where the pattern shows up
        </h2>
        <p>
          <strong className="text-chalk-50">A human life.</strong> Plot
          strength, energy, looks, even confidence against age and you get a
          bell curve, peaking somewhere in the middle. We rise, we plateau, we
          decline. Almost no one escapes the shape.
        </p>
        <p>
          <strong className="text-chalk-50">Empires.</strong> Rome took
          centuries to rise and centuries to fall. The Mongol empire rose in
          one generation and was gone in three. The faster the climb, the
          steeper the cliff. The British, the Soviets, the Mughals - same
          curve, different timezone.
        </p>
        <p>
          <strong className="text-chalk-50">Viral fame.</strong> Someone blows
          up on the internet in a week and is forgotten in a month. Meanwhile
          Morgan Freeman has compounded for fifty years and nobody is bored of
          him. Slow reputations outlast loud ones.
        </p>
        <p>
          <strong className="text-chalk-50">Trends.</strong> Bell-bottoms.
          Fidget spinners. NFTs. Each one looked permanent at the peak. Jeans
          were invented in 1873 and are still here, because they never spiked.
        </p>
        <p>
          <strong className="text-chalk-50">Companies.</strong> The meteoric
          IPOs - WeWork, Pets.com, dozens you&apos;ve forgotten - collapsed
          fastest. The hundred-year-old businesses that nobody finds exciting
          are quietly compounding through wars and recessions.
        </p>
        <p>
          <strong className="text-chalk-50">Diets and fitness fads.</strong>
          Keto, paleo, juice cleanses - each peaks and recedes. &quot;Eat less,
          move more&quot; has been right for a thousand years and will be right
          for another thousand.
        </p>
        <p>
          <strong className="text-chalk-50">Relationships.</strong> The
          fastest-burning romances are often the shortest. The ones that
          started as friendship and ripened slowly are the ones still standing
          decades later.
        </p>
      </section>

      <div className="my-10">
        <ProfessionLindyChart />
      </div>

      <section className="space-y-5 text-chalk-200 serif text-lg leading-relaxed">
        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans">
          The part I can&apos;t stop thinking about
        </h2>
        <p>
          Here is where the theory gets uncomfortable. Some professions are
          new. Some are <em>ancient</em>. And I think the curve cares about
          which is which.
        </p>
        <p>
          Carpentry, forging, farming, masonry, healing, cooking, lending -
          these have existed for five, seven, ten thousand years. Through
          plagues, empires, religions, revolutions. They survive because they
          answer permanent questions: shelter, food, tools, money, pain.
        </p>
        <p>
          Software engineering is roughly seventy years old. It hasn&apos;t
          peaked yet. By every signal I can read, it&apos;s still climbing
          fast. But the theory says: the steeper the climb, the more there is
          to give back. Someday - maybe in a decade, maybe in a century - a
          carpenter will out-earn a software engineer again, and no one will
          find it strange.
        </p>
        <p>
          Content creation is fifteen years old. Influencing as a career is
          younger than most pets. The curve there is barely past its launch.
          Enjoy it while it lasts.
        </p>
        <p>
          There is a name for the idea that age predicts longevity: the{" "}
          <strong className="text-chalk-50">Lindy Effect</strong>. The longer
          something has already survived, the longer it&apos;s likely to keep
          surviving. What the profit-booking lens adds is the{" "}
          <em>mechanism</em>: things at their peak are also where the
          accumulated &quot;profit&quot; sits, and that profit is what gets
          taken first when the world contracts.
        </p>

        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans pt-4">
          Where the theory breaks
        </h2>
        <p>
          A theory you can&apos;t poke holes in is just a belief. So here are
          the holes. Some things genuinely don&apos;t revert - extinction is
          forever, knowledge compounds, we&apos;re not going back to candles.
          The pattern is about <em>attention, valuation, popularity</em> - not
          raw capability.
        </p>
        <p>
          There&apos;s also survivorship bias in reverse: I remember the
          ancient crafts <em>because</em> they survived. The thousand crafts
          that didn&apos;t left no trace to mention.
        </p>

        <h2 className="text-2xl font-semibold text-chalk-50 not-italic font-sans pt-4">
          What to do with this
        </h2>
        <p>
          Be suspicious of anything rising too fast - including your own
          success. Be patient with anything growing slowly - including
          yourself. When choosing a career, a craft, a habit, a partner, ask
          how long the thing has already existed, and bet on the old.
        </p>
        <p className="text-chalk-100 text-xl serif italic border-l-2 border-accent pl-4 mt-8">
          The world rewards spikes, but it remembers slopes.
        </p>
      </section>

      <footer className="mt-12 pt-6 border-t border-ink-700/60 text-xs text-chalk-300/70">
        Written by Aditya Agrawal. Charts are illustrative, not data - the
        point is the shape.
      </footer>
    </article>
  );
}
