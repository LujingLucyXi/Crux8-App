import type { ReactNode } from 'react';

/**
 * The single shareable session card (one-card decision, 2026-10-14).
 * Fixed 1080x1920 layout with inline styles for export fidelity
 * (html-to-image captures this node directly).
 * Matches the approved mock: parchment / ink / Crux Gold.
 */
export interface CardCrewMember {
  id: string;
  name: string;
  photoUrl?: string;
  initials?: string;
  emoji?: string;
}

export interface CardChip {
  label: string;
  gold?: boolean;
}

export interface SessionCardData {
  number: number | null;
  dateLabel: string;
  headlineA: string;
  headlineB: string;
  photoUrl?: string;
  crew: CardCrewMember[];
  crewLine: string;
  crewSub?: string;
  chips: CardChip[];
  /** Optional session-specific rows (e.g. cards collected) below the chips. */
  extraRow?: ReactNode;
  gymLine: string;
  gymSub?: string;
}

const AV_BG = ['#1C2430', '#C9A24B', '#C49A6C', '#5a4632'];
const FONT: React.CSSProperties = {
  fontFamily:
    '"Helvetica Neue", -apple-system, BlinkMacSystemFont, Arial, sans-serif',
};

export function SessionCardArtwork({ data }: { data: SessionCardData }) {
  return (
    <div
      style={{
        ...FONT,
        width: 1080,
        height: 1920,
        background: '#F7F3EA',
        color: '#161616',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: '72px 72px 0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 10,
            }}
          >
            CRUX<span style={{ color: '#C9A24B' }}>8</span>
          </div>
          <div
            style={{
              border: '3px solid #C9A24B',
              color: '#8a6d1f',
              borderRadius: 999,
              padding: '10px 24px',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            SESSION #{data.number ?? '—'}
          </div>
        </div>

        <div style={{ marginTop: 44, alignSelf: 'flex-start' }}>
          <span
            style={{
              display: 'inline-block',
              background: '#161616',
              color: '#F7F3EA',
              borderRadius: 12,
              padding: '10px 22px',
              fontSize: 27,
              letterSpacing: 3,
              fontWeight: 600,
            }}
          >
            {data.dateLabel}
          </span>
        </div>

        <h1
          style={{
            marginTop: 30,
            marginBottom: 0,
            fontSize: 104,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          {data.headlineA}
          <br />
          <span style={{ color: '#C9A24B' }}>{data.headlineB}</span>
        </h1>

        {/* Photo slot: session photo wins, otherwise the branded panel */}
        <div
          style={{
            marginTop: 46,
            height: 700,
            borderRadius: 36,
            position: 'relative',
            overflow: 'hidden',
            background:
              'linear-gradient(155deg, #1C2430 0%, #3a3f4a 45%, #C49A6C 130%)',
          }}
        >
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              crossOrigin="anonymous"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <>
              <div
                style={{
                  position: 'absolute',
                  right: -90,
                  top: -90,
                  width: 420,
                  height: 420,
                  borderRadius: '50%',
                  border: '64px solid rgba(201,162,75,.5)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: -140,
                  bottom: -160,
                  width: 460,
                  height: 460,
                  borderRadius: '50%',
                  border: '54px solid rgba(247,243,234,.16)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 44,
                  bottom: 38,
                  color: '#F7F3EA',
                  fontSize: 27,
                  letterSpacing: 4,
                  fontWeight: 600,
                  opacity: 0.92,
                }}
              >
                YOUR SESSION PHOTO LANDS HERE
              </div>
            </>
          )}
        </div>

        {/* Crew */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <div style={{ display: 'flex' }}>
            {data.crew.slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                title={m.name}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  border: '5px solid #F7F3EA',
                  marginLeft: i === 0 ? 0 : -20,
                  zIndex: 10 - i,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  fontWeight: 800,
                  color: '#F7F3EA',
                  background: AV_BG[i % AV_BG.length],
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    crossOrigin="anonymous"
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  m.emoji ?? m.initials ?? '·'
                )}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>
              {data.crewLine}
            </div>
            {data.crewSub && (
              <div
                style={{ fontSize: 27, fontWeight: 500, color: '#6d675a' }}
              >
                {data.crewSub}
              </div>
            )}
          </div>
        </div>

        {/* Chips — only for fields the user actually filled */}
        {data.chips.length > 0 && (
          <div
            style={{
              marginTop: 44,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {data.chips.map((c) => (
              <span
                key={c.label}
                style={{
                  border: '2.5px solid #161616',
                  borderRadius: 999,
                  padding: '13px 26px',
                  fontSize: 27,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  ...(c.gold
                    ? { background: '#C9A24B', borderColor: '#C9A24B' }
                    : {}),
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}

        {data.extraRow && <div style={{ marginTop: 36 }}>{data.extraRow}</div>}

        <div style={{ flex: 1 }} />

        {/* Gym strip */}
        <div
          style={{
            margin: '0 -72px',
            background: '#161616',
            color: '#F7F3EA',
            padding: '40px 72px 54px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{ fontSize: 33, fontWeight: 800, letterSpacing: 1, lineHeight: 1.3 }}
          >
            {data.gymLine}
            {data.gymSub && (
              <span
                style={{
                  display: 'block',
                  fontSize: 25,
                  fontWeight: 500,
                  color: '#b7ad97',
                  letterSpacing: 2,
                }}
              >
                {data.gymSub}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 29,
              fontWeight: 700,
              color: '#C9A24B',
              letterSpacing: 1,
            }}
          >
            crux8.app
          </div>
        </div>
      </div>
    </div>
  );
}
