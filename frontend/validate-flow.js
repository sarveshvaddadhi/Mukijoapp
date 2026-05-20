const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  console.log("=== STARTING PROGRAMMATIC VALIDATION ===");

  // 1. Find our test users from database setup
  const coach = await prisma.user.findUnique({ where: { email: "coach@example.com" } });
  const parent = await prisma.user.findUnique({ where: { email: "parent@example.com" } });
  const player = await prisma.user.findUnique({ where: { email: "player@example.com" } });
  const team = await prisma.team.findFirst({ where: { name: "Eagles FC" } });

  if (!coach || !parent || !player || !team) {
    throw new Error("Missing test users or team. Please run setup-test-data first.");
  }

  // 2. Validate GET /api/teams/[id]/members (before linking)
  console.log("\nTesting team members query (pre-link)...");
  const getMembers = async () => {
    // Simulate API query
    return await prisma.teamMember.findMany({
      where: { teamId: team.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            parentLinks: {
              include: { child: { select: { id: true, name: true } } }
            },
            childLinks: {
              include: { parent: { select: { id: true, name: true } } }
            }
          }
        }
      }
    });
  };

  let members = await getMembers();
  let playerMember = members.find(m => m.userId === player.id);
  console.log("Player's linked parents (should be empty):", playerMember.user.childLinks);

  // 3. Simulate POST /api/parent-links (Establish Link)
  console.log("\nCreating parent-child link...");
  const link = await prisma.parentLink.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: player.id } },
    update: {},
    create: { parentId: parent.id, childId: player.id }
  });
  console.log("Link created:", link);

  // 4. Validate GET /api/teams/[id]/members (after linking)
  console.log("\nTesting team members query (post-link)...");
  members = await getMembers();
  playerMember = members.find(m => m.userId === player.id);
  console.log("Player's linked parents (should have Parent Patricia):",
    JSON.stringify(playerMember.user.childLinks, null, 2)
  );

  if (playerMember.user.childLinks.length === 0 || playerMember.user.childLinks[0].parent.name !== "Parent Patricia") {
    throw new Error("Linking failed or members query does not return relationship.");
  }

  // 5. Validate GET /api/payments (parent user payments query)
  console.log("\nTesting parent payments retrieval...");
  // Simulate GET /api/payments?userId=parent.id
  const getPaymentsForParent = async (userId) => {
    const parentLinks = await prisma.parentLink.findMany({
      where: { parentId: userId },
      select: { childId: true }
    });
    const userIds = [userId, ...parentLinks.map(l => l.childId)];

    return await prisma.payment.findMany({
      where: { userId: { in: userIds }, status: "PENDING" },
      include: { user: { select: { id: true, name: true } } }
    });
  };

  const payments = await getPaymentsForParent(parent.id);
  console.log("Payments returned for Parent Patricia:", JSON.stringify(payments, null, 2));

  if (payments.length === 0 || payments[0].userId !== player.id) {
    throw new Error("Parent did not receive child player's payment.");
  }
  console.log("Success! Parent query successfully retrieved player's fee.");

  // 6. Simulate DELETE /api/parent-links (Remove Link)
  console.log("\nTesting unlinking...");
  await prisma.parentLink.delete({
    where: { parentId_childId: { parentId: parent.id, childId: player.id } }
  });
  console.log("Link deleted successfully.");

  members = await getMembers();
  playerMember = members.find(m => m.userId === player.id);
  console.log("Player's linked parents (should be empty again):", playerMember.user.childLinks);

  if (playerMember.user.childLinks.length > 0) {
    throw new Error("Unlinking failed.");
  }

  console.log("\n=== ALL PROGRAMMATIC TESTS PASSED SUCCESSFULLY ===");
}

test()
  .catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
