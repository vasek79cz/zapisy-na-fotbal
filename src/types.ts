export interface Player {
  id: string;
  name: string;
  signedUpAt: string; // ISO string timestamp
  isConfirmed: boolean;
  team?: 'A' | 'B'; // Manual team assignment ('A' for Claro, 'B' for Oscuro)
}

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  maxPlayers: number; // 10 for 5v5, 12 for 6v6
  players: Player[]; // Flat list of all signed up players. First maxPlayers are main lineup, rest are reserves (náhradníci).
  isCompleted: boolean;
  isCanceled?: boolean;
  cancellationReason?: string;
  createdAt: string;
  title?: string;       // Optional custom title (e.g., "Barceloneta Futbol")
  subtitle?: string;    // Optional custom subtitle/comment (e.g., "3 EUR platba")
  avatarUrl?: string;   // Optional custom avatar image (Base64 or URL)
}

export interface SoccerAppState {
  currentMatch: Match | null;
  history: Match[];
}
