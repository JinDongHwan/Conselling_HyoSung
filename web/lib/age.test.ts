import { describe, expect, it } from "vitest";
import { ageBand, ageOn, needsGuardianConsent, signupBlockReason } from "./age";

// 기준일: 2026-10-06 (한국 시간 정오)
const TODAY = new Date("2026-10-06T03:00:00Z");

const school = { allow_minors: true, allow_under14: true };
const highSchool = { allow_minors: true, allow_under14: false };
const company = { allow_minors: false, allow_under14: false };

describe("만 나이 계산", () => {
  it("생일이 지나야 한 살을 더한다", () => {
    expect(ageOn("2012-10-06", TODAY)).toBe(14); // 오늘 생일 → 만 14세
    expect(ageOn("2012-10-07", TODAY)).toBe(13); // 내일 생일 → 아직 만 13세
    expect(ageOn("2007-10-06", TODAY)).toBe(19);
    expect(ageOn("2007-10-07", TODAY)).toBe(18);
  });

  it("한국 날짜 기준으로 계산한다 (UTC로는 전날이어도)", () => {
    const kstMidnight = new Date("2026-10-05T15:30:00Z"); // 한국 10월 6일 00:30
    expect(ageOn("2012-10-06", kstMidnight)).toBe(14);
  });

  it("없는 날짜나 형식이 틀리면 null", () => {
    expect(ageOn("2012-02-30", TODAY)).toBeNull();
    expect(ageOn("20121006", TODAY)).toBeNull();
    expect(ageOn("", TODAY)).toBeNull();
  });
});

describe("나이 구간", () => {
  it("14세 미만 / 14~18세 / 19세 이상", () => {
    expect(ageBand(13)).toBe("under14");
    expect(ageBand(14)).toBe("teen");
    expect(ageBand(18)).toBe("teen");
    expect(ageBand(19)).toBe("adult");
  });

  it("만 14세 미만만 보호자 동의가 필요하다", () => {
    expect(needsGuardianConsent("under14")).toBe(true);
    expect(needsGuardianConsent("teen")).toBe(false);
    expect(needsGuardianConsent("adult")).toBe(false);
  });
});

describe("가입 가능 여부", () => {
  it("만 19세 이상: 개인 가입과 기관 가입 모두 가능", () => {
    expect(signupBlockReason(19, null)).toBeNull();
    expect(signupBlockReason(35, company)).toBeNull();
  });

  it("만 14~18세: 기관 코드 없이는 불가, 청소년 허용 기관이면 가능", () => {
    expect(signupBlockReason(16, null)).toMatch(/가입 코드/);
    expect(signupBlockReason(16, company)).toMatch(/만 19세 미만/);
    expect(signupBlockReason(16, highSchool)).toBeNull();
  });

  it("만 14세 미만: 14세 미만 허용 기관에서만 가능", () => {
    expect(signupBlockReason(10, null)).toMatch(/가입 코드/);
    expect(signupBlockReason(10, highSchool)).toMatch(/만 14세 미만/);
    expect(signupBlockReason(10, school)).toBeNull();
  });

  it("생년월일이 없거나 비정상이면 불가", () => {
    expect(signupBlockReason(null, school)).toMatch(/생년월일/);
    expect(signupBlockReason(3, school)).toMatch(/생년월일/);
    expect(signupBlockReason(130, null)).toMatch(/생년월일/);
  });
});
