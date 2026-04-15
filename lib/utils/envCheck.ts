// Environment configuration checker.
// All checks use NEXT_PUBLIC_ vars so they work in both client and server contexts.

export const envConfig = {
  isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!(url && url !== "your_supabase_url_here" && url.includes("supabase.co"));
  },

  isZoomConfigured(): boolean {
    const key = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY;
    return !!(key && key !== "your_zoom_sdk_key_here");
  },

  isYouTubeConfigured(): boolean {
    // YouTube API key is server-side only (no NEXT_PUBLIC_ prefix),
    // so from the client we can only check the public placeholder absence.
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    return !!(key && key !== "your_youtube_api_key_here");
  },

  isDemoMode(): boolean {
    return !envConfig.isSupabaseConfigured() || !envConfig.isZoomConfigured();
  },

  summary(): Record<string, boolean> {
    return {
      supabase: envConfig.isSupabaseConfigured(),
      zoom: envConfig.isZoomConfigured(),
      youtube: envConfig.isYouTubeConfigured(),
      demoMode: envConfig.isDemoMode(),
    };
  },
};
