import type { SessionCardData, GymMotif } from '@/lib/cardData';
import { Avatar } from '@/components/ui/Avatar';

/**
 * The single shareable session card (one-card decision, 2026-10-14).
 * Artwork v20 — expedition postmark (2026-10-15, Lucy-approved mock).
 * Fixed 1080x1920 layout with inline styles for export fidelity
 * (html-to-image captures this node directly).
 *
 * Generated PER USER from that user's own recap:
 *   crew = session participants (owner first, "+N more" when capped)
 *   chips + field note = the card owner's recap only.
 * Never prints: grades, levels, sends, photos, session numbers.
 */

const INK = '#2B2118';
const GOLD = '#A87C24';
const GOLD_DARK = '#96700F';
const SEAL = '#BE3A26';
const PAPER = '#F8ECD0';
const MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';
const HEAD = 'Archivo, "Helvetica Neue", Arial, sans-serif';

function MotifGlyph({ motif }: { motif: GymMotif }) {
  if (motif === 'boulder') {
    // an irregular rounded rock seen from the front — lumpy silhouette, no perfect arcs
    return (
      <g>
        <path
          d="M121 37
             C131 37 137 42 140 49
             C143 56 141 64 136 69
             C130 75 120 76 113 73
             C105 70 100 64 99 57
             C98 50 101 43 107 40
             C111 37 116 37 121 37 Z"
          fill="none"
          stroke={SEAL}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="127" cy="50" r="5" fill={SEAL} stroke="none" />
        <circle cx="109" cy="65" r="3.5" fill={SEAL} stroke="none" />
      </g>
    );
  }
  if (motif === 'peak') {
    return (
      <path
        d="M94 68 L113 45 L126 60 L135 51 L148 68 Z"
        fill="none"
        stroke={SEAL}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }
  // generic star (fallback)
  return (
    <path
      d="M121 40 L125 52 L137 56 L125 60 L121 72 L117 60 L105 56 L117 52 Z"
      fill="none"
      stroke={SEAL}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  );
}

export function SessionCardArtwork({ data }: { data: SessionCardData }) {
  const compact = data.crew.length > 3;
  const avSize = compact ? 96 : 118;
  const emblemSize = compact ? 104 : 128;
  const stampWidth = compact ? 600 : 660;
  const holes = Array.from({ length: 32 }, (_, i) => 14 + i * 30);

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: INK,
        background:
          'radial-gradient(120% 90% at 50% 30%, #F8ECD0 0%, #F3E2B2 55%, #EBD49E 100%)',
      }}
    >
      {/* paper grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.55,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.72 0 0 0 0 0.60 0 0 0 0 0.38 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* warm stains */}
      <div
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          right: -120,
          top: 560,
          borderRadius: '50%',
          filter: 'blur(30px)',
          background: 'rgba(190,150,80,.16)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          left: -100,
          bottom: 180,
          borderRadius: '50%',
          filter: 'blur(30px)',
          background: 'rgba(190,150,80,.16)',
        }}
      />

      <div style={{ padding: '58px 62px 0', position: 'relative' }}>
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: HEAD,
                fontWeight: 900,
                fontSize: 36,
                letterSpacing: '.34em',
              }}
            >
              CRUX<span style={{ color: GOLD }}>8</span>
            </div>
            <div
              style={{
                marginTop: 9,
                fontFamily: MONO,
                fontSize: 19,
                letterSpacing: '.30em',
                color: 'rgba(43,33,24,.55)',
              }}
            >
              SESSION LOG
            </div>
          </div>
          <img
            src="/brand/crux8-sign-gold.png"
            alt=""
            style={{ height: 104, marginTop: 2 }}
          />
        </div>

        {/* kicker */}
        <div
          style={{
            marginTop: 66,
            fontFamily: MONO,
            fontSize: 23,
            letterSpacing: '.24em',
            color: GOLD,
          }}
        >
          {data.kicker}
        </div>
        {data.coordLine && (
          <div
            style={{
              marginTop: 8,
              fontFamily: MONO,
              fontSize: 19,
              letterSpacing: '.22em',
              color: 'rgba(43,33,24,.5)',
            }}
          >
            {data.coordLine}
          </div>
        )}

        {/* headline = the session's own name, omitted when unnamed */}
        {data.headline && (
          <h1
            style={{
              margin: '14px 0 0',
              fontFamily: HEAD,
              fontSize: 104,
              lineHeight: 0.98,
              fontWeight: 900,
              letterSpacing: '-0.01em',
            }}
          >
            {data.headline.head}
            {data.headline.goldTail ? (
              <>
                {' '}
                <span style={{ color: GOLD }}>{data.headline.goldTail}</span>
              </>
            ) : null}
          </h1>
        )}

        {/* crew */}
        <div
          style={{
            marginTop: 62,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: MONO,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '.26em',
          }}
        >
          WHO WAS ON THE WALL?
          <div style={{ flex: 1, height: 2, background: GOLD }} />
        </div>

        <div style={{ marginTop: 12, position: 'relative' }}>
          {/* dashed route threading the avatars */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 6.2 14 L 6.2 86"
              fill="none"
              stroke={GOLD}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 12"
              strokeLinecap="round"
              opacity={0.75}
            />
          </svg>

          {data.crew.map((m) => (
            <div
              key={m.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: `${compact ? 18 : 25}px 0`,
                borderBottom: '1.5px dashed rgba(43,33,24,.22)',
              }}
            >
              <div
                style={{
                  width: avSize,
                  height: avSize,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `3.5px solid ${GOLD}`,
                  background: '#fff',
                }}
              >
                <Avatar
                  photoUrl={m.photoUrl ?? undefined}
                  config={m.avatarConfig}
                  seed={m.id}
                  alt={m.name}
                  size={avSize}
                  fallback={m.name}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: HEAD,
                    fontSize: compact ? 34 : 39,
                    fontWeight: 800,
                  }}
                >
                  {m.name}
                  {m.isOwner && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: 14,
                        verticalAlign: 'middle',
                        fontFamily: MONO,
                        fontSize: 18,
                        letterSpacing: '.16em',
                        color: PAPER,
                        background: INK,
                        padding: '6px 14px',
                        borderRadius: 999,
                      }}
                    >
                      YOU
                    </span>
                  )}
                </div>
                {m.archetypeLabel && (
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: HEAD,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '.20em',
                      color: GOLD_DARK,
                    }}
                  >
                    {m.archetypeLabel}
                  </div>
                )}
              </div>
              {m.archetypeId && (
                <img
                  src={`/emblems/${m.archetypeId}.webp`}
                  alt=""
                  style={{
                    width: emblemSize,
                    height: emblemSize,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(43,33,24,.30)',
                  }}
                />
              )}
            </div>
          ))}
          {data.crewOverflow ? (
            <div
              style={{
                marginTop: 10,
                fontFamily: MONO,
                fontSize: 20,
                letterSpacing: '.22em',
                color: 'rgba(43,33,24,.55)',
              }}
            >
              +{data.crewOverflow} MORE ON THE WALL
            </div>
          ) : null}
        </div>

        {/* chips — owner's recap fields only, rendered when filled */}
        {data.chips.length > 0 && (
          <div
            style={{
              marginTop: compact ? 36 : 46,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {data.chips.map((c) => (
              <span
                key={c.kind}
                style={{
                  border: `2.5px solid ${INK}`,
                  borderRadius: 999,
                  padding: '16px 29px',
                  fontFamily: HEAD,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '.05em',
                  color: c.kind === 'vibe' ? PAPER : INK,
                  background:
                    c.kind === 'duration'
                      ? '#C9A24B'
                      : c.kind === 'felt'
                        ? 'rgba(255,252,240,.65)'
                        : INK,
                }}
              >
                {c.kind === 'duration' ? '⏱ ' : c.kind === 'felt' ? '✨ ' : ''}
                {c.text}
              </span>
            ))}
          </div>
        )}

        {/* field note — the owner's own line, straight, never rotated */}
        {data.fieldNote && (
          <div
            style={{
              marginTop: 22,
              fontFamily: 'Caveat, cursive',
              fontSize: 41,
              color: '#4A3826',
            }}
          >
            {data.fieldNote}
          </div>
        )}

        {/* the SENT stamp — gym-issued visa-page seal */}
        <div
          style={{
            position: 'relative',
            marginTop: 40,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox="0 0 720 284"
            style={{
              width: stampWidth,
              transform: 'rotate(-2deg)',
              opacity: 0.94,
              mixBlendMode: 'multiply',
            }}
          >
            <defs>
              <pattern
                id="guilloche"
                width="36"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 7 Q9 0 18 7 T36 7"
                  fill="none"
                  stroke={SEAL}
                  strokeWidth="1.6"
                />
              </pattern>
              <clipPath id="stampClip">
                <rect x="16" y="16" width="688" height="252" rx="16" />
              </clipPath>
            </defs>
            <rect
              x="6"
              y="6"
              width="708"
              height="272"
              rx="20"
              fill="none"
              stroke={SEAL}
              strokeWidth="7"
            />
            <rect
              x="22"
              y="22"
              width="676"
              height="240"
              rx="12"
              fill="none"
              stroke={SEAL}
              strokeWidth="2"
            />
            <g clipPath="url(#stampClip)" opacity="0.16">
              <rect x="22" y="104" width="676" height="72" fill="url(#guilloche)" />
            </g>
            <image
              href="/brand/crux8-sign-red.png"
              x="296"
              y="58"
              width="128"
              height="224"
              opacity="0.13"
            />
            <MotifGlyph motif={data.stamp.motif} />
            <text
              x="150"
              y="66"
              fontFamily={MONO}
              fontSize="24"
              letterSpacing="6"
              fill={SEAL}
            >
              {data.stamp.issuer}
            </text>
            <line x1="52" y1="86" x2="668" y2="86" stroke={SEAL} strokeWidth="2" />
            <line x1="52" y1="91" x2="668" y2="91" stroke={SEAL} strokeWidth="1" />
            <text
              x="360"
              y="168"
              textAnchor="middle"
              fontFamily={HEAD}
              fontWeight="900"
              fontSize="82"
              letterSpacing="18"
              fill={SEAL}
            >
              SENT
            </text>
            <rect
              x="228"
              y="188"
              width="264"
              height="42"
              fill="none"
              stroke={SEAL}
              strokeWidth="2.5"
            />
            <text
              x="360"
              y="218"
              textAnchor="middle"
              fontFamily={MONO}
              fontWeight="600"
              fontSize="25"
              letterSpacing="5"
              fill={SEAL}
            >
              {data.stamp.dateBox}
            </text>
            <text
              x="360"
              y="254"
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="16"
              letterSpacing="3.5"
              fill={SEAL}
            >
              {data.stamp.cachet}
            </text>
          </svg>
          {/* round date postmark overlapping the stamp's corner */}
          <svg
            viewBox="0 0 172 172"
            style={{
              position: 'absolute',
              right: 8,
              top: -52,
              width: 172,
              height: 172,
              transform: 'rotate(8deg)',
              mixBlendMode: 'multiply',
              opacity: 0.94,
            }}
          >
            <circle cx="86" cy="86" r="80" fill="none" stroke={SEAL} strokeWidth="5" />
            <circle cx="86" cy="86" r="64" fill="none" stroke={SEAL} strokeWidth="2" />
            <text
              x="86"
              y="76"
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="21"
              letterSpacing="4"
              fill={SEAL}
            >
              {data.stamp.mon}
            </text>
            <text
              x="86"
              y="112"
              textAnchor="middle"
              fontFamily={HEAD}
              fontWeight="900"
              fontSize="38"
              fill={SEAL}
            >
              {data.stamp.day}
            </text>
            <text
              x="86"
              y="136"
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="17"
              letterSpacing="3"
              fill={SEAL}
            >
              {data.stamp.year}
            </text>
          </svg>
        </div>

        {/* punched tear line */}
        <svg
          viewBox="0 0 956 18"
          style={{ width: '100%', height: 18, marginTop: 34, display: 'block' }}
        >
          {holes.map((x) => (
            <g key={x}>
              <circle cx={x} cy={10} r={7} fill="rgba(255,248,224,.9)" />
              <circle cx={x} cy={7.5} r={7} fill="rgba(74,56,32,.52)" />
            </g>
          ))}
        </svg>

        {/* stub */}
        {data.inviteCode && (
          <div
            style={{
              marginTop: 18,
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 21,
              letterSpacing: '.16em',
              color: INK,
            }}
          >
            ADD ME · CODE{' '}
            <b style={{ color: GOLD_DARK, fontSize: 25 }}>{data.inviteCode}</b>
          </div>
        )}
        <div
          style={{
            marginTop: 26,
            paddingBottom: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              color: GOLD_DARK,
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: 26,
              letterSpacing: '.30em',
            }}
          >
            CRUX8.APP
          </div>
          <div
            style={{
              color: 'rgba(43,33,24,.55)',
              fontFamily: MONO,
              fontSize: 19,
              letterSpacing: '.22em',
            }}
          >
            SMALL CREWS · REAL PEOPLE
          </div>
        </div>
      </div>
    </div>
  );
}
