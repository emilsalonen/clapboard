import { describe, it, expect, beforeAll } from "vitest";
import type { Movie, DirectorProfile } from "@/lib/types";
import {
  getDirectorProfile,
  computeDirectorSimilarity,
  computeBreakdown,
  buildProfileIndexFromMovies,
} from "@/lib/director-similarity";

// ─── Profile building ─────────────────────────────────────────────────

describe("getDirectorProfile", () => {
  it("returns a profile for a known director (Christopher Nolan)", () => {
    const p = getDirectorProfile("Christopher Nolan");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Christopher Nolan");
    expect(p!.genres.size).toBeGreaterThan(0);
    expect(p!.actors.size).toBeGreaterThan(0);
    expect(p!.movieCount).toBeGreaterThanOrEqual(1);
  });

  it("returns undefined for an unknown director", () => {
    expect(getDirectorProfile("zzz_nonexistent_director_zzz")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    const a = getDirectorProfile("christopher nolan");
    const b = getDirectorProfile("CHRISTOPHER NOLAN");
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.name).toBe(b!.name);
  });

  it("aggregates genres and actors across multiple movies", () => {
    const p = getDirectorProfile("Christopher Nolan");
    if (p && p.movieCount > 1) {
      // Nolan should have a rich set of genres/actors across his filmography
      expect(p.genres.size).toBeGreaterThan(1);
      expect(p.actors.size).toBeGreaterThan(3);
    }
  });
});

// ─── buildProfileIndexFromMovies (unit test with synthetic data) ──────

describe("buildProfileIndexFromMovies", () => {
  const fakeMovies: Movie[] = [
    {
      id: 1, title: "A", year: 2000, director: "Dir One",
      genres: ["Action", "Drama"], actors: ["Alice", "Bob"],
      tagline: "", overview: "", posterPath: "", voteAverage: 7, oscarWins: 0,
      watchProviders: { US: { providers: [] }, GB: { providers: [] } },
    },
    {
      id: 2, title: "B", year: 2010, director: "Dir One",
      genres: ["Drama", "Thriller"], actors: ["Bob", "Carol"],
      tagline: "", overview: "", posterPath: "", voteAverage: 8, oscarWins: 1,
      watchProviders: { US: { providers: [] }, FR: { providers: [] } },
    },
    {
      id: 3, title: "C", year: 2020, director: "Dir Two",
      genres: ["Comedy"], actors: ["Dave"],
      tagline: "", overview: "", posterPath: "", voteAverage: 6, oscarWins: 0,
      watchProviders: { JP: { providers: [] } },
    },
  ];

  it("aggregates genres across movies for same director", () => {
    const idx = buildProfileIndexFromMovies(fakeMovies);
    const p = idx.get("dir one")!;
    expect(p.genres).toEqual(new Set(["action", "drama", "thriller"]));
  });

  it("aggregates actors across movies for same director", () => {
    const idx = buildProfileIndexFromMovies(fakeMovies);
    const p = idx.get("dir one")!;
    expect(p.actors).toEqual(new Set(["Alice", "Bob", "Carol"]));
  });

  it("aggregates regions across movies for same director", () => {
    const idx = buildProfileIndexFromMovies(fakeMovies);
    const p = idx.get("dir one")!;
    expect(p.regions).toEqual(new Set(["US", "GB", "FR"]));
  });

  it("calculates median year correctly", () => {
    const idx = buildProfileIndexFromMovies(fakeMovies);
    // Dir One: years [2000, 2010], median = 2005
    expect(idx.get("dir one")!.medianYear).toBe(2005);
    // Dir Two: years [2020], median = 2020
    expect(idx.get("dir two")!.medianYear).toBe(2020);
  });
});

// ─── Scoring tests ────────────────────────────────────────────────────

describe("computeDirectorSimilarity", () => {
  it("returns null for the same director", () => {
    expect(computeDirectorSimilarity("Christopher Nolan", "Christopher Nolan")).toBeNull();
    expect(computeDirectorSimilarity("christopher nolan", "CHRISTOPHER NOLAN")).toBeNull();
  });

  it("returns Cold for unknown directors", () => {
    const result = computeDirectorSimilarity("zzz_unknown", "yyy_unknown");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Cold");
    expect(result!.score).toBe(0);
  });

  it("score is always between 0 and 1", () => {
    const pairs = [
      ["Christopher Nolan", "Denis Villeneuve"],
      ["Steven Spielberg", "Martin Scorsese"],
      ["Hayao Miyazaki", "Akira Kurosawa"],
      ["Quentin Tarantino", "Wes Anderson"],
    ];
    for (const [a, b] of pairs) {
      const result = computeDirectorSimilarity(a, b);
      if (result) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    }
  });

  it("Nolan vs Villeneuve should be Hot or Warm (sci-fi overlap)", () => {
    const result = computeDirectorSimilarity("Christopher Nolan", "Denis Villeneuve");
    if (result) {
      expect(["Hot", "Warm"]).toContain(result.label);
      expect(result.score).toBeGreaterThanOrEqual(0.25);
    }
  });

  it("similar directors score higher than dissimilar ones", () => {
    const nolanVilleneuve = computeDirectorSimilarity("Christopher Nolan", "Denis Villeneuve");
    const nolanMiyazaki = computeDirectorSimilarity("Christopher Nolan", "Hayao Miyazaki");

    if (nolanVilleneuve && nolanMiyazaki) {
      expect(nolanVilleneuve.score).toBeGreaterThan(nolanMiyazaki.score);
    }
  });
});

// ─── Reason tests ─────────────────────────────────────────────────────

describe("reason generation", () => {
  it("returns at most 2 reasons", () => {
    const pairs = [
      ["Christopher Nolan", "Denis Villeneuve"],
      ["Steven Spielberg", "Martin Scorsese"],
      ["Quentin Tarantino", "Robert Rodriguez"],
    ];
    for (const [a, b] of pairs) {
      const result = computeDirectorSimilarity(a, b);
      if (result) {
        expect(result.reasons.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("genre reasons mention shared genres when they exist", () => {
    const result = computeDirectorSimilarity("Christopher Nolan", "Denis Villeneuve");
    if (result && result.reasons.length > 0) {
      // At least one reason should exist; genres are likely the top factor
      const hasGenreReason = result.reasons.some((r) => r.startsWith("Both direct"));
      const hasActorReason = result.reasons.some((r) => r.startsWith("Share"));
      expect(hasGenreReason || hasActorReason).toBe(true);
    }
  });
});

// ─── computeBreakdown unit tests ──────────────────────────────────────

describe("computeBreakdown", () => {
  it("returns perfect scores for identical profiles", () => {
    const p: DirectorProfile = {
      name: "Test",
      genres: new Set(["action", "drama"]),
      actors: new Set(["Alice", "Bob"]),
      regions: new Set(["US", "GB"]),
      medianYear: 2000,
      movieCount: 2,
    };
    const bd = computeBreakdown(p, p);
    expect(bd.genreScore).toBe(1);
    expect(bd.actorScore).toBe(1);
    expect(bd.regionScore).toBe(1);
    expect(bd.decadeScore).toBe(1);
  });

  it("returns zero for completely disjoint profiles", () => {
    const a: DirectorProfile = {
      name: "A",
      genres: new Set(["action"]),
      actors: new Set(["Alice"]),
      regions: new Set(["US"]),
      medianYear: 1970,
      movieCount: 1,
    };
    const b: DirectorProfile = {
      name: "B",
      genres: new Set(["comedy"]),
      actors: new Set(["Bob"]),
      regions: new Set(["JP"]),
      medianYear: 2020,
      movieCount: 1,
    };
    const bd = computeBreakdown(a, b);
    expect(bd.genreScore).toBe(0);
    expect(bd.actorScore).toBe(0);
    expect(bd.regionScore).toBe(0);
    // 50 years apart / 30 = 1.67, clamped to 1, so decadeScore = 0
    expect(bd.decadeScore).toBe(0);
    expect(bd.sharedGenres).toEqual([]);
    expect(bd.sharedActors).toEqual([]);
  });

  it("tracks shared genres and actors correctly", () => {
    const a: DirectorProfile = {
      name: "A",
      genres: new Set(["action", "drama", "sci-fi"]),
      actors: new Set(["Alice", "Bob", "Carol"]),
      regions: new Set(["US"]),
      medianYear: 2010,
      movieCount: 2,
    };
    const b: DirectorProfile = {
      name: "B",
      genres: new Set(["drama", "thriller"]),
      actors: new Set(["Bob", "Dave"]),
      regions: new Set(["US", "GB"]),
      medianYear: 2015,
      movieCount: 1,
    };
    const bd = computeBreakdown(a, b);
    expect(bd.sharedGenres).toContain("drama");
    expect(bd.sharedActors).toContain("Bob");
    expect(bd.genreScore).toBeCloseTo(1 / 4); // 1 shared / (3+2-1)
    expect(bd.decadeScore).toBeCloseTo(1 - 5 / 30);
  });
});
