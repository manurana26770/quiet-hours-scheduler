-- =====================================================
-- Complete Database Setup for Quiet Hours Scheduler
-- =====================================================

-- 1. Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create quiet_blocks table
-- =====================================================
CREATE TABLE IF NOT EXISTS quiet_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    reminder_sent BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for better performance
-- =====================================================

-- Index for quiet_blocks user_id (for RLS and queries)
CREATE INDEX IF NOT EXISTS idx_quiet_blocks_user_id ON quiet_blocks(user_id);

-- Index for quiet_blocks start_time (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_quiet_blocks_start_time ON quiet_blocks(start_time);

-- Index for quiet_blocks is_active (for filtering active blocks)
CREATE INDEX IF NOT EXISTS idx_quiet_blocks_is_active ON quiet_blocks(is_active);

-- Index for quiet_blocks reminder_sent (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_quiet_blocks_reminder_sent ON quiet_blocks(reminder_sent);

-- Composite index for cron job queries (is_active, reminder_sent, start_time)
CREATE INDEX IF NOT EXISTS idx_quiet_blocks_cron_query ON quiet_blocks(is_active, reminder_sent, start_time);

-- Index for profiles email (for lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 4. Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quiet_blocks table
ALTER TABLE quiet_blocks ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (if any)
-- =====================================================

-- Drop existing policies on quiet_blocks
DROP POLICY IF EXISTS "Users can view their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can insert their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can update their own quiet blocks" ON quiet_blocks;
DROP POLICY IF EXISTS "Users can delete their own quiet blocks" ON quiet_blocks;

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 6. Create RLS Policies
-- =====================================================

-- Policies for quiet_blocks table
CREATE POLICY "Users can view their own quiet blocks" ON quiet_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiet blocks" ON quiet_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiet blocks" ON quiet_blocks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiet blocks" ON quiet_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7. Create functions for automatic timestamp updates
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for automatic timestamp updates
-- =====================================================

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for quiet_blocks table
DROP TRIGGER IF EXISTS update_quiet_blocks_updated_at ON quiet_blocks;
CREATE TRIGGER update_quiet_blocks_updated_at
    BEFORE UPDATE ON quiet_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to automatically create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for automatic profile creation
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Add constraints and validations
-- =====================================================

-- Ensure end_time is after start_time
ALTER TABLE quiet_blocks 
ADD CONSTRAINT check_end_after_start 
CHECK (end_time > start_time);

-- Ensure title is not empty
ALTER TABLE quiet_blocks 
ADD CONSTRAINT check_title_not_empty 
CHECK (length(trim(title)) > 0);

-- Ensure email is valid format (basic check)
ALTER TABLE profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 12. Grant necessary permissions
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select, insert, update, delete on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quiet_blocks TO authenticated;

-- 13. Create a view for active quiet blocks (optional)
-- =====================================================

CREATE OR REPLACE VIEW active_quiet_blocks AS
SELECT 
    qb.*,
    p.email,
    p.full_name
FROM quiet_blocks qb
JOIN profiles p ON qb.user_id = p.id
WHERE qb.is_active = true;

-- Grant access to the view
GRANT SELECT ON active_quiet_blocks TO authenticated;

-- 14. Add comments for documentation
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE quiet_blocks IS 'User study/quiet time blocks with email reminders';

COMMENT ON COLUMN quiet_blocks.user_id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN quiet_blocks.title IS 'Name/title of the study block';
COMMENT ON COLUMN quiet_blocks.start_time IS 'Start time in IST timezone';
COMMENT ON COLUMN quiet_blocks.end_time IS 'End time in IST timezone';
COMMENT ON COLUMN quiet_blocks.is_active IS 'Whether the block is currently active';
COMMENT ON COLUMN quiet_blocks.reminder_sent IS 'Whether email reminder has been sent';

-- =====================================================
-- Setup Complete!
-- =====================================================

-- To verify the setup, run these queries:
-- SELECT * FROM pg_policies WHERE tablename IN ('quiet_blocks', 'profiles');
-- SELECT * FROM information_schema.tables WHERE table_name IN ('quiet_blocks', 'profiles');
-- SELECT * FROM information_schema.indexes WHERE table_name IN ('quiet_blocks', 'profiles');
