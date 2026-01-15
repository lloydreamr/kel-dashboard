/**
 * Pitch Library
 *
 * Exports pitch-related utilities and configurations.
 *
 * Story 18-4: Pitch Template Library
 */

// Template configuration system
export {
  // Types
  type TemplateContextWeights,
  type PitchTemplateSection,
  type PitchTemplateConfig,
  // Constants
  DEFAULT_CONTEXT_WEIGHTS,
  MID_SIZE_TEMPLATE,
  REGIONAL_TEMPLATE,
  WOFEX_BOOTH_TEMPLATE,
  ALL_TEMPLATES,
  // Functions
  getTemplateConfig,
  getTemplateContextWeights,
  getSectionContextWeights,
  getTemplateSections,
  getSectionPromptModifier,
  getTemplateTone,
} from './templates';
