import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://sycswusdpxhwfoibornt.supabase.co';
// Anon key for project sycswusdpxhwfoibornt
// Get from: Supabase Dashboard > Project Settings > API > Project API keys > anon public
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5Y3N3dXNkcHhod2ZvaWJvcm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTY3ODEsImV4cCI6MjEwMzk3Mjc4MX0.xRUVq5a8D4oSLP2_s5qqcHX5Y-BsF-aXbV-Ct6xPHzs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Data types
export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age_years?: number;
  weight_kg?: number;
  gender?: 'male' | 'female' | 'unknown';
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export interface VetAppointment {
  id: string;
  pet_id: string;
  user_id: string;
  title: string;
  vet_name?: string;
  clinic_name?: string;
  appointment_date: string;
  notes?: string;
  is_completed: boolean;
  created_at: string;
  pet?: Pet;
}

export interface AnxietyTip {
  id: string;
  title: string;
  description: string;
  category: 'calming' | 'training' | 'environment' | 'exercise' | 'diet' | 'medical';
  species: 'dog' | 'cat' | 'all';
  difficulty: 'easy' | 'medium' | 'hard';
  duration_minutes?: number;
  icon_name?: string;
}

export interface DogPark {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  latitude: number;
  longitude: number;
  description?: string;
  amenities?: string[];
  is_off_leash: boolean;
  rating: number;
  photo_url?: string;
}

export interface BreedIdentification {
  id: string;
  user_id?: string;
  pet_id?: string;
  image_url: string;
  result_breed: string;
  result_confidence: number;
  result_description: string;
  result_traits: string[];
  result_raw?: unknown;
  created_at: string;
}
