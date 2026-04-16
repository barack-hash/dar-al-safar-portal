/** Log Supabase/PostgREST errors with hints for 403 (RLS) vs missing relation (404 / PGRST). */
export function logSupabaseDataError(context: string, error: unknown): void {
  if (error == null) return;

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : NaN;

  const hint403 =
    status === 403 ||
    code === '42501' ||
    /permission denied|rls|row-level security|new row violates row-level security/i.test(msg);
  const hint404 =
    status === 404 ||
    code === 'PGRST116' ||
    /relation|does not exist|schema cache|not find/i.test(msg);

  if (hint403) {
    console.error(
      `[Supabase] ${context}: likely RLS / permission (403). Policies may block this role. Raw error:`,
      error
    );
  } else if (hint404) {
    console.error(
      `[Supabase] ${context}: table or route not found (404 / schema). Check that public.transactions exists. Raw error:`,
      error
    );
  } else {
    console.error(`[Supabase] ${context}:`, error);
  }
}
