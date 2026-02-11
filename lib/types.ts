export interface Movie {
  id: number;
  title: string;
  year: number;
  director: string;
  genres: string[];
  actors: string[];
  tagline: string;
  overview: string;
  posterPath: string;
  voteAverage: number;
  voteCount: number;
  oscarWins: number;
  watchProviders: Record<string, WatchProviderRegion>;
}

export interface WatchProviderRegion {
  link?: string;
  providers: WatchProvider[];
}

export interface WatchProvider {
  name: string;
  logoPath: string;
}

export type FeedbackColor = "green" | "yellow" | "red";
export type Direction = "higher" | "lower" | null;
export type SimilarityLabel = "Hot" | "Warm" | "Cold";

export interface DirectorProfile {
  name: string;
  genres: Set<string>;
  actors: Set<string>;
  regions: Set<string>;
  medianYear: number;
  movieCount: number;
}

export interface DirectorSimilarity {
  score: number;
  label: SimilarityLabel;
  reasons: string[];
}

export interface FeedbackResult {
  movieTitle: string;
  year: { color: FeedbackColor; direction: Direction; value: number };
  director: { color: FeedbackColor; value: string; similarity?: DirectorSimilarity };
  genres: { color: FeedbackColor; value: string[] };
  actors: { color: FeedbackColor; value: string[] };
  rating: { color: FeedbackColor; direction: Direction; value: number };
  oscars: { color: FeedbackColor; direction: Direction; value: number };
}

export interface GuessResponse {
  feedback: FeedbackResult;
  guessCount: number;
  solved: boolean;
  gameOver: boolean;
  lifelines: {
    tagline?: string;
    overview?: string;
  };
  answer?: Movie;
}

export interface DailyResponse {
  puzzleNumber: number;
  date: string;
  categories: string[];
}

export type HintType = "decade" | "firstLetter" | "posterCrop" | "oneActor" | "tagline";

export interface RevealedHints {
  decade?: string;
  firstLetter?: string;
  posterCrop?: string;
  oneActor?: string;
  tagline?: string;
}

export interface GameState {
  date: string;
  guesses: Array<{
    movie: string;
    feedback: FeedbackResult;
  }>;
  solved: boolean;
  gameOver: boolean;
  lifelines: {
    tagline?: string;
    overview?: string;
  };
  hints?: RevealedHints;
  answer?: Movie;
}
