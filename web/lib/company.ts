// 운영사 정보 — 하단, 개인정보처리방침, 이용약관에서 함께 쓴다. 바뀌면 여기만 고치면 된다.
// 이메일은 아이디와 도메인을 나눠 적는다 (소스에서 주소를 긁어 가는 스팸 봇 대비)
const EMAIL_USER = "daniel";
const EMAIL_DOMAIN = "e-mymeta.com";

export const COMPANY = {
  name: "주식회사 마이메타",
  nameEn: "MyMeta Inc.",
  ceo: "진동환",
  bizNo: "676-81-02857",
  address: "서울시 관악구 낙성대로 38, B101",
  email: [EMAIL_USER, EMAIL_DOMAIN].join("@"),
  privacyOfficer: "진동환 (대표이사)",
  site: "www.pivotal.co.kr",
};

// 개인정보처리방침·이용약관 시행일
export const POLICY_EFFECTIVE_DATE = "2026년 10월 5일";

// 약관 버전 — 법률 검토 등으로 내용을 바꾸면 날짜를 새로 올린다.
// 동의한 버전이 이것과 다른 사용자는 다음 접속 때 동의 화면을 다시 거친다.
export const POLICY_VERSION = "2026-10-05";
