import type { CoachingType, Delivery, Division, Federation, Focus } from "@/lib/taxonomy";

/**
 * ---------------------------------------------------------------------------
 * FICTIONAL DEMONSTRATION DATA — NOT REAL COACHES
 * ---------------------------------------------------------------------------
 * Every record below is invented for the purpose of demonstrating the directory
 * interface during prelaunch validation. The names, teams, biographies, handles
 * and websites are fabricated and are not intended to refer to any real person,
 * business or account.
 *
 * Rules this file follows, deliberately:
 *   - Every record has `isDemo: true` and a slug prefixed with `demo-`.
 *   - Social handles are prefixed `demo.` so they cannot resolve to a real
 *     account, and they are never rendered as outbound links.
 *   - No ratings, review counts, testimonials, client names, show placings or
 *     client outcomes appear anywhere. Bios describe *approach and services*
 *     only. A prelaunch site has no review data, so it displays none — and
 *     fabricating results would contradict the entire premise of the product.
 *   - Prices are illustrative bands, not offers.
 */

export interface DemoCoach {
  id: string;
  slug: string;
  name: string;
  team: string | null;
  /** Always true in this file. The column exists so real records can join later. */
  isDemo: true;
  headline: string;
  bio: string;
  divisions: Division[];
  federations: Federation[];
  coachingTypes: CoachingType[];
  specialties: string[];
  focus: Focus;
  delivery: Delivery;
  location: string;
  priceMin: number;
  priceMax: number;
  acceptingClients: boolean;
  claimed: boolean;
  /** Fictional handles, prefixed so they cannot collide with a real account. */
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  /** Initials used for the neutral placeholder avatar. */
  initials: string;
  yearsCoaching: number;
}

export const DEMO_COACHES: DemoCoach[] = [
  {
    id: "demo-01",
    slug: "demo-avery-stonebridge",
    name: "Avery Stonebridge",
    team: "Team Northline",
    isDemo: true,
    headline: "Open-division prep with a conservative, health-first dieting model.",
    bio: "A demonstration profile showing how an open-bodybuilding coach might describe their approach: long preps at moderate deficits, weekly check-ins with a written response, bloodwork requested before and after a prep, and explicit post-show reverse-dieting built into the contract rather than sold separately.",
    divisions: ["mens-bodybuilding", "classic-physique"],
    federations: ["npc", "ifbb-pro"],
    coachingTypes: ["contest-prep", "improvement-season", "peak-week", "post-show"],
    specialties: ["Long off-seasons", "Bloodwork-informed dieting", "Post-show recovery"],
    focus: "enhanced",
    delivery: "remote",
    location: "Ohio, USA",
    priceMin: 400,
    priceMax: 550,
    acceptingClients: true,
    claimed: true,
    instagram: "demo.averystonebridge",
    tiktok: null,
    website: "https://example.com/demo-northline",
    initials: "AS",
    yearsCoaching: 11,
  },
  {
    id: "demo-02",
    slug: "demo-priya-raman",
    name: "Priya Raman",
    team: "Raman Performance",
    isDemo: true,
    headline: "Bikini and wellness prep with posing included, not upsold.",
    bio: "A demonstration profile showing a bikini-focused practice: fortnightly posing video review included in the monthly fee, macro targets adjusted from weekly photo and weight trends rather than a fixed drop schedule, and a written policy on how quickly check-ins are answered.",
    divisions: ["bikini", "wellness"],
    federations: ["npc", "ifbb-pro"],
    coachingTypes: ["contest-prep", "posing", "nutrition", "peak-week"],
    specialties: ["Posing included", "First-time competitors", "Suit and package guidance"],
    focus: "both",
    delivery: "remote",
    location: "London, UK",
    priceMin: 250,
    priceMax: 350,
    acceptingClients: true,
    claimed: true,
    instagram: "demo.priyaraman.prep",
    tiktok: "demo.priyaraman",
    website: null,
    initials: "PR",
    yearsCoaching: 7,
  },
  {
    id: "demo-03",
    slug: "demo-marcus-delacroix",
    name: "Marcus Delacroix",
    team: null,
    isDemo: true,
    headline: "Drug-free men's physique coaching, testing-federation experience.",
    bio: "A demonstration profile for a natural-only practice: coaching limited to tested federations, a stated policy of declining clients who intend to use performance-enhancing drugs, and preparation support for drug-testing protocols and documentation.",
    divisions: ["mens-physique", "classic-physique"],
    federations: ["wnbf", "ocb", "inbf"],
    coachingTypes: ["contest-prep", "improvement-season", "training", "nutrition"],
    specialties: ["Tested federations", "Drug-free preparation", "Long-term progression"],
    focus: "natural",
    delivery: "remote",
    location: "Quebec, Canada",
    priceMin: 180,
    priceMax: 240,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.marcusdelacroix",
    tiktok: null,
    website: "https://example.com/demo-delacroix",
    initials: "MD",
    yearsCoaching: 9,
  },
  {
    id: "demo-04",
    slug: "demo-tanya-wexler",
    name: "Tanya Wexler",
    team: "Ironhall Collective",
    isDemo: true,
    headline: "Women's bodybuilding and physique, in-person and remote.",
    bio: "A demonstration profile for a coach working with the women's open divisions: in-person sessions at a single location plus remote coaching, a documented approach to training around long-term joint issues, and improvement-season work planned in twelve-month blocks.",
    divisions: ["womens-bodybuilding", "womens-physique"],
    federations: ["npc", "ifbb-pro", "other"],
    coachingTypes: ["contest-prep", "improvement-season", "training", "posing"],
    specialties: ["Women's open divisions", "In-person sessions", "Training around injury"],
    focus: "enhanced",
    delivery: "hybrid",
    location: "Texas, USA",
    priceMin: 450,
    priceMax: 700,
    acceptingClients: false,
    claimed: true,
    instagram: "demo.tanyawexler",
    tiktok: "demo.ironhall",
    website: null,
    initials: "TW",
    yearsCoaching: 15,
  },
  {
    id: "demo-05",
    slug: "demo-joon-park",
    name: "Joon Park",
    team: "Park Method",
    isDemo: true,
    headline: "Figure and fitness prep, heavy emphasis on stage presentation.",
    bio: "A demonstration profile emphasising presentation: routine construction for fitness, quarter-turn and mandatory-pose work for figure, and a written peak-week plan shared with the athlete two weeks out instead of day by day.",
    divisions: ["figure", "fitness"],
    federations: ["npc", "other"],
    coachingTypes: ["contest-prep", "posing", "peak-week"],
    specialties: ["Routine construction", "Presentation coaching", "Peak week transparency"],
    focus: "both",
    delivery: "remote",
    location: "Seoul, South Korea",
    priceMin: 300,
    priceMax: 420,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.joonpark.method",
    tiktok: "demo.parkmethod",
    website: "https://example.com/demo-parkmethod",
    initials: "JP",
    yearsCoaching: 6,
  },
  {
    id: "demo-06",
    slug: "demo-elena-moravec",
    name: "Elena Moravec",
    team: null,
    isDemo: true,
    headline: "Lifestyle and improvement-season coaching. No prep clients.",
    bio: "A demonstration profile for a coach who deliberately does not take prep clients: year-round lifestyle and improvement-season work, structured refeeding after previous preps, and an explicit referral-out policy when an athlete decides to compete.",
    divisions: ["bikini", "figure", "wellness"],
    federations: ["other"],
    coachingTypes: ["lifestyle", "improvement-season", "nutrition", "post-show"],
    specialties: ["No-prep practice", "Post-prep recovery", "Relationship with food"],
    focus: "natural",
    delivery: "remote",
    location: "Prague, Czechia",
    priceMin: 120,
    priceMax: 180,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.elenamoravec",
    tiktok: null,
    website: null,
    initials: "EM",
    yearsCoaching: 5,
  },
  {
    id: "demo-07",
    slug: "demo-desmond-whitfield",
    name: "Desmond Whitfield",
    team: "Whitfield Barbell",
    isDemo: true,
    headline: "Classic physique specialist working with a small roster.",
    bio: "A demonstration profile showing a capped-roster practice: a stated maximum number of athletes, a waitlist when full, video calls rather than written check-ins, and structure-focused programming for the classic physique lines.",
    divisions: ["classic-physique", "mens-bodybuilding"],
    federations: ["npc", "ifbb-pro"],
    coachingTypes: ["contest-prep", "improvement-season", "training"],
    specialties: ["Capped roster", "Video check-ins", "Structure-led programming"],
    focus: "enhanced",
    delivery: "remote",
    location: "Georgia, USA",
    priceMin: 600,
    priceMax: 850,
    acceptingClients: false,
    claimed: true,
    instagram: "demo.desmondwhitfield",
    tiktok: null,
    website: "https://example.com/demo-whitfield",
    initials: "DW",
    yearsCoaching: 13,
  },
  {
    id: "demo-08",
    slug: "demo-sofia-iglesias",
    name: "Sofía Iglesias",
    team: "Team Altavoz",
    isDemo: true,
    headline: "Wellness division prep, bilingual coaching.",
    bio: "A demonstration profile for wellness-division coaching delivered in Spanish and English, with programming written around the division's judging criteria and a documented approach to travelling for shows.",
    divisions: ["wellness", "bikini"],
    federations: ["ifbb-pro", "npc", "other"],
    coachingTypes: ["contest-prep", "training", "nutrition", "posing"],
    specialties: ["Wellness judging criteria", "Bilingual coaching", "Travel-week planning"],
    focus: "both",
    delivery: "remote",
    location: "Madrid, Spain",
    priceMin: 250,
    priceMax: 340,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.sofiaiglesias.coach",
    tiktok: "demo.altavoz",
    website: null,
    initials: "SI",
    yearsCoaching: 8,
  },
  {
    id: "demo-09",
    slug: "demo-rhys-calloway",
    name: "Rhys Calloway",
    team: null,
    isDemo: true,
    headline: "Budget-tier natural men's physique coaching for first preps.",
    bio: "A demonstration profile at the lower price tier: templated training blocks with individualised nutrition, check-ins answered within a stated window, and an openly published list of what is and is not included at the price.",
    divisions: ["mens-physique"],
    federations: ["ocb", "inbf", "other"],
    coachingTypes: ["contest-prep", "nutrition", "training"],
    specialties: ["First contest prep", "Transparent inclusions", "Budget tier"],
    focus: "natural",
    delivery: "remote",
    location: "Manchester, UK",
    priceMin: 95,
    priceMax: 140,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.rhyscalloway",
    tiktok: "demo.rhyscalloway",
    website: null,
    initials: "RC",
    yearsCoaching: 3,
  },
  {
    id: "demo-10",
    slug: "demo-amara-nwosu",
    name: "Amara Nwosu",
    team: "Nwosu Prep Group",
    isDemo: true,
    headline: "Multi-coach team covering the women's divisions, in person and remote.",
    bio: "A demonstration profile for a coaching team rather than an individual: athletes are matched to a coach within the team, the head coach reviews peak weeks, and the team publishes which coach holds which roster.",
    divisions: ["bikini", "figure", "wellness", "womens-physique"],
    federations: ["npc", "ifbb-pro", "ukbff"],
    coachingTypes: ["contest-prep", "posing", "improvement-season", "peak-week", "post-show"],
    specialties: ["Coaching team", "Head-coach peak week review", "In-person posing"],
    focus: "both",
    delivery: "hybrid",
    location: "Lagos, Nigeria & remote",
    priceMin: 300,
    priceMax: 500,
    acceptingClients: true,
    claimed: true,
    instagram: "demo.nwosuprepgroup",
    tiktok: "demo.nwosuprep",
    website: "https://example.com/demo-nwosu",
    initials: "AN",
    yearsCoaching: 10,
  },
  {
    id: "demo-11",
    slug: "demo-kai-lindqvist",
    name: "Kai Lindqvist",
    team: "Norrsken Strength",
    isDemo: true,
    headline: "Training-only coaching for athletes who handle their own nutrition.",
    bio: "A demonstration profile for a training-only service: no nutrition prescription, programming written for athletes who already work with a dietitian or self-manage, and a lower price reflecting the narrower scope.",
    divisions: ["mens-bodybuilding", "classic-physique", "womens-physique"],
    federations: ["other"],
    coachingTypes: ["training", "improvement-season"],
    specialties: ["Training only", "Works alongside a dietitian", "Narrow, stated scope"],
    focus: "both",
    delivery: "remote",
    location: "Stockholm, Sweden",
    priceMin: 130,
    priceMax: 190,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.kailindqvist",
    tiktok: null,
    website: null,
    initials: "KL",
    yearsCoaching: 4,
  },
  {
    id: "demo-12",
    slug: "demo-bianca-ferraro",
    name: "Bianca Ferraro",
    team: "Ferraro Stage Craft",
    isDemo: true,
    headline: "Posing-only coaching across every division, sold by the session.",
    bio: "A demonstration profile for a single-service practice: posing coaching sold per session rather than monthly, available to athletes who already have a prep coach, covering all divisions and both tested and untested federations.",
    divisions: [
      "bikini",
      "figure",
      "wellness",
      "womens-physique",
      "womens-bodybuilding",
      "mens-physique",
      "classic-physique",
      "mens-bodybuilding",
      "fitness",
    ],
    federations: ["npc", "ifbb-pro", "wnbf", "ocb", "cpa", "other"],
    coachingTypes: ["posing"],
    specialties: ["Posing only", "Per-session pricing", "Works with your prep coach"],
    focus: "both",
    delivery: "hybrid",
    location: "Milan, Italy",
    priceMin: 60,
    priceMax: 120,
    acceptingClients: true,
    claimed: false,
    instagram: "demo.biancaferraro",
    tiktok: "demo.ferrarostagecraft",
    website: "https://example.com/demo-ferraro",
    initials: "BF",
    yearsCoaching: 12,
  },
];

export const DEMO_COACHES_BY_SLUG = new Map(DEMO_COACHES.map((c) => [c.slug, c]));

export function getDemoCoach(slug: string): DemoCoach | undefined {
  return DEMO_COACHES_BY_SLUG.get(slug);
}

export function getDemoCoachById(id: string): DemoCoach | undefined {
  return DEMO_COACHES.find((c) => c.id === id);
}
