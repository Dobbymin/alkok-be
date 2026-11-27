-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'SKILL';

-- CreateEnum
CREATE TYPE "SkillKind" AS ENUM ('SKILL', 'PLUGIN', 'MCP');

-- CreateEnum
CREATE TYPE "SkillExecutionVerification" AS ENUM ('VERIFIED', 'SOURCE_CHECKED', 'UNVERIFIED');

-- AlterTable
ALTER TABLE "guide_details"
ADD COLUMN "verification_checklist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "tool_details"
ADD COLUMN "use_cases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "getting_started_steps" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN "example_prompts" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN "faq" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- CreateTable
CREATE TABLE "skill_details" (
    "content_id" UUID NOT NULL,
    "skill_kind" "SkillKind" NOT NULL,
    "skill_slug" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "license" TEXT,
    "repository_url" TEXT NOT NULL,
    "source_file_url" TEXT,
    "execution_verification" "SkillExecutionVerification" NOT NULL DEFAULT 'SOURCE_CHECKED',
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'PRACTICAL',
    "pricing_model" "PricingModel" NOT NULL DEFAULT 'FREE',
    "compatible_agents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "overview" TEXT NOT NULL,
    "use_cases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "before_after" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "workflow_steps" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "prerequisites" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "install_prompt" TEXT,
    "install_guides" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "example_prompts" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "expected_outputs" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "post_run_checklist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "cautions" TEXT,
    "faq" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "file_structure" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "skill_md_preview" TEXT,
    "web_alternative" JSONB,
    "toc" JSONB,

    CONSTRAINT "skill_details_pkey" PRIMARY KEY ("content_id")
);

-- CreateIndex
CREATE INDEX "skill_details_skill_kind_difficulty_idx" ON "skill_details"("skill_kind", "difficulty");

-- AddForeignKey
ALTER TABLE "skill_details" ADD CONSTRAINT "skill_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
