"use client";

export default function Logo() {
  return (
    <div className="inline-flex flex-col items-center">
      <svg
        viewBox="0 0 360 120"
        className="w-[320px] md:w-[400px] h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Clapboard top (hinged part with stripes) */}
        <g>
          {/* Board background */}
          <rect x="30" y="8" width="300" height="32" rx="3" fill="#2d1b0e" />
          {/* Diagonal stripes */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <polygon
              key={i}
              points={`${50 + i * 38},8 ${68 + i * 38},8 ${50 + i * 38},40 ${32 + i * 38},40`}
              fill={i % 2 === 0 ? "#c4922e" : "#2d1b0e"}
            />
          ))}
          {/* Clip the stripes to the board shape */}
          <rect x="0" y="0" width="30" height="45" fill="#faf6f0" />
          <rect x="330" y="0" width="30" height="45" fill="#faf6f0" />
          {/* Hinge circle */}
          <circle cx="44" cy="24" r="6" fill="#c4922e" stroke="#2d1b0e" strokeWidth="1.5" />
        </g>

        {/* Main board body */}
        <rect x="30" y="40" width="300" height="72" rx="4" fill="#2d1b0e" />

        {/* Inner area */}
        <rect x="38" y="46" width="284" height="58" rx="2" fill="#3d2b1e" />

        {/* Title text */}
        <text
          x="180"
          y="82"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="36"
          fill="#c4922e"
          letterSpacing="6"
        >
          CLAPBOARD
        </text>

        {/* Subtitle */}
        <text
          x="180"
          y="100"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="400"
          fontSize="10"
          fill="#7a6a55"
          letterSpacing="4"
        >
          DAILY MOVIE GUESSING GAME
        </text>

        {/* Film strip accents on sides */}
        {[0, 1, 2].map((i) => (
          <g key={`left-${i}`}>
            <rect
              x="6"
              y={48 + i * 22}
              width="16"
              height="14"
              rx="2"
              fill="none"
              stroke="#c4922e"
              strokeWidth="1.5"
            />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g key={`right-${i}`}>
            <rect
              x="338"
              y={48 + i * 22}
              width="16"
              height="14"
              rx="2"
              fill="none"
              stroke="#c4922e"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
