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

export interface FeedbackResult {
  movieTitle: string;
  year: { color: FeedbackColor; direction: Direction; value: number };
  director: { color: FeedbackColor; value: string };
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
  answer?: Movie;
}
