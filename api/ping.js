export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwbhsukrpbcxqypnnbzp.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YmhzdWtycGJjeHF5cG5uYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTMzOTEsImV4cCI6MjA5OTg2OTM5MX0.FN4JGYlf-1AZj3tNNCw9HYYUE2KKzBRSHKqqMERgQfc';
    
    // Ping DB to prevent pause using fetch (no dependencies)
    const response = await fetch(`${supabaseUrl}/rest/v1/rifas?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    res.status(200).json({ status: "ok", message: "Supabase pinged successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
