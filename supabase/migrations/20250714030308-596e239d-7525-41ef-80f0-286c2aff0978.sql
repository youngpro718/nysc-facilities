-- Create monitored_items table
CREATE TABLE public.monitored_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL, -- 'issue', 'room', 'occupant', 'key', etc.
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  monitored_by UUID NOT NULL,
  monitoring_criteria JSONB DEFAULT '{}',
  alert_thresholds JSONB DEFAULT '{}',
  last_alert_sent TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitoring_rules table  
CREATE TABLE public.monitoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitored_item_id UUID NOT NULL REFERENCES public.monitored_items(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL, -- 'threshold', 'status_change', 'time_based', etc.
  rule_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monitored_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for monitored_items
CREATE POLICY "Users can view monitored items" 
ON public.monitored_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create monitored items" 
ON public.monitored_items 
FOR INSERT 
WITH CHECK (auth.uid() = monitored_by);

CREATE POLICY "Users can update their own monitored items" 
ON public.monitored_items 
FOR UPDATE 
USING (auth.uid() = monitored_by);

CREATE POLICY "Users can delete their own monitored items" 
ON public.monitored_items 
FOR DELETE 
USING (auth.uid() = monitored_by);

-- Create policies for monitoring_rules
CREATE POLICY "Users can view monitoring rules" 
ON public.monitoring_rules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.monitored_items 
  WHERE id = monitoring_rules.monitored_item_id 
  AND monitored_by = auth.uid()
));

CREATE POLICY "Users can create monitoring rules" 
ON public.monitoring_rules 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.monitored_items 
  WHERE id = monitoring_rules.monitored_item_id 
  AND monitored_by = auth.uid()
));

CREATE POLICY "Users can update monitoring rules" 
ON public.monitoring_rules 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.monitored_items 
  WHERE id = monitoring_rules.monitored_item_id 
  AND monitored_by = auth.uid()
));

CREATE POLICY "Users can delete monitoring rules" 
ON public.monitoring_rules 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.monitored_items 
  WHERE id = monitoring_rules.monitored_item_id 
  AND monitored_by = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_monitored_items_type_id ON public.monitored_items(item_type, item_id);
CREATE INDEX idx_monitored_items_user ON public.monitored_items(monitored_by);
CREATE INDEX idx_monitoring_rules_item ON public.monitoring_rules(monitored_item_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monitored_items_updated_at
  BEFORE UPDATE ON public.monitored_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitoring_rules_updated_at
  BEFORE UPDATE ON public.monitoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();