import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <header className="bg-white border-b border-[#e3e8ee] px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/register" className="text-[#64748d]">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="font-medium text-[#0d253d]">이용약관</h1>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-[#273951]">
        <div>
          <p className="text-sm text-[#64748d]">최종 수정일: 2026년 5월 22일</p>
          <p className="text-sm text-[#64748d] mt-1">monote 서비스를 이용해주셔서 감사합니다. 본 약관은 monote 서비스 이용에 관한 조건과 절차를 규정합니다.</p>
        </div>

        <Section title="제1조 (목적)">
          본 약관은 monote(이하 &quot;서비스&quot;)가 제공하는 학생 커뮤니티 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>&quot;서비스&quot;란 monote가 제공하는 학생 정보 공유 플랫폼을 의미합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 학생을 의미합니다.</li>
            <li>&quot;게시물&quot;이란 이용자가 서비스 내에 게시한 글, 사진, 파일 등 모든 콘텐츠를 의미합니다.</li>
            <li>&quot;닉네임&quot;이란 서비스 내에서 이용자를 식별하기 위해 이용자가 설정한 고유 이름을 의미합니다.</li>
          </ol>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <p className="text-sm mb-2">① 본 약관은 서비스 내에 게시함으로써 효력이 발생합니다.</p>
          <p className="text-sm mb-2">② 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 이용자에게 고지합니다.</p>
          <p className="text-sm">③ 이용자가 변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
        </Section>

        <Section title="제4조 (회원가입)">
          <p className="text-sm mb-2">① 이용자는 서비스가 정한 가입 양식에 따라 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.</p>
          <p className="text-sm mb-2">② 서비스는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다.</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>타인의 정보를 도용하여 가입 신청한 경우</li>
            <li>허위 정보를 기재한 경우</li>
            <li>만 14세 미만인 경우</li>
            <li>이전에 서비스 이용이 정지된 이용자인 경우</li>
          </ul>
        </Section>

        <Section title="제5조 (이용자의 의무)">
          이용자는 서비스 이용 시 다음 행위를 하여서는 안 됩니다.
          <ul className="list-disc list-inside text-sm space-y-1.5 mt-2 ml-2">
            <li>타인을 비방하거나 명예를 훼손하는 행위</li>
            <li>허위 정보를 게시하거나 유포하는 행위</li>
            <li>타인의 개인정보를 무단으로 수집·이용하는 행위</li>
            <li>음란물, 폭력적 콘텐츠 게시 행위</li>
            <li>광고, 홍보, 스팸 게시물 작성 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>타인의 계정을 도용하는 행위</li>
            <li>저작권 등 지식재산권을 침해하는 행위</li>
          </ul>
        </Section>

        <Section title="제6조 (게시물의 관리)">
          <p className="text-sm mb-2">① 이용자가 작성한 게시물의 저작권은 해당 이용자에게 귀속됩니다.</p>
          <p className="text-sm mb-2">② 서비스는 이용자가 게시한 콘텐츠를 서비스 운영, 홍보 목적으로 활용할 수 있습니다.</p>
          <p className="text-sm mb-2">③ 서비스는 다음 각 호에 해당하는 게시물을 사전 통보 없이 삭제할 수 있습니다.</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>타인의 명예를 훼손하거나 모욕하는 내용</li>
            <li>개인정보를 포함하는 내용</li>
            <li>불법적인 내용이나 서비스 이용약관에 위배되는 내용</li>
            <li>허위 정보 또는 과장된 정보</li>
          </ul>
        </Section>

        <Section title="제7조 (서비스의 중단)">
          <p className="text-sm mb-2">① 서비스는 시스템 점검, 보수, 교체 등 불가피한 사유가 있는 경우 서비스 제공을 일시 중단할 수 있습니다.</p>
          <p className="text-sm">② 천재지변, 국가 비상사태 등 서비스가 통제할 수 없는 사유로 인한 서비스 중단의 경우 책임을 지지 않습니다.</p>
        </Section>

        <Section title="제8조 (회원 탈퇴 및 계정 정지)">
          <p className="text-sm mb-2">① 이용자는 언제든지 서비스 탈퇴를 요청할 수 있으며, 서비스는 즉시 이를 처리합니다.</p>
          <p className="text-sm mb-2">② 서비스는 이용자가 본 약관을 위반한 경우 계정을 정지하거나 삭제할 수 있습니다.</p>
          <p className="text-sm">③ 탈퇴 시 이용자의 개인정보는 관련 법령에 따라 처리됩니다.</p>
        </Section>

        <Section title="제9조 (면책조항)">
          <p className="text-sm mb-2">① 서비스는 이용자 간에 발생한 분쟁에 대하여 책임을 지지 않습니다.</p>
          <p className="text-sm mb-2">② 서비스는 이용자가 게시한 정보의 신뢰성, 정확성에 대한 책임을 지지 않습니다.</p>
          <p className="text-sm">③ 서비스는 무료로 제공되는 서비스에서 발생한 손해에 대하여 법령이 허용하는 범위 내에서 책임을 제한합니다.</p>
        </Section>

        <Section title="제10조 (분쟁 해결)">
          본 약관과 관련하여 분쟁이 발생할 경우, 서비스와 이용자는 성실히 협의하여 해결하며, 협의가 되지 않을 경우 관련 법령에 따라 해결합니다. 본 약관에 관한 소송의 관할 법원은 대한민국 법원으로 합니다.
        </Section>

        <div className="pt-4 border-t border-[#e3e8ee]">
          <p className="text-xs text-[#64748d] text-center">문의: monote 서비스팀</p>
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
