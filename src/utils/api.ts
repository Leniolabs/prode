import { Country, Match } from "@/generated/prisma";

export function getCountries(): Promise<
  Pick<Country, "id" | "code" | "name">[]
> {
  return fetch("/api/countries").then((resp) => resp.json());
}
