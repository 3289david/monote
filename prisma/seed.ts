import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const SCHOOLS = [
  { name: "서울 한빛고등학교", type: "high", region: "서울" },
  { name: "서울 강남중학교", type: "middle", region: "서울" },
  { name: "서울 마포고등학교", type: "high", region: "서울" },
  { name: "서울 노원중학교", type: "middle", region: "서울" },
  { name: "서울 성북고등학교", type: "high", region: "서울" },
  { name: "부산 해운대고등학교", type: "high", region: "부산" },
  { name: "부산 연제중학교", type: "middle", region: "부산" },
  { name: "인천 송도중학교", type: "middle", region: "인천" },
  { name: "인천 연수고등학교", type: "high", region: "인천" },
  { name: "대구 경북고등학교", type: "high", region: "대구" },
  { name: "대구 달서중학교", type: "middle", region: "대구" },
  { name: "광주 조선대부속고등학교", type: "high", region: "광주" },
  { name: "대전 대신고등학교", type: "high", region: "대전" },
  { name: "수원 수원고등학교", type: "high", region: "수원" },
  { name: "성남 분당고등학교", type: "high", region: "성남" },
  { name: "용인 기흥고등학교", type: "high", region: "용인" },
  { name: "고양 일산동고등학교", type: "high", region: "고양" },
  { name: "창원 마산고등학교", type: "high", region: "창원" },
  { name: "전주 전주고등학교", type: "high", region: "전주" },
  { name: "청주 청원고등학교", type: "high", region: "청주" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create schools
  const schools = await Promise.all(
    SCHOOLS.map((s) =>
      prisma.school.upsert({
        where: { name: s.name },
        update: {},
        create: s,
      })
    )
  );

  console.log(`✅ Created ${schools.length} schools`);

  // Create demo user for each school
  const mainSchool = schools[0];
  const hashedPw = await bcrypt.hash("demo1234", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@monote.kr" },
    update: {},
    create: {
      email: "demo@monote.kr",
      password: hashedPw,
      nickname: "졸린수학신",
      schoolId: mainSchool.id,
      grade: 2,
      classNum: 3,
      points: 1250,
      level: 5,
      badges: ["exam_master", "performance_helper"],
      postCount: 23,
      helpfulCount: 47,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create default chat rooms for first school
  const defaultRooms = [
    { name: "전체 채팅", type: "school", isDefault: true },
    { name: "1학년 채팅방", type: "grade", grade: 1, isDefault: true },
    { name: "2학년 채팅방", type: "grade", grade: 2, isDefault: true },
    { name: "3학년 채팅방", type: "grade", grade: 3, isDefault: true },
  ];

  for (const room of defaultRooms) {
    await prisma.chatRoom.upsert({
      where: { id: `default-${mainSchool.id}-${room.type}-${room.grade ?? "all"}` },
      update: {},
      create: {
        id: `default-${mainSchool.id}-${room.type}-${room.grade ?? "all"}`,
        schoolId: mainSchool.id,
        name: `${mainSchool.name.split(" ")[1]} ${room.name}`,
        type: room.type,
        grade: (room as any).grade,
        createdById: demoUser.id,
        isDefault: true,
        memberCount: 1,
      },
    });
  }

  console.log("✅ Created default chat rooms");

  // Create demo posts
  const demoPosts = [
    {
      grade: 2, subject: "수학", category: "exam_range", importance: "critical",
      title: "2학기 중간고사 수학 범위 정리",
      content: "수학 선생님이 오늘 말씀하셨습니다.\n\n범위: 3단원 ~ 4단원 끝까지\n- 3단원: 삼각함수 (공식 전부 암기 필수)\n- 4단원: 수열 (등차, 등비수열 일반항)\n\n주의: 프린트 7번 문제 유형 꼭 풀어보기!\n지난 시험에서 비슷한 문제가 나왔다고 하심.",
      tags: ["삼각함수", "수열", "중간고사"],
      isPinned: true,
    },
    {
      grade: 2, subject: "영어", category: "performance", importance: "high",
      title: "영어 수행평가 발표 순서 및 주제 공유",
      content: "영어 선생님이 수행평가 관련해서 공지하셨어요!\n\n발표 날짜: 다음주 목요일\n발표 시간: 3분 내외\n주제: 환경 문제 또는 자유 주제\n\nPPT 필수! 슬라이드 최소 5장",
      tags: ["수행평가", "발표", "영어"],
    },
    {
      grade: 2, subject: "국어", category: "teacher_info", importance: "high",
      title: "국어 선생님 시험 스타일 정리 (3년 분석)",
      content: "3년치 시험 분석해봤습니다.\n\n서술형 비중: 40%\n교과서 문학 지문 위주\n문법 파트: 품사/문장성분 꼭 외우기\n\n절대 안 나오는 것: 고전문학 (거의 없음)\n외국 작품 (국내 작품만 출제)",
      tags: ["국어", "선생님스타일", "서술형"],
    },
  ];

  for (const p of demoPosts) {
    await prisma.post.create({
      data: {
        schoolId: mainSchool.id,
        authorId: demoUser.id,
        ...p,
        files: [],
        isPinned: (p as any).isPinned ?? false,
      },
    });
  }

  console.log("✅ Created demo posts");
  console.log("\n🎉 Seed complete!");
  console.log("\n📌 Demo credentials:");
  console.log("  Email: demo@monote.kr");
  console.log("  Password: demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
