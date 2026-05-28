import { Country, Match } from "@prisma/client";

export function getCountries(): Promise<
  Pick<Country, "id" | "code" | "name">[]
> {
  return fetch("/api/countries").then((resp) => resp.json());
}
