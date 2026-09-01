/**
 * templateUtils.ts
 *
 * Utility functions for identifying and categorizing templates.
 */

export interface TemplateLike {
  name?: string;
  category?: string;
  moduleType?: string;
  description?: string;
}

/**
 * Checks if a given template is designated for Portal Feedback.
 * Such templates should only be presented on the public /feedback portal page
 * and excluded from field survey listings and offline site survey syncs.
 */
export const isPortalFeedbackTemplate = (template?: TemplateLike | null): boolean => {
  if (!template) return false;
  const name = (template.name || '').trim().toLowerCase();
  const category = (template.category || '').trim().toLowerCase();
  const moduleType = (template.moduleType || '').trim().toLowerCase();
  const description = (template.description || '').trim().toLowerCase();

  return (
    name.includes('feedback') ||
    name.includes('portal feedback') ||
    category === 'feedback' ||
    category === 'portal feedback' ||
    category === 'portal' ||
    moduleType === 'feedback' ||
    moduleType === 'portal feedback' ||
    description.includes('portal feedback')
  );
};
