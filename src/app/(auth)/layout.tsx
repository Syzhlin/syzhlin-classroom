export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Cream Passport Map Background ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Paper grain overlay */}
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
        <rect width="1200" height="800" fill="#F5F0E8" filter="url(#grain)" opacity="0.18" />

        {/* ── World continents silhouette — very faint watermark ── */}
        <g opacity="0.07" fill="#8B7355" stroke="none">
          {/* North America */}
          <path d="M 95 140 L 115 130 L 145 125 L 175 120 L 200 128 L 220 140 L 235 160 L 240 185 L 230 210 L 215 235 L 200 255 L 185 270 L 175 290 L 165 310 L 158 330 L 155 345 L 148 355 L 135 360 L 120 358 L 108 348 L 100 330 L 95 310 L 90 285 L 88 260 L 88 235 L 90 210 L 92 185 L 93 160 Z" />
          {/* Greenland */}
          <path d="M 215 85 L 240 80 L 265 82 L 280 92 L 285 108 L 278 122 L 260 130 L 240 132 L 222 125 L 213 110 L 212 95 Z" />
          {/* South America */}
          <path d="M 175 370 L 195 360 L 218 365 L 232 378 L 238 400 L 238 428 L 232 455 L 220 478 L 205 498 L 188 512 L 172 520 L 160 518 L 150 508 L 145 490 L 143 468 L 145 445 L 148 420 L 152 398 L 158 378 Z" />
          {/* Europe */}
          <path d="M 530 100 L 555 95 L 578 98 L 595 108 L 600 125 L 592 140 L 575 150 L 555 155 L 538 150 L 525 138 L 522 122 L 525 108 Z" />
          {/* Scandinavia hint */}
          <path d="M 560 72 L 572 65 L 582 68 L 585 80 L 578 90 L 565 92 L 556 85 Z" />
          {/* Africa */}
          <path d="M 548 175 L 575 168 L 600 172 L 622 185 L 635 205 L 640 232 L 638 262 L 630 292 L 615 318 L 595 338 L 572 350 L 550 352 L 530 344 L 515 328 L 508 305 L 506 278 L 508 250 L 514 222 L 524 198 L 536 182 Z" />
          {/* Asia — simplified */}
          <path d="M 640 90 L 680 82 L 730 80 L 785 85 L 835 92 L 875 105 L 905 122 L 918 142 L 910 162 L 888 175 L 860 182 L 828 185 L 795 182 L 760 178 L 725 175 L 695 172 L 668 168 L 648 158 L 638 142 L 635 122 L 636 105 Z" />
          {/* India */}
          <path d="M 738 188 L 758 185 L 775 190 L 782 205 L 778 225 L 765 242 L 748 250 L 734 245 L 726 228 L 726 210 L 730 196 Z" />
          {/* Southeast Asia */}
          <path d="M 822 195 L 848 190 L 870 198 L 880 215 L 872 232 L 852 238 L 832 232 L 820 215 Z" />
          {/* Australia */}
          <path d="M 848 355 L 882 345 L 918 348 L 945 360 L 958 382 L 955 408 L 938 428 L 912 438 L 882 435 L 856 420 L 842 398 L 840 372 Z" />
          {/* Japan hint */}
          <path d="M 908 138 L 920 132 L 930 138 L 928 152 L 916 158 L 906 150 Z" />
        </g>

        {/* ── Latitude / longitude lines — very faint ── */}
        <g opacity="0.05" stroke="#7A6A55" strokeWidth="0.8" fill="none">
          {/* Horizontal latitude lines */}
          <line x1="0" y1="200" x2="1200" y2="200" />
          <line x1="0" y1="400" x2="1200" y2="400" />
          <line x1="0" y1="600" x2="1200" y2="600" />
          {/* Vertical longitude lines */}
          <line x1="200" y1="0" x2="200" y2="800" />
          <line x1="400" y1="0" x2="400" y2="800" />
          <line x1="600" y1="0" x2="600" y2="800" />
          <line x1="800" y1="0" x2="800" y2="800" />
          <line x1="1000" y1="0" x2="1000" y2="800" />
          {/* Diagonal — equator curve hint */}
          <path d="M 0 410 Q 300 390 600 400 Q 900 410 1200 400" />
        </g>

        {/* ── Passport stamp circles — corners, very faint ── */}
        {/* Bottom-left stamp */}
        <g opacity="0.06" transform="translate(100,660)">
          <circle cx="0" cy="0" r="72" stroke="#8B7355" strokeWidth="2" fill="none" strokeDasharray="4 3" />
          <circle cx="0" cy="0" r="60" stroke="#8B7355" strokeWidth="1" fill="none" />
          <text x="0" y="-38" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#8B7355" letterSpacing="4">SYZHLIN CLASS</text>
          <text x="0" y="4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="#8B7355" fontWeight="bold">SEOUL</text>
          <text x="0" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#8B7355" letterSpacing="2">REPUBLIC OF KOREA</text>
          <text x="0" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#8B7355" letterSpacing="2">★ ★ ★</text>
        </g>
        {/* Top-right stamp */}
        <g opacity="0.05" transform="translate(1100,130)">
          <circle cx="0" cy="0" r="68" stroke="#8B7355" strokeWidth="2" fill="none" strokeDasharray="4 3" />
          <circle cx="0" cy="0" r="56" stroke="#8B7355" strokeWidth="1" fill="none" />
          <text x="0" y="-34" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" fill="#8B7355" letterSpacing="3">PASSPORT</text>
          <text x="0" y="4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="#8B7355" fontWeight="bold">LONDON</text>
          <text x="0" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#8B7355" letterSpacing="2">UNITED KINGDOM</text>
          <text x="0" y="38" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#8B7355" letterSpacing="2">★ ★ ★</text>
        </g>
        {/* Top-left small stamp */}
        <g opacity="0.04" transform="translate(80,110)">
          <circle cx="0" cy="0" r="48" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <text x="0" y="2" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#8B7355" fontWeight="bold">PARIS</text>
          <text x="0" y="16" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6.5" fill="#8B7355" letterSpacing="2">FRANCE</text>
        </g>
        {/* Bottom-right small stamp */}
        <g opacity="0.04" transform="translate(1090,680)">
          <circle cx="0" cy="0" r="50" stroke="#8B7355" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <text x="0" y="-4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#8B7355" fontWeight="bold">NEW YORK</text>
          <text x="0" y="12" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6.5" fill="#8B7355" letterSpacing="2">U.S.A.</text>
        </g>

        {/* ── City name watermarks — barely visible ── */}
        <g opacity="0.04" fontFamily="Georgia, serif" fill="#7A6A55" letterSpacing="3">
          <text x="320" y="680" fontSize="9">TOKYO</text>
          <text x="720" y="90" fontSize="9">AMSTERDAM</text>
          <text x="950" y="320" fontSize="9">SYDNEY</text>
          <text x="150" y="490" fontSize="9">TORONTO</text>
          <text x="850" y="650" fontSize="9">DUBAI</text>
          <text x="450" y="130" fontSize="9">ROME</text>
        </g>

        {/* ── Subtle vignette edges ── */}
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#F5F0E8" stopOpacity="0" />
            <stop offset="100%" stopColor="#E8E0D0" stopOpacity="0.45" />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#vignette)" />
      </svg>

      {/* ── Login card ── */}
      <div className="relative z-10 w-full px-4 py-8 flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  )
}
