import { createClient, SupabaseClient } from '@supabase/supabase-js';

const cleanUrl = (url?: string) => url?.trim().replace(/^["']|["']$/g, '') || '';
const cleanKey = (key?: string) => key?.trim().replace(/^["']|["']$/g, '') || '';

const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hlybvazspohsussvltvs.supabase.co';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseWJ2YXpzcG9oc3Vzc3ZsdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDAyNjAsImV4cCI6MjEwMTgxNjI2MH0.uSYDINDFpsXj9Jn4fMAAvbqcPhTPcRPmmxhz_Jm5Kcs';

export const supabaseUrl = cleanUrl(envUrl);
export const supabaseAnonKey = cleanKey(envKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

const isBrowser = typeof window !== 'undefined';
export const clientBaseUrl = isBrowser ? `${window.location.origin}/api/supabase-proxy` : supabaseUrl;

// Dedicated Supabase client setup using proxy URL in browser to guarantee zero CORS/network blocking
export const supabase: SupabaseClient = createClient(
  clientBaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('[Supabase checkConnection] Connection check warning:', error.message || error);
      return { success: false, error: error.message || error };
    }

    console.log('[Supabase checkConnection] Connected successfully! Rows retrieved:', data?.length ?? 0);
    return { success: true, rows: data?.length ?? 0 };
  } catch (err: any) {
    const errorMsg = err?.message || 'TypeError: Failed to fetch';
    console.warn('[Supabase checkConnection] Unable to connect:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string) {
  try {
    const rawUrl = customUrl ? cleanUrl(customUrl) : clientBaseUrl;
    const cUrl = rawUrl.startsWith('http') ? rawUrl : cleanUrl(supabaseUrl);
    const cKey = cleanKey(customKey || supabaseAnonKey);

    if (!cUrl || !cKey) {
      return { success: false, message: 'URL atau Anon Key Supabase belum diisi dengan benar.' };
    }

    const testClient = createClient(cUrl, cKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const { data, error } = await testClient.from('users').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST301' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return { success: true, message: 'Terkoneksi ke proyek Supabase! (Skema database siap diupload)' };
      }
      return { success: false, message: `Gagal terhubung: ${error.message || 'Gagal tersambung'}` };
    }

    return { success: true, message: 'Koneksi ke Supabase berhasil!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung ke Supabase: ${err.message || 'Network error'}` };
  }
}

export async function rawFetchDiagnostic() {
  const targetUrl = `${clientBaseUrl}/rest/v1/users?select=id&limit=1`;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'SSR';

  console.group('🔍 [Supabase Raw Fetch Diagnostic]');
  console.log('📍 Current Origin:', currentOrigin);
  console.log('🔗 Target Supabase Proxy REST URL:', targetUrl);
  console.log('🔑 Using Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 10)}...` : 'MISSING');

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Response Received - Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      console.warn('⚠️ REST API returned HTTP error:', response.status, responseData);
      console.groupEnd();
      return {
        isCorsOrNetworkError: false,
        status: response.status,
        statusText: response.statusText,
        errorDetails: `HTTP ${response.status}: ${JSON.stringify(responseData)}`,
        origin: currentOrigin,
        targetUrl,
        data: responseData
      };
    }

    console.log('🎉 Fetch succeeded without CORS or Network errors! Data:', responseData);
    console.groupEnd();
    return {
      isCorsOrNetworkError: false,
      status: response.status,
      statusText: response.statusText,
      errorDetails: null,
      origin: currentOrigin,
      targetUrl,
      data: responseData
    };
  } catch (err: any) {
    const exactMessage = err?.message || String(err);
    console.error('❌ RAW FETCH FAILED (CORS or Network issue detected):');
    console.error('Exact Error Message:', exactMessage);
    console.warn(`Possible Causes:\n 1. CORS restriction on Supabase project for origin: "${currentOrigin}"\n 2. Network/Adblocker/Proxy blocking REST API requests\n 3. SSL/TLS Certificate issue`);
    console.groupEnd();

    return {
      isCorsOrNetworkError: true,
      status: 0,
      errorDetails: exactMessage,
      origin: currentOrigin,
      targetUrl,
      diagnosticAdvice: `Request from origin '${currentOrigin}' to '${targetUrl}' was blocked before receiving a response (${exactMessage}). Check CORS configuration or network proxy.`
    };
  }
}

// Auto-run on window load in browser & attach to window for console execution
if (typeof window !== 'undefined') {
  (window as any).runSupabaseDiagnostic = rawFetchDiagnostic;
  setTimeout(() => {
    rawFetchDiagnostic().catch(() => {});
  }, 1000);
}




