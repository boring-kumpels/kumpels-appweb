# Supabase Setup Guide for Kumpels App

This guide will help you set up Supabase for your Kumpels application deployment.

## 🚀 Getting Started with Supabase

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `kumpels-app`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Supabase Credentials

Once your project is created, go to **Settings > API** to find:

#### Database Connection Strings

- **Connection string**: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
- **Direct connection**: Same as above (for Prisma)

#### API Keys

- **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
- **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configure Environment Variables

Copy your credentials to your `.env` file:

```bash
# Copy example file
cp env.example .env

# Edit with your Supabase credentials
nano .env
```

Update these values in your `.env`:

```env
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-strong-secret-key-at-least-32-characters"

# Email Configuration
RESEND_API_KEY="re_..."
```

### 4. Set Up Database Schema

Your Prisma schema is already configured. Push it to Supabase:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### 5. Configure Supabase Auth (Optional)

If you want to use Supabase Auth instead of NextAuth:

1. Go to **Authentication > Settings**
2. Configure your site URL
3. Set up email templates
4. Configure OAuth providers if needed

### 6. Set Up Storage (Optional)

For file uploads (avatars, etc.):

1. Go to **Storage**
2. Create a new bucket called `avatars`
3. Set up RLS (Row Level Security) policies
4. Configure CORS if needed

## 🔧 Database Configuration

### Connection Pooling

Supabase provides built-in connection pooling. Your Prisma configuration should work out of the box.

### Row Level Security (RLS)

Enable RLS on your tables for better security:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);
```

### Database Functions

Create any custom functions you need:

```sql
-- Example: Health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy';
END;
$$ LANGUAGE plpgsql;
```

## 🔒 Security Best Practices

### 1. Environment Variables

- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate keys regularly

### 2. Database Security

- Enable RLS on all tables
- Use least privilege principle for policies
- Regularly audit access logs

### 3. API Security

- Use service role key only for admin operations
- Use anon key for public operations
- Implement proper rate limiting

## 📊 Monitoring and Maintenance

### 1. Supabase Dashboard

Monitor your application from the Supabase dashboard:

- **Database**: Query performance, connections
- **Auth**: User signups, failed logins
- **Storage**: File uploads, bandwidth
- **Logs**: API requests, errors

### 2. Database Backups

Supabase provides automatic backups:

- **Free tier**: 7 days of backups
- **Pro tier**: 30 days of backups
- **Enterprise**: Custom backup retention

### 3. Performance Monitoring

- Monitor query performance in the SQL editor
- Use Supabase's built-in analytics
- Set up alerts for high resource usage

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**

   ```bash
   # Check your DATABASE_URL format
   # Ensure your IP is not blocked
   # Verify password is correct
   ```

2. **RLS Policy Issues**

   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. **Migration Failures**

   ```bash
   # Reset migrations
   npx prisma migrate reset

   # Or push schema directly
   npx prisma db push
   ```

4. **Auth Issues**
   - Check NEXTAUTH_URL matches your domain
   - Verify NEXTAUTH_SECRET is strong enough
   - Ensure Supabase keys are correct

### Performance Issues

1. **Slow Queries**

   - Use Supabase's query analyzer
   - Add proper indexes
   - Optimize Prisma queries

2. **Connection Limits**
   - Supabase free tier: 2 connections
   - Pro tier: 7 connections
   - Consider connection pooling

## 🔄 Migration from Local Database

If you're migrating from a local PostgreSQL database:

1. **Export your data**

   ```bash
   pg_dump -h localhost -U postgres kumpels > backup.sql
   ```

2. **Import to Supabase**

   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < backup.sql
   ```

3. **Update your application**
   - Change DATABASE_URL to Supabase
   - Update any local-specific configurations
   - Test thoroughly

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [NextAuth with Supabase](https://next-auth.js.org/providers/supabase)
- [Supabase Security](https://supabase.com/docs/guides/security)

## 🆘 Support

For Supabase-specific issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
3. Contact Supabase support for paid plans
