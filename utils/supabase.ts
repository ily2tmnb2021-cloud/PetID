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
  // Extended fields
  likes?: string[];
  dislikes?: string[];
  fav_chew_toys?: string[];
  litter_count?: number;
  is_public?: boolean;
  map_latitude?: number;
  map_longitude?: number;
  diet_summary?: string;
  microchip_id?: string;
  registration_number?: string;
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

export interface HealthLog {
  id: string;
  pet_id: string;
  user_id: string;
  log_type: 'diet' | 'weight' | 'medication' | 'allergy' | 'pregnancy' | 'vet_note' | 'vaccination' | 'other';
  title: string;
  description?: string;
  value_numeric?: number;
  value_unit?: string;
  logged_at: string;
  created_at: string;
}

export interface Place {
  id: string;
  place_type: 'vet' | 'groomer' | 'dog_park' | 'pet_store' | 'dog_walk';
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
  rating?: number;
  photo_url?: string;
  amenities?: string[];
  created_at: string;
}

export interface BreederProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  location_city?: string;
  location_state?: string;
  latitude?: number;
  longitude?: number;
  specialties?: string[];
  years_experience?: number;
  is_verified?: boolean;
  avatar_url?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at?: string;
  created_at: string;
}
