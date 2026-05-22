import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <header className="bg-white border-b border-[#e3e8ee] px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/register" className="text-[#64748d]">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="font-medium text-[#0d253d]">개인정보 처리방침</h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-[#273951]">
        <div>
          <p className="text-sm text-[#64748d]">최종 수정일: 2026년 5월 22일</p>
          <p className="text-sm text-[#64748d] mt-1">monote(이하 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 여기며, 개인정보보호법 등 관련 법령을 준수합니다.</p>
        </div>

        <Section title="1. 수집하는 개인정보 항목">
          <p className="text-sm mb-2">서비스는 다음과 같은 개인정보를 수집합니다.</p>
          <div className="bg-white rounded-xl border border-[#e3e8ee] p-4 text-sm space-y-3">
            <div>
              <p className="font-medium text-[#0d253d] mb-1">필수 항목</p>
              <ul className="list-disc list-inside space-y-1 text-[#64748d]">
                <li>이메일 주소 (로그인 및 계정 관리용)</li>
                <li>비밀번호 (암호화하여 저장)</li>
                <li>닉네임</li>
                <li>학교명, 학년, 반</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#0d253d] mb-1">자동 수집 항목</p>
              <ul className="list-disc list-inside space-y-1 text-[#64748d]">
                <li>서비스 이용 기록 (게시물, 댓글, 투표 활동)</li>
                <li>접속 일시</li>
                <li>기기 정보 (브라우저 종류, OS)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#0d253d] mb-1">선택 항목</p>
              <ul className="list-disc list-inside space-y-1 text-[#64748d]">
                <li>프로필 이미지</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="2. 개인정보의 수집 및 이용 목적">
          <ul className="list-disc list-inside text-sm space-y-2 ml-1">
            <li><span className="font-medium">회원 관리:</span> 회원가입, 본인 확인, 계정 관리, 부정 이용 방지</li>
            <li><span className="font-medium">서비스 제공:</span> 게시물 작성, 커뮤니티 기능, 채팅 서비스 운영</li>
            <li><span className="font-medium">서비스 개선:</span> 이용 통계 분석, 기능 개선</li>
            <li><span className="font-medium">고객 지원:</span> 문의 응대, 공지사항 전달</li>
          </ul>
        </Section>

        <Section title="3. 개인정보의 보유 및 이용 기간">
          <p className="text-sm mb-3">원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
          <div className="bg-white rounded-xl border border-[#e3e8ee] overflow-hidden text-sm">
            <table className="w-full">
              <thead className="bg-[#f6f9fc]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748d]">항목</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748d]">보유 기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]">
                <tr><td className="px-4 py-2.5 text-[#273951]">회원 정보</td><td className="px-4 py-2.5 text-[#64748d]">탈퇴 시까지</td></tr>
                <tr><td className="px-4 py-2.5 text-[#273951]">게시물 및 댓글</td><td className="px-4 py-2.5 text-[#64748d]">삭제 요청 시까지</td></tr>
                <tr><td className="px-4 py-2.5 text-[#273951]">서비스 이용 기록</td><td className="px-4 py-2.5 text-[#64748d]">1년</td></tr>
                <tr><td className="px-4 py-2.5 text-[#273951]">부정 이용 관련 기록</td><td className="px-4 py-2.5 text-[#64748d]">1년</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p className="text-sm mb-2">서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우에는 예외로 합니다.</p>
          <ul className="list-disc list-inside text-sm space-y-1.5 ml-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보의 파기 절차 및 방법">
          <p className="text-sm mb-2">서비스는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
          <ul className="list-disc list-inside text-sm space-y-1.5 ml-1">
            <li><span className="font-medium">전자적 파일:</span> 복구 불가능한 방법으로 영구 삭제</li>
            <li><span className="font-medium">종이 문서:</span> 분쇄기로 분쇄하거나 소각</li>
          </ul>
        </Section>

        <Section title="6. 이용자의 권리와 행사 방법">
          이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
          <ul className="list-disc list-inside text-sm space-y-1.5 mt-2 ml-1">
            <li>개인정보 처리 현황 조회</li>
            <li>개인정보 수정 (프로필 설정에서 직접 변경)</li>
            <li>개인정보 삭제 (회원 탈퇴를 통한 삭제)</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>
        </Section>

        <Section title="7. 쿠키(Cookie) 사용">
          <p className="text-sm mb-2">서비스는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다.</p>
          <p className="text-sm mb-2">쿠키는 이용자의 브라우저에 저장되는 소량의 정보로, 로그인 상태 유지 등의 목적으로 사용됩니다.</p>
          <p className="text-sm">이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.</p>
        </Section>

        <Section title="8. 개인정보 보호책임자">
          <div className="bg-white rounded-xl border border-[#e3e8ee] p-4 text-sm">
            <p className="text-[#273951]"><span className="font-medium">책임자:</span> monote 서비스팀</p>
            <p className="text-[#273951] mt-1"><span className="font-medium">이메일:</span> support@monote.kr</p>
            <p className="text-[#64748d] text-xs mt-2">개인정보 관련 문의는 위 이메일로 연락 주시면 신속하게 처리해드리겠습니다.</p>
          </div>
        </Section>

        <Section title="9. 개인정보 처리방침 변경">
          본 개인정보 처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 변경 시에는 서비스 내 공지사항을 통해 고지합니다.
        </Section>

        <div className="pt-4 border-t border-[#e3e8ee]">
          <p className="text-xs text-[#64748d] text-center">본 방침은 2026년 5월 22일부터 적용됩니다.</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-medium text-[#0d253d] mb-2">{title}</h2>
      <div className="text-sm text-[#273951] leading-relaxed">{children}</div>
    </div>
  );
}
