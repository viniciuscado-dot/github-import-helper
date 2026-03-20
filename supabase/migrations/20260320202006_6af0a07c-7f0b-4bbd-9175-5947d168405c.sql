-- Allow authenticated users to update copy_clients
CREATE POLICY "Authenticated users can update copy_clients"
ON public.copy_clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);