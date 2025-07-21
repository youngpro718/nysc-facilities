-- Create user_settings table for storing comprehensive user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    desktop_notifications BOOLEAN DEFAULT true,
    notification_sound BOOLEAN DEFAULT true,
    notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Notification Categories
    notify_key_requests BOOLEAN DEFAULT true,
    notify_supply_requests BOOLEAN DEFAULT true,
    notify_maintenance_alerts BOOLEAN DEFAULT true,
    notify_system_updates BOOLEAN DEFAULT false,
    notify_security_alerts BOOLEAN DEFAULT true,
    
    -- Privacy Settings
    profile_visibility TEXT DEFAULT 'contacts_only' CHECK (profile_visibility IN ('public', 'private', 'contacts_only')),
    show_online_status BOOLEAN DEFAULT true,
    allow_contact_requests BOOLEAN DEFAULT true,
    data_sharing_analytics BOOLEAN DEFAULT false,
    data_sharing_marketing BOOLEAN DEFAULT false,
    
    -- Appearance Settings
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    color_scheme TEXT DEFAULT 'blue' CHECK (color_scheme IN ('blue', 'green', 'purple', 'orange', 'red')),
    compact_mode BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    font_size INTEGER DEFAULT 14 CHECK (font_size >= 12 AND font_size <= 20),
    animations_enabled BOOLEAN DEFAULT true,
    
    -- Language & Region
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr')),
    timezone TEXT DEFAULT 'America/New_York',
    date_format TEXT DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
    time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30 CHECK (session_timeout > 0),
    login_notifications BOOLEAN DEFAULT true,
    device_tracking BOOLEAN DEFAULT true,
    
    -- Accessibility Settings
    screen_reader_support BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT false,
    motion_reduced BOOLEAN DEFAULT false,
    text_to_speech BOOLEAN DEFAULT false,
    
    -- Workflow Settings
    default_dashboard TEXT DEFAULT 'overview' CHECK (default_dashboard IN ('overview', 'requests', 'issues', 'calendar')),
    items_per_page INTEGER DEFAULT 25 CHECK (items_per_page IN (10, 25, 50, 100)),
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 30 CHECK (refresh_interval >= 10 AND refresh_interval <= 300),
    keyboard_shortcuts BOOLEAN DEFAULT true,
    sidebar_collapsed BOOLEAN DEFAULT false,
    
    -- Additional JSON settings for extensibility
    custom_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id (one settings record per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at_trigger
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Create user_preferences table for more complex preference structures
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- JSON columns for complex preference structures
    notifications JSONB DEFAULT '{}',
    display JSONB DEFAULT '{}',
    privacy JSONB DEFAULT '{}',
    workflow JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for user_preferences updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at_trigger
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create function to get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS TABLE (
    setting_key TEXT,
    setting_value TEXT,
    setting_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'email_notifications' as setting_key,
        COALESCE(us.email_notifications::TEXT, 'true') as setting_value,
        'boolean' as setting_type
    FROM user_settings us
    WHERE us.user_id = p_user_id
    
    UNION ALL
    
    SELECT 
        'theme' as setting_key,
        COALESCE(us.theme, 'system') as setting_value,
        'string' as setting_type
    FROM user_settings us
    WHERE us.user_id = p_user_id
    
    UNION ALL
    
    SELECT 
        'language' as setting_key,
        COALESCE(us.language, 'en') as setting_value,
        'string' as setting_type
    FROM user_settings us
    WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settings(UUID) TO authenticated;

-- Insert default settings for existing users (optional)
INSERT INTO user_settings (user_id)
SELECT DISTINCT u.id
FROM auth.users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_settings IS 'Stores comprehensive user settings and preferences';
COMMENT ON TABLE user_preferences IS 'Stores complex user preferences as JSON objects';
COMMENT ON FUNCTION get_user_settings(UUID) IS 'Returns user settings with default values';
