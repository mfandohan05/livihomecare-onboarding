-- Closes the anonymous direct-REST access gap on public.caregivers.
--
-- All caregiver-facing reads and writes have been migrated to Edge Functions
-- that verify exact token possession server-side (get-caregiver-by-token,
-- update-caregiver-status, expire-caregiver-token, save-caregiver-location).
-- RLS can only express "does this row have a non-null token" — it cannot
-- express "does the requester's supplied value match this row's token" — so
-- these policies could never have enforced token possession themselves.
--
-- NOTE: there are two anonymous SELECT policies with the identical
-- `USING (token IS NOT NULL)` clause — both are dropped here, otherwise the
-- second leaves the same read gap open even after the first is removed.

drop policy if exists "anon can read caregivers with token" on public.caregivers;
drop policy if exists "caregivers can read own row by token" on public.caregivers;
drop policy if exists "anyone can update caregiver status" on public.caregivers;
