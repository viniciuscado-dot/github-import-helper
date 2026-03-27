

## Plan: Add Google Login (restricted to @dotconceito.com)

### How it works
- Add a "Entrar com Google" button on the Auth page
- After Google OAuth callback, check if the email ends with `@dotconceito.com`
- If not, sign the user out immediately and show an error toast
- The `handle_new_user` trigger already creates a profile automatically with role `equipe`

### Prerequisites (user action required)
You need to configure Google OAuth in two places:

**1. Google Cloud Console**
- Create OAuth Client ID (Web Application)
- Add `https://cesohdhspysooaowtvsu.supabase.co` to Authorized redirect URIs as: `https://cesohdhspysooaowtvsu.supabase.co/auth/v1/callback`
- Add your site URL to Authorized JavaScript origins

**2. Supabase Dashboard**
- Go to Authentication → Providers → Google
- Enable it and paste Client ID + Client Secret

### Code Changes

**1. `src/pages/Auth.tsx`**
- Add a "Entrar com Google" button below the existing login form
- On click: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth' } })`
- Add a `useEffect` that listens to auth state changes — if a new Google user's email doesn't end with `@dotconceito.com`, call `signOut()` and show error toast "Apenas emails @dotconceito.com podem acessar"

**2. `src/contexts/AuthContext.tsx`**
- In the `onAuthStateChange` handler, add a domain check: if the user's email doesn't end with `@dotconceito.com`, sign them out and clear state

### Security note
The domain restriction is enforced both client-side (UX) and via the profile system (admins control permissions). For stronger server-side enforcement, a Supabase auth hook could be added later, but the client-side check + existing permission system is sufficient for this use case.

### Files Modified
- `src/pages/Auth.tsx` — add Google button + domain validation
- `src/contexts/AuthContext.tsx` — add domain check on auth state change

### Unchanged
- Database, RLS, edge functions, permissions system
- Existing email/password login flow

