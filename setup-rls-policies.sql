-- Enable RLS on quiet_blocks table
ALTER TABLE quiet_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can insert their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can update their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can delete their own quiet blocks" ON quiet_blocks;

-- Create RLS policies for quiet_blocks table

-- Policy for SELECT: Users can view their own quiet blocks
CREATE POLICY "Users can view their own quiet blocks" ON quiet_blocks
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert their own quiet blocks
CREATE POLICY "Users can insert their own quiet blocks" ON quiet_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own quiet blocks
CREATE POLICY "Users can update their own quiet blocks" ON quiet_blocks
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own quiet blocks
CREATE POLICY "Users can delete their own quiet blocks" ON quiet_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create RLS policies for profiles table

-- Policy for SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy for INSERT: Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
