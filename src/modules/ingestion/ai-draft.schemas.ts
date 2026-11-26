import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  ToolKind,
} from '@prisma/client';
import { z } from 'zod';
import { GUIDE_MISTAKE_CATEGORIES } from '../contents/contents.dto';

export const ScreeningOutputSchema = z.object({
  relevanceScore: z.number().int().min(1).max(5),
  recommendedType: z.enum([ContentType.NEWS, ContentType.TOOL, ContentType.GUIDE]),
  workDomains: z.array(z.string()).min(1).max(2),
  aiUses: z.array(z.string()).min(1).max(2),
  suggestedTags: z.array(z.string()).min(1).max(5),
  skipReason: z.string().nullable().optional(),
});

const BaseDraftSchema = z.object({
  title: z.string().min(2),
  summary: z.string().min(5),
  workDomains: z.array(z.string()).default([]),
  aiUses: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  evidenceNotes: z.array(z.string()).min(1),
  unverifiedFields: z.array(z.string()).default([]),
});

export const NewsDraftSchema = BaseDraftSchema.extend({
  keyPoints: z.array(z.string()).length(3),
  workImpact: z.string().min(5),
});

export const ToolDraftSchema = BaseDraftSchema.extend({
  toolKind: z.enum([ToolKind.TOOL, ToolKind.MODEL]),
  providerName: z.string().min(1),
  pricingModel: z.enum([PricingModel.FREE, PricingModel.FREEMIUM, PricingModel.PAID]),
  hasFreePlan: z.boolean(),
  pricingSummary: z.string().min(1),
  koreanSupport: z.enum([
    KoreanSupportLevel.FULL,
    KoreanSupportLevel.PARTIAL,
    KoreanSupportLevel.NONE,
  ]),
  platforms: z.array(z.string()).min(1),
  strengths: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
});

export const GuidePromptDraftSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).default([]),
  variableExamples: z.record(z.string()).optional(),
  expectedOutput: z.string().optional(),
  tips: z.string().optional(),
});

export const GuideBeforeAfterExampleDraftSchema = z.object({
  title: z.string().min(1),
  beforeInput: z.string().min(5),
  afterOutput: z.string().min(5),
  improvementPoints: z.array(z.string()).default([]),
});

export const GuideCommonMistakeDraftSchema = z.object({
  category: z.enum(GUIDE_MISTAKE_CATEGORIES),
  title: z.string().min(1),
  mistake: z.string().min(5),
  prevention: z.string().min(5),
});

export const GuideDraftSchema = BaseDraftSchema.extend({
  difficulty: z.enum([
    DifficultyLevel.BEGINNER,
    DifficultyLevel.PRACTICAL,
    DifficultyLevel.ADVANCED,
  ]),
  estimatedMinutes: z.number().int().positive().nullable().optional(),
  pricingModel: z.enum([PricingModel.FREE, PricingModel.FREEMIUM, PricingModel.PAID]),
  markdownBody: z.string().min(10),
  prompts: z.array(GuidePromptDraftSchema).default([]),
  beforeAfterExamples: z.array(GuideBeforeAfterExampleDraftSchema).min(1),
  commonMistakes: z.array(GuideCommonMistakeDraftSchema).min(1),
  cautions: z.string().nullable().optional(),
});

export type ScreeningOutput = z.infer<typeof ScreeningOutputSchema>;
export type NewsDraft = z.infer<typeof NewsDraftSchema>;
export type ToolDraft = z.infer<typeof ToolDraftSchema>;
export type GuideDraft = z.infer<typeof GuideDraftSchema>;
