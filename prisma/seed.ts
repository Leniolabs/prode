import { PrismaClient, Stage } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Seed for the 2026 FIFA World Cup (Canada / Mexico / USA).
 * Format: 48 teams, 12 groups (A–L) of 4, 72 group-stage matches.
 *
 * Data source: https://github.com/gastonzarate/prode-mundial-2026-simulator
 * (grupos.md + fixture.md).
 *
 * Matches are seeded UNPLAYED (0-0, filled=false) so users can predict them.
 * Kick-off times mirror the source fixture and are treated as UTC — they are
 * approximate and may need adjustment to each venue's local time.
 *
 * NOTE: only the group stage is seeded. The 2026 knockout phase is a Round of
 * 32 → R16 → QF → SF → Final bracket whose participants are not yet known and
 * which the current `Stage` enum / finals logic (built for the 32-team 2022
 * bracket) does not model. Knockout matches are intentionally omitted.
 */

// name (display) -> flag code. Codes reuse existing /public/flags/*.png where a
// team carries over from 2022; new teams use ISO-3 codes (flag falls back to
// /default.png via CountryFlag when the image is missing).
const COUNTRIES: { name: string; code: string }[] = [
  // Group A
  { name: "México", code: "MEX" },
  { name: "Corea del Sur", code: "KOR" },
  { name: "Chequia", code: "CZE" },
  { name: "Sudáfrica", code: "RSA" },
  // Group B
  { name: "Suiza", code: "CHE" },
  { name: "Canadá", code: "CAN" },
  { name: "Bosnia y Herzegovina", code: "BIH" },
  { name: "Catar", code: "QAT" },
  // Group C
  { name: "Brasil", code: "BRA" },
  { name: "Escocia", code: "SCO" },
  { name: "Marruecos", code: "MAR" },
  { name: "Haití", code: "HAI" },
  // Group D
  { name: "Estados Unidos", code: "USA" },
  { name: "Paraguay", code: "PAR" },
  { name: "Australia", code: "AUS" },
  { name: "Turquía", code: "TUR" },
  // Group E
  { name: "Alemania", code: "DEU" },
  { name: "Costa de Marfil", code: "CIV" },
  { name: "Ecuador", code: "ECU" },
  { name: "Curazao", code: "CUW" },
  // Group F
  { name: "Países Bajos", code: "NLD" },
  { name: "Japón", code: "JPN" },
  { name: "Túnez", code: "TUN" },
  { name: "Suecia", code: "SWE" },
  // Group G
  { name: "Bélgica", code: "BEL" },
  { name: "Egipto", code: "EGY" },
  { name: "Irán", code: "IRN" },
  { name: "Nueva Zelanda", code: "NZL" },
  // Group H
  { name: "España", code: "ESP" },
  { name: "Cabo Verde", code: "CPV" },
  { name: "Arabia Saudita", code: "SAU" },
  { name: "Uruguay", code: "URU" },
  // Group I
  { name: "Francia", code: "FRA" },
  { name: "Senegal", code: "SEN" },
  { name: "Noruega", code: "NOR" },
  { name: "Irak", code: "IRQ" },
  // Group J
  { name: "Argentina", code: "ARG" },
  { name: "Argelia", code: "ALG" },
  { name: "Austria", code: "AUT" },
  { name: "Jordania", code: "JOR" },
  // Group K
  { name: "Portugal", code: "PRT" },
  { name: "Colombia", code: "COL" },
  { name: "Uzbekistán", code: "UZB" },
  { name: "RD del Congo", code: "COD" },
  // Group L
  { name: "Inglaterra", code: "ENG" },
  { name: "Croacia", code: "HRV" },
  { name: "Ghana", code: "GHA" },
  { name: "Panamá", code: "PAN" },
];

// [stage, leftName, rightName, kickoff]
type Fixture = [Stage, string, string, string];

const MATCHES: Fixture[] = [
  // GROUP A
  ["GROUP_A", "México", "Sudáfrica", "2026-06-11T13:00:00.000Z"],
  ["GROUP_A", "Corea del Sur", "Chequia", "2026-06-11T20:00:00.000Z"],
  ["GROUP_A", "Chequia", "Sudáfrica", "2026-06-18T12:00:00.000Z"],
  ["GROUP_A", "México", "Corea del Sur", "2026-06-18T23:00:00.000Z"],
  ["GROUP_A", "Chequia", "México", "2026-06-24T21:00:00.000Z"],
  ["GROUP_A", "Sudáfrica", "Corea del Sur", "2026-06-24T21:00:00.000Z"],
  // GROUP B
  ["GROUP_B", "Canadá", "Bosnia y Herzegovina", "2026-06-12T15:00:00.000Z"],
  ["GROUP_B", "Catar", "Suiza", "2026-06-13T12:00:00.000Z"],
  ["GROUP_B", "Suiza", "Bosnia y Herzegovina", "2026-06-18T15:00:00.000Z"],
  ["GROUP_B", "Canadá", "Catar", "2026-06-18T18:00:00.000Z"],
  ["GROUP_B", "Suiza", "Canadá", "2026-06-24T15:00:00.000Z"],
  ["GROUP_B", "Bosnia y Herzegovina", "Catar", "2026-06-24T15:00:00.000Z"],
  // GROUP C
  ["GROUP_C", "Brasil", "Marruecos", "2026-06-13T18:00:00.000Z"],
  ["GROUP_C", "Haití", "Escocia", "2026-06-13T21:00:00.000Z"],
  ["GROUP_C", "Escocia", "Marruecos", "2026-06-19T18:00:00.000Z"],
  ["GROUP_C", "Brasil", "Haití", "2026-06-19T21:00:00.000Z"],
  ["GROUP_C", "Escocia", "Brasil", "2026-06-24T18:00:00.000Z"],
  ["GROUP_C", "Marruecos", "Haití", "2026-06-24T18:00:00.000Z"],
  // GROUP D
  ["GROUP_D", "Estados Unidos", "Paraguay", "2026-06-12T18:00:00.000Z"],
  ["GROUP_D", "Australia", "Turquía", "2026-06-14T03:00:00.000Z"],
  ["GROUP_D", "Estados Unidos", "Australia", "2026-06-19T15:00:00.000Z"],
  ["GROUP_D", "Turquía", "Paraguay", "2026-06-20T03:00:00.000Z"],
  ["GROUP_D", "Turquía", "Estados Unidos", "2026-06-25T22:00:00.000Z"],
  ["GROUP_D", "Paraguay", "Australia", "2026-06-25T22:00:00.000Z"],
  // GROUP E
  ["GROUP_E", "Alemania", "Curazao", "2026-06-14T12:00:00.000Z"],
  ["GROUP_E", "Costa de Marfil", "Ecuador", "2026-06-14T19:00:00.000Z"],
  ["GROUP_E", "Alemania", "Costa de Marfil", "2026-06-20T16:00:00.000Z"],
  ["GROUP_E", "Ecuador", "Curazao", "2026-06-20T19:00:00.000Z"],
  ["GROUP_E", "Ecuador", "Alemania", "2026-06-25T16:00:00.000Z"],
  ["GROUP_E", "Curazao", "Costa de Marfil", "2026-06-25T16:00:00.000Z"],
  // GROUP F
  ["GROUP_F", "Países Bajos", "Japón", "2026-06-14T15:00:00.000Z"],
  ["GROUP_F", "Suecia", "Túnez", "2026-06-14T20:00:00.000Z"],
  ["GROUP_F", "Países Bajos", "Suecia", "2026-06-20T13:00:00.000Z"],
  ["GROUP_F", "Túnez", "Japón", "2026-06-21T00:00:00.000Z"],
  ["GROUP_F", "Japón", "Suecia", "2026-06-25T19:00:00.000Z"],
  ["GROUP_F", "Túnez", "Países Bajos", "2026-06-25T19:00:00.000Z"],
  // GROUP G
  ["GROUP_G", "Bélgica", "Egipto", "2026-06-15T15:00:00.000Z"],
  ["GROUP_G", "Irán", "Nueva Zelanda", "2026-06-16T03:00:00.000Z"],
  ["GROUP_G", "Bélgica", "Irán", "2026-06-21T15:00:00.000Z"],
  ["GROUP_G", "Nueva Zelanda", "Egipto", "2026-06-21T21:00:00.000Z"],
  ["GROUP_G", "Egipto", "Irán", "2026-06-26T23:00:00.000Z"],
  ["GROUP_G", "Nueva Zelanda", "Bélgica", "2026-06-26T23:00:00.000Z"],
  // GROUP H
  ["GROUP_H", "España", "Cabo Verde", "2026-06-15T12:00:00.000Z"],
  ["GROUP_H", "Arabia Saudita", "Uruguay", "2026-06-15T18:00:00.000Z"],
  ["GROUP_H", "España", "Arabia Saudita", "2026-06-21T12:00:00.000Z"],
  ["GROUP_H", "Uruguay", "Cabo Verde", "2026-06-21T18:00:00.000Z"],
  ["GROUP_H", "Cabo Verde", "Arabia Saudita", "2026-06-26T20:00:00.000Z"],
  ["GROUP_H", "Uruguay", "España", "2026-06-26T20:00:00.000Z"],
  // GROUP I
  ["GROUP_I", "Francia", "Senegal", "2026-06-16T15:00:00.000Z"],
  ["GROUP_I", "Irak", "Noruega", "2026-06-16T18:00:00.000Z"],
  ["GROUP_I", "Francia", "Irak", "2026-06-22T17:00:00.000Z"],
  ["GROUP_I", "Noruega", "Senegal", "2026-06-22T20:00:00.000Z"],
  ["GROUP_I", "Noruega", "Francia", "2026-06-26T15:00:00.000Z"],
  ["GROUP_I", "Senegal", "Irak", "2026-06-26T15:00:00.000Z"],
  // GROUP J
  ["GROUP_J", "Argentina", "Argelia", "2026-06-16T20:00:00.000Z"],
  ["GROUP_J", "Austria", "Jordania", "2026-06-17T03:00:00.000Z"],
  ["GROUP_J", "Argentina", "Austria", "2026-06-22T13:00:00.000Z"],
  ["GROUP_J", "Jordania", "Argelia", "2026-06-22T23:00:00.000Z"],
  ["GROUP_J", "Argelia", "Austria", "2026-06-27T22:00:00.000Z"],
  ["GROUP_J", "Jordania", "Argentina", "2026-06-27T22:00:00.000Z"],
  // GROUP K
  ["GROUP_K", "Portugal", "RD del Congo", "2026-06-17T12:00:00.000Z"],
  ["GROUP_K", "Uzbekistán", "Colombia", "2026-06-17T20:00:00.000Z"],
  ["GROUP_K", "Portugal", "Uzbekistán", "2026-06-23T13:00:00.000Z"],
  ["GROUP_K", "Colombia", "RD del Congo", "2026-06-23T20:00:00.000Z"],
  ["GROUP_K", "Colombia", "Portugal", "2026-06-27T19:30:00.000Z"],
  ["GROUP_K", "RD del Congo", "Uzbekistán", "2026-06-27T19:30:00.000Z"],
  // GROUP L
  ["GROUP_L", "Inglaterra", "Croacia", "2026-06-17T15:00:00.000Z"],
  ["GROUP_L", "Ghana", "Panamá", "2026-06-17T19:00:00.000Z"],
  ["GROUP_L", "Inglaterra", "Ghana", "2026-06-23T16:00:00.000Z"],
  ["GROUP_L", "Panamá", "Croacia", "2026-06-23T19:00:00.000Z"],
  ["GROUP_L", "Panamá", "Inglaterra", "2026-06-27T17:00:00.000Z"],
  ["GROUP_L", "Croacia", "Ghana", "2026-06-27T17:00:00.000Z"],
];

async function main() {
  await prisma.prodeUserFinalsMatch.deleteMany();
  await prisma.prodeUserGroupMatch.deleteMany();
  await prisma.userProde.deleteMany();
  await prisma.match.deleteMany();
  await prisma.country.deleteMany();
  await prisma.prode.deleteMany();

  const prode = await prisma.prode.create({
    data: {
      created: new Date(),
      stage: "GROUPS",
      groupSubmissionsEnd: new Date("2026-06-11T13:00:00.000Z"),
      finalsSubmissionsEnd: new Date("2026-06-28T00:00:00.000Z"),
      prodeEnd: new Date("2026-07-19T19:00:00.000Z"),
    },
  });

  await prisma.country.createMany({ data: COUNTRIES });
  const countries = await prisma.country.findMany();
  const idByName = new Map(countries.map((c) => [c.name, c.id]));

  const matchData = MATCHES.map(([stage, left, right, date]) => {
    const countryLeftId = idByName.get(left);
    const countryRightId = idByName.get(right);
    if (!countryLeftId || !countryRightId) {
      throw new Error(`Unknown country in fixture: ${left} vs ${right}`);
    }
    return {
      prodeId: prode.id,
      stage,
      goalsLeft: 0,
      goalsRight: 0,
      countryLeftId,
      countryRightId,
      date: new Date(date),
    };
  });

  await prisma.match.createMany({ data: matchData });

  console.log(
    `Seeded ${COUNTRIES.length} countries and ${matchData.length} group-stage matches for the 2026 World Cup.`
  );
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
