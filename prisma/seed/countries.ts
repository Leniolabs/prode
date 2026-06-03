import { PrismaClient } from "@/generated/prisma";

const COUNTRIES: { name: string; code: string }[] = [
  // Group A
  { name: "México", code: "MEX" },
  { name: "Rep. Corea", code: "KOR" },
  { name: "Rep. Checa", code: "CZE" },
  { name: "Sudáfrica", code: "RSA" },
  // Group B
  { name: "Suiza", code: "CHE" },
  { name: "Canadá", code: "CAN" },
  { name: "Bosnia", code: "BIH" },
  { name: "Qatar", code: "QAT" },
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
  { name: "C. de Marfil", code: "CIV" },
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
  { name: "Iraq", code: "IRQ" },
  // Group J
  { name: "Argentina", code: "ARG" },
  { name: "Argelia", code: "ALG" },
  { name: "Austria", code: "AUT" },
  { name: "Jordania", code: "JOR" },
  // Group K
  { name: "Portugal", code: "PRT" },
  { name: "Colombia", code: "COL" },
  { name: "Uzbekistán", code: "UZB" },
  { name: "RD Congo", code: "COD" },
  // Group L
  { name: "Inglaterra", code: "ENG" },
  { name: "Croacia", code: "HRV" },
  { name: "Ghana", code: "GHA" },
  { name: "Panamá", code: "PAN" },
];

export async function seedCountries(prisma: PrismaClient) {
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { name: country.name },
      create: country,
      update: { code: country.code },
    });
  }
  console.log(`Upserted ${COUNTRIES.length} countries.`);
}
