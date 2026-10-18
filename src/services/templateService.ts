import { supabase } from "../lib/supabase";
import { CAPTION_TEMPLATES } from '../utils/captionTemplates';
import type { CaptionCategory, CaptionTemplateDefinition, CanvasSettings, WordStyleRule } from '../types';

interface CaptionTemplateRow {
  id: string;
  name: string;
  category: CaptionCategory;
  description: string;
  badge: string | null;
  settings: Partial<CanvasSettings>;
  word_patterns: WordStyleRule[] | null;
  preview_sample: CaptionTemplateDefinition['previewSample'];
  display_order: number;
}

export async function getTemplates(): Promise<CaptionTemplateDefinition[]> {
  if (!supabase) return CAPTION_TEMPLATES;

  try {
    const { data, error } = await supabase
      .from('caption_templates')
      .select('id,name,category,description,badge,settings,word_patterns,preview_sample,preview_tokens,display_order')
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('CaptionCraft: using local caption template fallback.', error?.message);
      return CAPTION_TEMPLATES;
    }

    return (data as CaptionTemplateRow[]).map(item => ({
      id: item.id as CaptionTemplateDefinition['id'],
      name: item.name,
      category: item.category,
      description: item.description,
      badge: item.badge ?? undefined,
      settings: item.settings,
      wordPatterns: item.word_patterns ?? undefined,
      previewSample: item.preview_sample,
      previewTokens: (item as any).preview_tokens ?? undefined,
    }));
  } catch (error) {
    console.error('CaptionCraft: unable to fetch caption templates.', error);
    return CAPTION_TEMPLATES;
  }
}
