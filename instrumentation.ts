export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureTables } = await import("./lib/db");
      await ensureTables();
    } catch (err) {
      console.error("[instrumentation] DB setup failed:", err);
    }
  }
}
