import { useEffect, useState } from 'react';
import { getTemplates } from '../services/templateService';
import { CAPTION_TEMPLATES } from '../utils/captionTemplates';
import type { CaptionCategory, CaptionTemplateDefinition } from '../types';

export function useTemplates() {
  const [templates, setTemplates] = useState<CaptionTemplateDefinition[]>(CAPTION_TEMPLATES);
  const [activeCategory, setActiveCategory] = useState<CaptionCategory>('classic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getTemplates().then(result => {
      if (!mounted) return;
      setTemplates(result);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filteredTemplates = templates
    .filter(template => template.category === activeCategory);

  return { templates, filteredTemplates, activeCategory, setActiveCategory, loading };
}

export default useTemplates;
