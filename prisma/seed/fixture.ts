import { PrismaClient, Stage } from "@/generated/prisma";

type Fixture = [Stage, string, string, string];

// All times are UTC, converted from openfootball/worldcup.json local times + UTC offsets.
const MATCHES: Fixture[] = [
  // GROUP A
  ["GROUP_A", "México", "Sudáfrica", "2026-06-11T19:00:00.000Z"],         // 13:00 UTC-6
  ["GROUP_A", "Rep. Corea", "Rep. Checa", "2026-06-12T02:00:00.000Z"],    // 20:00 UTC-6
  ["GROUP_A", "Rep. Checa", "Sudáfrica", "2026-06-18T16:00:00.000Z"],      // 12:00 UTC-4
  ["GROUP_A", "México", "Rep. Corea", "2026-06-19T01:00:00.000Z"],        // 19:00 UTC-6
  ["GROUP_A", "Rep. Checa", "México", "2026-06-25T01:00:00.000Z"],         // 19:00 UTC-6
  ["GROUP_A", "Sudáfrica", "Rep. Corea", "2026-06-25T01:00:00.000Z"],      // 19:00 UTC-6
  // GROUP B
  ["GROUP_B", "Canadá", "Bosnia", "2026-06-12T19:00:00.000Z"],                // 15:00 UTC-4
  ["GROUP_B", "Qatar", "Suiza", "2026-06-13T19:00:00.000Z"],                  // 12:00 UTC-7
  ["GROUP_B", "Suiza", "Bosnia", "2026-06-18T19:00:00.000Z"],                 // 12:00 UTC-7
  ["GROUP_B", "Canadá", "Qatar", "2026-06-18T22:00:00.000Z"],                 // 15:00 UTC-7
  ["GROUP_B", "Suiza", "Canadá", "2026-06-24T19:00:00.000Z"],                // 12:00 UTC-7
  ["GROUP_B", "Bosnia", "Qatar", "2026-06-24T19:00:00.000Z"],                 // 12:00 UTC-7
  // GROUP C
  ["GROUP_C", "Brasil", "Marruecos", "2026-06-13T22:00:00.000Z"],    // 18:00 UTC-4
  ["GROUP_C", "Haití", "Escocia", "2026-06-14T01:00:00.000Z"],       // 21:00 UTC-4
  ["GROUP_C", "Escocia", "Marruecos", "2026-06-19T22:00:00.000Z"],   // 18:00 UTC-4
  ["GROUP_C", "Brasil", "Haití", "2026-06-20T00:30:00.000Z"],        // 20:30 UTC-4
  ["GROUP_C", "Escocia", "Brasil", "2026-06-24T22:00:00.000Z"],      // 18:00 UTC-4
  ["GROUP_C", "Marruecos", "Haití", "2026-06-24T22:00:00.000Z"],     // 18:00 UTC-4
  // GROUP D
  ["GROUP_D", "Estados Unidos", "Paraguay", "2026-06-13T01:00:00.000Z"],  // 18:00 UTC-7
  ["GROUP_D", "Australia", "Turquía", "2026-06-14T04:00:00.000Z"],        // 21:00 UTC-7
  ["GROUP_D", "Estados Unidos", "Australia", "2026-06-19T19:00:00.000Z"], // 12:00 UTC-7
  ["GROUP_D", "Turquía", "Paraguay", "2026-06-20T03:00:00.000Z"],         // 20:00 UTC-7
  ["GROUP_D", "Turquía", "Estados Unidos", "2026-06-26T02:00:00.000Z"],   // 19:00 UTC-7
  ["GROUP_D", "Paraguay", "Australia", "2026-06-26T02:00:00.000Z"],       // 19:00 UTC-7
  // GROUP E
  ["GROUP_E", "Alemania", "Curazao", "2026-06-14T17:00:00.000Z"],         // 12:00 UTC-5
  ["GROUP_E", "C. de Marfil", "Ecuador", "2026-06-14T23:00:00.000Z"],     // 19:00 UTC-4
  ["GROUP_E", "Alemania", "C. de Marfil", "2026-06-20T20:00:00.000Z"],    // 16:00 UTC-4
  ["GROUP_E", "Ecuador", "Curazao", "2026-06-21T00:00:00.000Z"],          // 19:00 UTC-5
  ["GROUP_E", "Curazao", "C. de Marfil", "2026-06-25T20:00:00.000Z"],     // 16:00 UTC-4
  ["GROUP_E", "Ecuador", "Alemania", "2026-06-25T20:00:00.000Z"],         // 16:00 UTC-4
  // GROUP F
  ["GROUP_F", "Países Bajos", "Japón", "2026-06-14T20:00:00.000Z"],  // 15:00 UTC-5
  ["GROUP_F", "Suecia", "Túnez", "2026-06-15T02:00:00.000Z"],        // 20:00 UTC-6
  ["GROUP_F", "Países Bajos", "Suecia", "2026-06-20T17:00:00.000Z"], // 12:00 UTC-5
  ["GROUP_F", "Túnez", "Japón", "2026-06-21T04:00:00.000Z"],         // 22:00 UTC-6
  ["GROUP_F", "Japón", "Suecia", "2026-06-25T23:00:00.000Z"],        // 18:00 UTC-5
  ["GROUP_F", "Túnez", "Países Bajos", "2026-06-25T23:00:00.000Z"],  // 18:00 UTC-5
  // GROUP G
  ["GROUP_G", "Bélgica", "Egipto", "2026-06-15T19:00:00.000Z"],        // 12:00 UTC-7
  ["GROUP_G", "Irán", "Nueva Zelanda", "2026-06-16T01:00:00.000Z"],    // 18:00 UTC-7
  ["GROUP_G", "Bélgica", "Irán", "2026-06-21T19:00:00.000Z"],          // 12:00 UTC-7
  ["GROUP_G", "Nueva Zelanda", "Egipto", "2026-06-22T01:00:00.000Z"],  // 18:00 UTC-7
  ["GROUP_G", "Egipto", "Irán", "2026-06-27T03:00:00.000Z"],           // 20:00 UTC-7
  ["GROUP_G", "Nueva Zelanda", "Bélgica", "2026-06-27T03:00:00.000Z"], // 20:00 UTC-7
  // GROUP H
  ["GROUP_H", "España", "Cabo Verde", "2026-06-15T16:00:00.000Z"],        // 12:00 UTC-4
  ["GROUP_H", "Arabia Saudita", "Uruguay", "2026-06-15T22:00:00.000Z"],   // 18:00 UTC-4
  ["GROUP_H", "España", "Arabia Saudita", "2026-06-21T16:00:00.000Z"],    // 12:00 UTC-4
  ["GROUP_H", "Uruguay", "Cabo Verde", "2026-06-21T22:00:00.000Z"],       // 18:00 UTC-4
  ["GROUP_H", "Cabo Verde", "Arabia Saudita", "2026-06-27T00:00:00.000Z"],// 19:00 UTC-5
  ["GROUP_H", "Uruguay", "España", "2026-06-27T00:00:00.000Z"],           // 18:00 UTC-6
  // GROUP I
  ["GROUP_I", "Francia", "Senegal", "2026-06-16T19:00:00.000Z"],   // 15:00 UTC-4
  ["GROUP_I", "Iraq", "Noruega", "2026-06-16T22:00:00.000Z"],      // 18:00 UTC-4
  ["GROUP_I", "Francia", "Iraq", "2026-06-22T21:00:00.000Z"],      // 17:00 UTC-4
  ["GROUP_I", "Noruega", "Senegal", "2026-06-23T00:00:00.000Z"],   // 20:00 UTC-4
  ["GROUP_I", "Noruega", "Francia", "2026-06-26T19:00:00.000Z"],   // 15:00 UTC-4
  ["GROUP_I", "Senegal", "Iraq", "2026-06-26T19:00:00.000Z"],      // 15:00 UTC-4
  // GROUP J
  ["GROUP_J", "Argentina", "Argelia", "2026-06-17T01:00:00.000Z"],  // 20:00 UTC-5
  ["GROUP_J", "Austria", "Jordania", "2026-06-17T04:00:00.000Z"],   // 21:00 UTC-7
  ["GROUP_J", "Argentina", "Austria", "2026-06-22T17:00:00.000Z"],  // 12:00 UTC-5
  ["GROUP_J", "Jordania", "Argelia", "2026-06-23T03:00:00.000Z"],   // 20:00 UTC-7
  ["GROUP_J", "Argelia", "Austria", "2026-06-28T02:00:00.000Z"],    // 21:00 UTC-5
  ["GROUP_J", "Jordania", "Argentina", "2026-06-28T02:00:00.000Z"], // 21:00 UTC-5
  // GROUP K
  ["GROUP_K", "Portugal", "RD Congo", "2026-06-17T17:00:00.000Z"],      // 12:00 UTC-5
  ["GROUP_K", "Uzbekistán", "Colombia", "2026-06-18T02:00:00.000Z"],    // 20:00 UTC-6
  ["GROUP_K", "Portugal", "Uzbekistán", "2026-06-23T17:00:00.000Z"],    // 12:00 UTC-5
  ["GROUP_K", "Colombia", "RD Congo", "2026-06-24T02:00:00.000Z"],      // 20:00 UTC-6
  ["GROUP_K", "Colombia", "Portugal", "2026-06-27T23:30:00.000Z"],      // 19:30 UTC-4
  ["GROUP_K", "RD Congo", "Uzbekistán", "2026-06-27T23:30:00.000Z"],    // 19:30 UTC-4
  // GROUP L
  ["GROUP_L", "Inglaterra", "Croacia", "2026-06-17T20:00:00.000Z"],  // 15:00 UTC-5
  ["GROUP_L", "Ghana", "Panamá", "2026-06-17T23:00:00.000Z"],        // 19:00 UTC-4
  ["GROUP_L", "Inglaterra", "Ghana", "2026-06-23T20:00:00.000Z"],    // 16:00 UTC-4
  ["GROUP_L", "Panamá", "Croacia", "2026-06-23T23:00:00.000Z"],      // 19:00 UTC-4
  ["GROUP_L", "Panamá", "Inglaterra", "2026-06-27T21:00:00.000Z"],   // 17:00 UTC-4
  ["GROUP_L", "Croacia", "Ghana", "2026-06-27T21:00:00.000Z"],       // 17:00 UTC-4
];

export async function seedFixture(prisma: PrismaClient, prodeId: string) {
  const countries = await prisma.country.findMany();
  const idByName = new Map(countries.map((c) => [c.name, c.id]));

  const matchData = MATCHES.map(([stage, left, right, date]) => {
    const countryLeftId = idByName.get(left);
    const countryRightId = idByName.get(right);
    if (!countryLeftId || !countryRightId) {
      throw new Error(`Unknown country in fixture: ${left} vs ${right}`);
    }
    return {
      prodeId,
      stage,
      goalsLeft: null as number | null,
      goalsRight: null as number | null,
      penaltisLeft: null as number | null,
      penaltisRight: null as number | null,
      filled: false,
      countryLeftId,
      countryRightId,
      date: new Date(date),
    };
  });

  // Delete existing group-stage matches for this prode before re-seeding
  await prisma.match.deleteMany({
    where: {
      prodeId,
      stage: {
        in: [
          "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D",
          "GROUP_E", "GROUP_F", "GROUP_G", "GROUP_H",
          "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
        ],
      },
    },
  });

  await prisma.match.createMany({ data: matchData });
  console.log(`Seeded ${matchData.length} group-stage matches.`);
}
