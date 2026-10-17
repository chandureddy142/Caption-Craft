-- Migration: Add trending, editorial, motion, boxed categories and preview_tokens
ALTER TABLE caption_templates DROP CONSTRAINT IF EXISTS caption_templates_category_check;
ALTER TABLE caption_templates ADD CONSTRAINT caption_templates_category_check 
  CHECK (category IN ('classic', 'transition', 'animation', 'trending', 'editorial', 'motion', 'boxed'));

ALTER TABLE caption_templates ADD COLUMN IF NOT EXISTS preview_tokens jsonb;

-- Insert Rose Petal (Editorial)
INSERT INTO caption_templates (id, name, category, description, badge, display_order, settings, preview_sample, preview_tokens)
VALUES (
  'editorial-rose-petal',
  'rose petal',
  'editorial',
  'clean base typography with elegant italicized rose serif emphasis.',
  'Aesthetic',
  23,
  '{"style":"minimalist","fontFamily":"Inter, sans-serif","fontSize":44,"verticalPosition":0.82,"alignment":"center","textColor":"#FFFFFF","highlightColor":"#FF6B8B","boxColor":"#000000"}'::jsonb,
  '{"en":"This is how you go viral","te":"ఇలా మీరు వైరల్ అవుతారు","tenglish":"Ila meeru viral avtharu"}'::jsonb,
  '[{"text":"This"},{"text":"is"},{"text":"how"},{"text":"you","style":{"fontFamily":"Playfair Display, serif","fontStyle":"italic","color":"#ff6b8b","fontSizeMultiplier":1.15}},{"text":"go"},{"text":"viral","style":{"fontFamily":"Playfair Display, serif","fontStyle":"italic","color":"#ff6b8b","fontSizeMultiplier":1.15}}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  settings = EXCLUDED.settings,
  preview_tokens = EXCLUDED.preview_tokens;

-- Insert Scribble Autocap (Editorial)
INSERT INTO caption_templates (id, name, category, description, badge, display_order, settings, preview_sample, preview_tokens)
VALUES (
  'editorial-scribble',
  'scribble autocap',
  'editorial',
  'casual handwritten script with tilted highlighter badge.',
  'Journal',
  24,
  '{"style":"box","fontFamily":"Caveat, cursive","fontSize":48,"verticalPosition":0.8,"alignment":"center","textColor":"#FFFFFF","highlightColor":"#000000","boxColor":"#FFD000"}'::jsonb,
  '{"en":"This is how you go viral","te":"ఇలా మీరు వైరల్ అవుతారు","tenglish":"Ila meeru viral avtharu"}'::jsonb,
  '[{"text":"This"},{"text":"is"},{"text":"how"},{"text":"you","style":{"background":"#ffd000","color":"#000000","padding":"2px 8px","borderRadius":"6px","transform":"rotate(-2deg)"}},{"text":"go"},{"text":"viral","style":{"background":"#ffd000","color":"#000000","padding":"2px 8px","borderRadius":"6px","transform":"rotate(2deg)"}}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  settings = EXCLUDED.settings,
  preview_tokens = EXCLUDED.preview_tokens;

-- Insert Block Focus (Trending / Hormozi)
INSERT INTO caption_templates (id, name, category, description, badge, display_order, settings, preview_sample, preview_tokens)
VALUES (
  'trending-block-focus',
  'block focus',
  'trending',
  'ultra-bold headline caps with vibrant red badge pop.',
  'Popular',
  25,
  '{"style":"outline","fontFamily":"Montserrat, sans-serif","fontSize":46,"textTransform":"uppercase","verticalPosition":0.78,"alignment":"center","textColor":"#FFFFFF","highlightColor":"#FFBE0B","boxColor":"#000000"}'::jsonb,
  '{"en":"This is how you go viral","te":"ఇలా మీరు వైరల్ అవుతారు","tenglish":"Ila meeru viral avtharu"}'::jsonb,
  '[{"text":"THIS"},{"text":"IS"},{"text":"HOW"},{"text":"YOU","style":{"background":"#e63946","color":"#ffffff","padding":"2px 8px","borderRadius":"4px"}},{"text":"GO","style":{"color":"#ffbe0b"}},{"text":"VIRAL","style":{"background":"#e63946","color":"#ffffff","padding":"2px 8px","borderRadius":"4px"}}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  settings = EXCLUDED.settings,
  preview_tokens = EXCLUDED.preview_tokens;
