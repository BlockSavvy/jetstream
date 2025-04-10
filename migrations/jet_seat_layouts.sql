-- Create jet_seat_layouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.jet_seat_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jet_id UUID NOT NULL REFERENCES public.jets(id) ON DELETE CASCADE,
    layout JSONB NOT NULL, -- Store the entire seat layout JSON object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.jet_seat_layouts IS 'Custom seat layouts for specific jets';

-- Add row-level security policies
ALTER TABLE public.jet_seat_layouts ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading by any authenticated user
CREATE POLICY "Allow reading layouts" 
    ON public.jet_seat_layouts
    FOR SELECT 
    USING (true);

-- Policy to allow jet owners to update layouts
CREATE POLICY "Allow owners to update layouts" 
    ON public.jet_seat_layouts
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT j.owner_id 
            FROM public.jets j 
            WHERE j.id = jet_seat_layouts.jet_id
        )
    );

-- Policy to allow jet owners to insert layouts
CREATE POLICY "Allow owners to insert layouts" 
    ON public.jet_seat_layouts
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT j.owner_id 
            FROM public.jets j 
            WHERE j.id = jet_seat_layouts.jet_id
        )
    );

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS jet_seat_layouts_jet_id_idx ON public.jet_seat_layouts(jet_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jet_seat_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
CREATE TRIGGER update_jet_seat_layouts_updated_at
BEFORE UPDATE ON public.jet_seat_layouts
FOR EACH ROW
EXECUTE FUNCTION update_jet_seat_layouts_updated_at(); 