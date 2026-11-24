import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  ToolKind,
} from '@prisma/client';
import { z } from 'zod';

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

export const GuideDraftSchema = BaseDraftSchema.extend({
  difficulty: z.enum([
    DifficultyLevel.BEGINNER,
    DifficultyLevel.PRACTICAL,
    DifficultyLevel.ADVANCED,
  ]),
  estimatedMinutes: z.number().int().positive().nullable().optional(),
  pricingModel: z.enum([PricingModel.FREE, PricingModel.FREEMIUM, PricingModel.PAID]),
  markdownBody: z.string().min(10),
  prompts: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        variables: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  cautions: z.string().nullable().optional(),
});

export type ScreeningOutput = z.infer<typeof ScreeningOutputSchema>;
export type NewsDraft = z.infer<typeof NewsDraftSchema>;
export type ToolDraft = z.infer<typeof ToolDraftSchema>;
export type GuideDraft = z.infer<typeof GuideDraftSchema>;
