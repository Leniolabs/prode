import { syncMatchResults as syncApiSportsMatchResults } from "@/lib/api-sports";
import { syncMatchResults as syncEspnMatchResults } from "@/lib/espn";

const DEFAULT_PROVIDER = "espn";

export function getResultsProvider(): string {
  return (process.env.RESULTS_PROVIDER ?? DEFAULT_PROVIDER).trim().toLowerCase();
}

export async function syncMatchResults() {
  const provider = getResultsProvider();

  if (provider === "espn") {
    return syncEspnMatchResults();
  }

  if (provider === "api-sports") {
    return syncApiSportsMatchResults();
  }

  throw new Error(`Unsupported RESULTS_PROVIDER: ${provider}`);
}
