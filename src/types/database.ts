
export interface Profile {
  id: string;
  username: string | null;
  theme: 'light' | 'dark';
  updated_at: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
    };
  };
}
