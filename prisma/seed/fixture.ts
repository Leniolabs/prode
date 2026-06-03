import { PrismaClient, Stage } from "@prisma/client";

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
