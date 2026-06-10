// Throwaway: give the harness dev user membership in a specific room so the
// screenshot harness can render its room-scoped pages (bypasses password).
import { loadHarnessEnv } from "./env";

async function main() {
  loadHarnessEnv();
  const { prisma } = await import("../src/lib");

  const email = "playwright@dev.local";
  const roomId = process.argv[2] ?? "cmq8ifx9d0003jtymwo4433oe";

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "playwright" },
    update: {},
  });

  const room = await prisma.prodeRoom.findUnique({ where: { id: roomId } });
  if (!room) throw new Error(`room ${roomId} not found`);

  const existing = await prisma.userProde.findUnique({
    where: { userId_prodeRoomId: { userId: user.id, prodeRoomId: roomId } },
  });
  if (!existing) {
    await prisma.userProde.create({
      data: {
        prodeId: room.prodeId,
        userId: user.id,
        prodeRoomId: roomId,
        created: new Date(),
      },
    });
  }

  console.log(`ok: ${email} -> room ${roomId} (${room.name})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
