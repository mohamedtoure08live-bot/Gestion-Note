/**
 * Supabase Client Configuration & Connectivity Manager (js/supabaseClient.js)
 * Full Stack EPS integration with real-time support and offline resiliency.
 */

export const SUPABASE_CONFIG = {
  url: "https://omdcwdwdcgjsxldycima.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZGN3ZHdkY2dqc3hsZHljaW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzkxMDEsImV4cCI6MjA5NDM1NTEwMX0.InNTIU-8pIV5fRooxN2Ve0M8XZhm56vRGgc4624RXSQ"
};

// Initialize Supabase client using global window.supabase (loaded from CDN in index.html)
let client = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} else {
  console.warn("Supabase SDK not loaded yet on window.supabase. Client will initialize dynamically.");
}

export const supabase = client || {
  from: () => ({
    select: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
    insert: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
    update: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
    delete: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") }),
    upsert: () => Promise.resolve({ data: null, error: new Error("Supabase client not initialized") })
  })
};

export class SupabaseManager {
  static isConnected = false;
  static statusListeners = [];

  static getClient() {
    if (!client && window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
    return client;
  }

  static onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusListeners.push(callback);
      // Immediately notify current status
      callback(this.isConnected);
    }
  }

  static notifyStatus(connected) {
    this.isConnected = connected;
    this.statusListeners.forEach(cb => {
      try { cb(connected); } catch (e) { console.error("Status callback error:", e); }
    });
  }

  /**
   * Ping Supabase to test connectivity
   */
  static async checkConnection() {
    const sb = this.getClient();
    if (!sb) {
      this.notifyStatus(false);
      return false;
    }

    try {
      const { data, error } = await sb
        .from('classes')
        .select('id')
        .limit(1);

      if (error) {
        console.warn("Supabase ping returned error:", error.message);
        this.notifyStatus(false);
        return false;
      }

      this.notifyStatus(true);
      return true;
    } catch (err) {
      console.warn("Supabase network error:", err);
      this.notifyStatus(false);
      return false;
    }
  }
}
