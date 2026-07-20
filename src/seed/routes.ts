import type { Route } from './types';

/**
 * ~40 curated Cascades + PNW routes across 8 outdoor areas.
 *
 * `mp_url` uses real Mountain Project URLs where the author was confident of
 * the route slug. Where uncertain, the URL falls back to an MP search query
 * that always resolves. Before shipping to production, run a link-check
 * pass and swap search URLs for canonical ones.
 */
const mp = (nameOrSlug: string, id?: string) =>
  id
    ? `https://www.mountainproject.com/route/${id}/${nameOrSlug}`
    : `https://www.mountainproject.com/search?q=${encodeURIComponent(nameOrSlug)}`;

export const SEED_ROUTES: Route[] = [
  // ── Index (Lower Town Wall + Country + Uppertown) ───────────────────────
  { id: 'rt_index_godzilla',       name: 'Godzilla',              area: 'Index',       grade: '5.9',    style: 'trad',        pitches: 1, mp_url: mp('godzilla', '105797119') },
  { id: 'rt_index_gns',             name: 'Great Northern Slab',   area: 'Index',       grade: '5.6',    style: 'trad',        pitches: 3, mp_url: mp('great-northern-slab', '105795710') },
  { id: 'rt_index_city_park',       name: 'City Park',             area: 'Index',       grade: '5.13d',  style: 'trad',        pitches: 1, mp_url: mp('city-park', '105798003') },
  { id: 'rt_index_sagittarius',     name: 'Sagittarius',           area: 'Index',       grade: '5.10a',  style: 'trad',        pitches: 1, mp_url: mp('sagittarius') },
  { id: 'rt_index_toxic_shock',     name: 'Toxic Shock',           area: 'Index',       grade: '5.11c',  style: 'trad',        pitches: 1, mp_url: mp('toxic-shock') },
  { id: 'rt_index_slow_children',   name: 'Slow Children',         area: 'Index',       grade: '5.10d',  style: 'trad',        pitches: 1, mp_url: mp('slow-children') },

  // ── Gold Bar (Reiter Pinnacles + Gold Bar Boulders) ─────────────────────
  { id: 'rt_gb_airborne',           name: 'Airborne Ranger',       area: 'Gold Bar',    grade: '5.11b',  style: 'sport',       pitches: 1, mp_url: mp('airborne-ranger') },
  { id: 'rt_gb_waterfall_wall',     name: 'Waterfall Wall Classic',area: 'Gold Bar',    grade: '5.10a',  style: 'sport',       pitches: 1, mp_url: mp('waterfall+wall+gold+bar') },
  { id: 'rt_gb_boulder_traverse',   name: 'Gold Bar Traverse',     area: 'Gold Bar',    grade: 'V4',     style: 'boulder',     pitches: 1, mp_url: mp('gold-bar-boulders') },
  { id: 'rt_gb_boulder_arete',      name: 'The Arete',             area: 'Gold Bar',    grade: 'V6',     style: 'boulder',     pitches: 1, mp_url: mp('gold+bar+arete') },

  // ── Leavenworth (Icicle + Peshastin + Castle Rock) ──────────────────────
  { id: 'rt_leav_diamonds_rust',    name: 'Diamonds and Rust',     area: 'Leavenworth', grade: '5.10b',  style: 'trad',        pitches: 1, mp_url: mp('diamonds-and-rust') },
  { id: 'rt_leav_canary',           name: 'Canary',                area: 'Leavenworth', grade: '5.8',    style: 'trad',        pitches: 1, mp_url: mp('canary') },
  { id: 'rt_leav_careno_crack',     name: 'Careno Crack',          area: 'Leavenworth', grade: '5.8+',   style: 'trad',        pitches: 1, mp_url: mp('careno-crack') },
  { id: 'rt_leav_rnd',              name: 'R&D',                   area: 'Leavenworth', grade: '5.9',    style: 'trad',        pitches: 1, mp_url: mp('rnd-peshastin') },
  { id: 'rt_leav_givlers_crack',    name: "Givler's Crack",        area: 'Leavenworth', grade: '5.8',    style: 'trad',        pitches: 1, mp_url: mp('givlers-crack') },
  { id: 'rt_leav_umm_yeah',         name: 'Umm Yeah',              area: 'Leavenworth', grade: '5.11a',  style: 'sport',       pitches: 1, mp_url: mp('umm+yeah+leavenworth') },
  { id: 'rt_leav_classic_crack',    name: 'Classic Crack',         area: 'Leavenworth', grade: '5.9',    style: 'trad',        pitches: 1, mp_url: mp('classic-crack-leavenworth') },

  // ── Vantage (Frenchman Coulee) ──────────────────────────────────────────
  { id: 'rt_vantage_sunshine',      name: 'Sunshine Wall Left',    area: 'Vantage',     grade: '5.8',    style: 'sport',       pitches: 1, mp_url: mp('sunshine-wall-left') },
  { id: 'rt_vantage_george_martha', name: 'George & Martha',       area: 'Vantage',     grade: '5.11b',  style: 'sport',       pitches: 1, mp_url: mp('george+martha+vantage') },
  { id: 'rt_vantage_techno',        name: 'Techno Warrior',        area: 'Vantage',     grade: '5.12a',  style: 'sport',       pitches: 1, mp_url: mp('techno-warrior') },
  { id: 'rt_vantage_party',         name: 'Party In My Mind',      area: 'Vantage',     grade: '5.10a',  style: 'sport',       pitches: 1, mp_url: mp('party-in-my-mind') },
  { id: 'rt_vantage_sinsemilla',    name: 'Sinsemilla',            area: 'Vantage',     grade: '5.10b',  style: 'sport',       pitches: 1, mp_url: mp('sinsemilla-vantage') },

  // ── Exit 38 (Deception Crags + Interstate Park) ─────────────────────────
  { id: 'rt_e38_air_guitar',        name: 'Air Guitar',            area: 'Exit 38',     grade: '5.10b',  style: 'sport',       pitches: 1, mp_url: mp('air-guitar-exit-38') },
  { id: 'rt_e38_skid_row',          name: 'Skid Row',              area: 'Exit 38',     grade: '5.10c',  style: 'sport',       pitches: 1, mp_url: mp('skid-row-exit-38') },
  { id: 'rt_e38_sisyphus',          name: 'Sisyphus',              area: 'Exit 38',     grade: '5.11a',  style: 'sport',       pitches: 1, mp_url: mp('sisyphus-exit-38') },
  { id: 'rt_e38_cave_route',        name: 'The Cave Route',        area: 'Exit 38',     grade: '5.10a',  style: 'sport',       pitches: 1, mp_url: mp('cave+route+exit+38') },

  // ── Little Si (Interstate Park + World's Fair) ──────────────────────────
  { id: 'rt_lsi_prisoners',         name: 'Prisoners of the Sun',  area: 'Little Si',   grade: '5.11b',  style: 'sport',       pitches: 1, mp_url: mp('prisoners-of-the-sun') },
  { id: 'rt_lsi_rainy_day_women',   name: 'Rainy Day Women',       area: 'Little Si',   grade: '5.10a',  style: 'sport',       pitches: 1, mp_url: mp('rainy-day-women-little-si') },
  { id: 'rt_lsi_aunt_jemima',       name: 'Aunt Jemima',           area: 'Little Si',   grade: '5.12a',  style: 'sport',       pitches: 1, mp_url: mp('aunt+jemima+little+si') },
  { id: 'rt_lsi_worlds_fair',       name: "World's Fair",          area: 'Little Si',   grade: '5.11a',  style: 'sport',       pitches: 1, mp_url: mp('worlds-fair-little-si') },

  // ── Squamish (BC road trip) ─────────────────────────────────────────────
  { id: 'rt_squamish_diedre',       name: 'Diedre',                area: 'Squamish',    grade: '5.8',    style: 'multi_pitch', pitches: 6, mp_url: mp('diedre-squamish') },
  { id: 'rt_squamish_angels_crest', name: "Angel's Crest",         area: 'Squamish',    grade: '5.10b',  style: 'multi_pitch', pitches: 13, mp_url: mp('angels-crest') },
  { id: 'rt_squamish_grand_wall',   name: 'The Grand Wall',        area: 'Squamish',    grade: '5.11a',  style: 'multi_pitch', pitches: 8, mp_url: mp('grand-wall-squamish') },
  { id: 'rt_squamish_split_pillar', name: 'Split Pillar',          area: 'Squamish',    grade: '5.10b',  style: 'trad',        pitches: 1, mp_url: mp('split-pillar') },
  { id: 'rt_squamish_butterfly',    name: 'Butterfly Crack',       area: 'Squamish',    grade: '5.11a',  style: 'trad',        pitches: 1, mp_url: mp('butterfly-crack-squamish') },

  // ── Smith Rock (OR road trip) ───────────────────────────────────────────
  { id: 'rt_smith_chain_reaction',  name: 'Chain Reaction',        area: 'Smith Rock',  grade: '5.12c',  style: 'sport',       pitches: 1, mp_url: mp('chain-reaction-smith') },
  { id: 'rt_smith_to_bolt',         name: 'To Bolt or Not To Be',  area: 'Smith Rock',  grade: '5.14a',  style: 'sport',       pitches: 1, mp_url: mp('to-bolt-or-not-to-be') },
  { id: 'rt_smith_wherever',        name: 'Wherever I May Roam',   area: 'Smith Rock',  grade: '5.9',    style: 'sport',       pitches: 1, mp_url: mp('wherever-i-may-roam-smith') },
  { id: 'rt_smith_round_river',     name: 'Round River',           area: 'Smith Rock',  grade: '5.10d',  style: 'sport',       pitches: 1, mp_url: mp('round-river-smith') },
  { id: 'rt_smith_moscow',          name: 'Moscow',                area: 'Smith Rock',  grade: '5.6',    style: 'trad',        pitches: 1, mp_url: mp('moscow-smith-rock') },
  { id: 'rt_smith_zebra_direct',    name: 'Zebra Direct',          area: 'Smith Rock',  grade: '5.11b',  style: 'sport',       pitches: 1, mp_url: mp('zebra-direct-smith') },
];

export const AREAS = Array.from(new Set(SEED_ROUTES.map((r) => r.area)));

export const ROUTE_BY_ID = Object.fromEntries(SEED_ROUTES.map((r) => [r.id, r] as const));
