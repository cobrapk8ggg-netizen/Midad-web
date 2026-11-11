export default function LiquidSculpture({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={"liquid-sculpture " + (compact ? "sculpture-compact" : "")}
      aria-hidden="true"
    >
      <svg viewBox="0 0 680 680" fill="none">
        <defs>
          <linearGradient
            id="chrome"
            x1="100"
            y1="60"
            x2="540"
            y2="610"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" />
            <stop offset=".14" stopColor="#77777e" />
            <stop offset=".25" stopColor="#09090b" />
            <stop offset=".39" stopColor="#bdbdc7" />
            <stop offset=".46" stopColor="#fff" />
            <stop offset=".5" stopColor="#2e2e34" />
            <stop offset=".68" stopColor="#050506" />
            <stop offset=".86" stopColor="#8a8a93" />
            <stop offset="1" stopColor="#e9e9ed" />
          </linearGradient>
          <linearGradient
            id="edge"
            x1="180"
            y1="100"
            x2="520"
            y2="550"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset=".35" stopColor="#ffffff10" />
            <stop offset=".65" stopColor="#fff" />
            <stop offset="1" stopColor="#ffffff15" />
          </linearGradient>
          <linearGradient id="glass-panel" x1="100" y1="100" x2="500" y2="540">
            <stop stopColor="#ffffff24" />
            <stop offset=".45" stopColor="#ffffff02" />
            <stop offset=".8" stopColor="#ffffff10" />
            <stop offset="1" stopColor="#ffffff35" />
          </linearGradient>
          <radialGradient id="silver-halo">
            <stop stopColor="#b9b9c6" stopOpacity=".25" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="shadow">
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>
        <ellipse
          cx="340"
          cy="570"
          rx="230"
          ry="28"
          fill="#ddd"
          opacity=".1"
          filter="url(#shadow)"
        />
        <ellipse cx="330" cy="330" rx="315" ry="300" fill="url(#silver-halo)" />
        <g transform="rotate(-14 340 330)">
          <path
            d="M179 131 449 98Q479 94 491 127L554 449Q560 483 529 494L269 586Q239 596 230 563L151 173Q145 139 179 131Z"
            fill="url(#glass-panel)"
            stroke="url(#edge)"
            strokeWidth="1.3"
          />
          <path
            d="M163 154 433 121Q463 117 475 150L538 472Q544 506 513 517L253 609Q223 619 214 586L135 196Q129 162 163 154Z"
            fill="url(#glass-panel)"
            stroke="url(#edge)"
            strokeWidth="1.1"
          />
          <path
            d="M141 180 411 147Q441 143 453 176L516 498Q522 532 491 543L231 635Q201 645 192 612L113 222Q107 188 141 180Z"
            fill="#0a0a0dc9"
            stroke="url(#edge)"
            strokeWidth="2"
          />
          <path
            d="M146 185 411 153"
            stroke="white"
            opacity=".7"
            strokeWidth="2"
          />
          <path
            d="M124 211 199 597"
            stroke="white"
            opacity=".14"
            strokeWidth="4"
          />
        </g>
        <path
          d="M203 482C301 501 352 461 361 395C370 329 299 305 278 345C253 392 316 425 374 387C432 349 448 253 435 169C492 208 499 340 446 431C403 503 326 552 228 532L203 482ZM306 355C323 337 343 357 340 379C323 386 293 374 306 355Z"
          fill="url(#chrome)"
          fillRule="evenodd"
          stroke="url(#edge)"
          strokeWidth="1.8"
        />
        <path
          d="M211 489C282 506 347 467 359 405M445 198C478 300 454 397 406 448"
          stroke="#fff"
          strokeOpacity=".45"
          strokeWidth="1.2"
        />
        <path
          d="M425 91 470 80M520 168 533 140M121 378 95 387"
          stroke="#fff"
          opacity=".4"
        />
        <circle cx="470" cy="80" r="3" fill="#fff" opacity=".7" />
        <circle cx="533" cy="140" r="2" fill="#fff" opacity=".5" />
      </svg>
      <div className="sculpture-coordinate">
        <span>مساحة تتّسع لعالمك</span>
        <span>مِداد / ٠١</span>
      </div>
    </div>
  );
}
