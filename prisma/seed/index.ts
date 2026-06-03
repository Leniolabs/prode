import { PrismaClient } from "@prisma/client";
import { seedCountries } from "./countries";
import { seedFixture } from "./fixture";
import { seedBracket } from "./bracket";

const prisma = new PrismaClient();

async function main() {
  await seedCountries(prisma);

  const prode = await prisma.prode.upsert({
    where: { id: "wc2026" },
    create: {
      id: "wc2026",
      stage: "GROUPS",
      created: new Date(),
      groupSubmissionsEnd: new Date("2026-06-11T13:00:00.000Z"),
      finalsSubmissionsEnd: new Date("2026-07-04T17:00:00.000Z"),
      prodeEnd: new Date("2026-07-19T19:00:00.000Z"),
    },
    update: {},
  });

  await seedFixture(prisma, prode.id);
  await seedBracket(prisma, prode.id);

  console.log(`WC 2026 seed complete. Prode id: ${prode.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
