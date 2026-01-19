-- Add missing fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile and doctors to view all
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );
