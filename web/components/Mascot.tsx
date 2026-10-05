// magic.ai 마스코트 "말풍선을 안은 별" (Claude Design 시안의 SVG를 옮김)
// 포즈: bubble(기본) · heart · wave · mug · moon · book

export type MascotPose = "bubble" | "heart" | "wave" | "mug" | "moon" | "book";

const STAR = "M256 94 C 281 182 323 229 414 252 C 323 275 281 322 256 410 C 231 322 189 275 98 252 C 189 229 231 182 256 94 Z";
const INK = "#2A1F66";
const HAND = "#9283FF";

const LABELS: Record<MascotPose, string> = {
  bubble: "말풍선을 안은 별 마스코트",
  heart: "하트를 안은 별 마스코트",
  wave: "손을 흔드는 별 마스코트",
  mug: "따뜻한 컵을 든 별 마스코트",
  moon: "달을 안고 쉬는 별 마스코트",
  book: "자료를 펼친 별 마스코트",
};

const FACE: Record<MascotPose, "happy" | "calm" | "open"> = {
  bubble: "happy",
  heart: "happy",
  wave: "open",
  mug: "calm",
  moon: "calm",
  book: "happy",
};

const line = (w: number) => ({ fill: "none", stroke: INK, strokeWidth: w, strokeLinecap: "round" as const });

function Face({ kind }: { kind: "happy" | "calm" | "open" }) {
  if (kind === "calm")
    return (
      <g>
        <path d="M206 214 Q222 228 238 214" {...line(12)} />
        <path d="M274 214 Q290 228 306 214" {...line(12)} />
        <path d="M246 242 Q256 250 266 242" {...line(9)} />
      </g>
    );
  return (
    <g>
      <path d="M206 218 Q222 200 238 218" {...line(12)} />
      <path d="M274 218 Q290 200 306 218" {...line(12)} />
      {kind === "open" ? (
        <path d="M240 234 Q256 262 272 234 Z" fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      ) : (
        <path d="M244 240 Q256 252 268 240" {...line(10)} />
      )}
    </g>
  );
}

function Props({ pose }: { pose: MascotPose }) {
  switch (pose) {
    case "bubble":
      return (
        <g>
          <rect x="158" y="298" width="196" height="112" rx="48" fill="#5A44E6" opacity={0.16} />
          <path d="M190 390 L176 428 L228 398 Z" fill="#fff" stroke="#fff" strokeWidth={10} strokeLinejoin="round" />
          <rect x="158" y="290" width="196" height="112" rx="48" fill="#fff" />
          <circle cx="210" cy="348" r="18" fill="#7761FF" />
          <circle cx="256" cy="348" r="18" fill="#7761FF" />
          <circle cx="302" cy="348" r="18" fill="#7761FF" />
          <ellipse cx="194" cy="300" rx="24" ry="19" transform="rotate(-20 194 300)" fill={HAND} />
          <ellipse cx="318" cy="300" rx="24" ry="19" transform="rotate(20 318 300)" fill={HAND} />
        </g>
      );
    case "heart":
      return (
        <g>
          <path
            d="M256 418 C 212 390 194 368 194 342 C 194 320 210 306 230 306 C 243 306 251 313 256 324 C 261 313 269 306 282 306 C 302 306 318 320 318 342 C 318 368 300 390 256 418 Z"
            fill="#fff"
            stroke="#fff"
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <ellipse cx="226" cy="330" rx="9" ry="6" transform="rotate(-30 226 330)" fill="#EBE8FF" />
          <ellipse cx="198" cy="350" rx="22" ry="18" transform="rotate(35 198 350)" fill={HAND} />
          <ellipse cx="314" cy="350" rx="22" ry="18" transform="rotate(-35 314 350)" fill={HAND} />
        </g>
      );
    case "wave":
      return (
        <g>
          <ellipse cx="352" cy="196" rx="24" ry="20" transform="rotate(-30 352 196)" fill={HAND} />
          <ellipse cx="186" cy="306" rx="22" ry="18" transform="rotate(20 186 306)" fill={HAND} />
        </g>
      );
    case "mug":
      return (
        <g>
          <path d="M242 290 Q232 278 242 266" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
          <path d="M266 292 Q256 280 266 268" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
          <rect x="210" y="308" width="92" height="84" rx="18" fill="#5A44E6" opacity={0.16} />
          <path d="M300 322 C 332 322 336 364 300 364" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
          <rect x="210" y="300" width="92" height="84" rx="18" fill="#fff" />
          <rect x="210" y="326" width="92" height="10" fill="#EBE8FF" />
          <ellipse cx="212" cy="348" rx="20" ry="24" fill={HAND} />
          <ellipse cx="300" cy="352" rx="20" ry="22" fill={HAND} />
        </g>
      );
    case "moon":
      return (
        <g>
          <path d="M253.3 302 A54 54 0 1 0 305.6 377.5 A46 46 0 0 1 253.3 302 Z" fill="#fff" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
          <ellipse cx="206" cy="356" rx="20" ry="24" fill={HAND} />
          <ellipse cx="314" cy="376" rx="20" ry="18" transform="rotate(-30 314 376)" fill={HAND} />
        </g>
      );
    case "book":
      return (
        <g>
          <path d="M256 318 C 234 304 204 300 176 306 L 176 390 C 204 384 234 388 256 402 Z" fill="#fff" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
          <path d="M256 318 C 278 304 308 300 336 306 L 336 390 C 308 384 278 388 256 402 Z" fill="#fff" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
          <path d="M256 322 L256 398" fill="none" stroke="#D9D3FF" strokeWidth={3} />
          <path d="M198 330 L236 336 M198 348 L236 354 M198 366 L228 371" fill="none" stroke="#C9C0FF" strokeWidth={5} strokeLinecap="round" />
          <path d="M276 336 L314 330 M276 354 L314 348 M284 371 L314 366" fill="none" stroke="#C9C0FF" strokeWidth={5} strokeLinecap="round" />
          <ellipse cx="180" cy="364" rx="20" ry="24" fill={HAND} />
          <ellipse cx="332" cy="364" rx="20" ry="24" fill={HAND} />
        </g>
      );
  }
}

export function Mascot({
  pose = "bubble",
  size = 240,
  className = "",
  decorative = false,
}: {
  pose?: MascotPose;
  size?: number | string;
  className?: string;
  decorative?: boolean; // 옆에 같은 뜻의 글이 있으면 스크린리더에서 숨김
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`block shrink-0 overflow-visible ${className}`}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": LABELS[pose] })}
    >
      <ellipse cx="256" cy="464" rx="118" ry="12" fill="#7761FF" opacity={0.14} />
      {pose === "moon" && (
        <g fill="#B3A6FF">
          <circle cx="354" cy="150" r="8" />
          <circle cx="378" cy="122" r="11" />
          <circle cx="408" cy="90" r="14" />
        </g>
      )}
      {pose === "wave" && (
        <g fill="none" stroke="#B3A6FF" strokeWidth={8} strokeLinecap="round">
          <path d="M388 150 Q404 168 394 192" />
          <path d="M410 132 Q434 162 420 202" />
        </g>
      )}
      <path d={STAR} fill="#7761FF" stroke="#7761FF" strokeWidth={60} strokeLinejoin="round" />
      <ellipse cx="204" cy="190" rx="16" ry="9" transform="rotate(-45 204 190)" fill="#fff" opacity={0.6} />
      <ellipse cx="256" cy="122" rx="5" ry="11" fill="#fff" opacity={0.55} />
      <Face kind={FACE[pose]} />
      <ellipse cx="190" cy="240" rx="16" ry="10" fill="#FF8110" opacity={0.9} />
      <ellipse cx="322" cy="240" rx="16" ry="10" fill="#FF8110" opacity={0.9} />
      <Props pose={pose} />
    </svg>
  );
}

// 로고·아바타용 작은 별 마크 (얼굴 대신 눈 두 개)
export function StarMark({ className = "size-8", color = "#7761FF", eyes = true }: { className?: string; color?: string; eyes?: boolean }) {
  return (
    <svg viewBox="62 58 388 388" className={`block shrink-0 ${className}`} aria-hidden>
      <path d={STAR} fill={color} stroke={color} strokeWidth={60} strokeLinejoin="round" />
      {eyes && (
        <>
          <circle cx="226" cy="214" r="13" fill={color === "#7761FF" ? "#fff" : "#7761FF"} />
          <circle cx="286" cy="214" r="13" fill={color === "#7761FF" ? "#fff" : "#7761FF"} />
        </>
      )}
    </svg>
  );
}
