-- DropIndex
DROP INDEX "contents_search_vector_gin";

-- DropIndex
DROP INDEX "contents_summary_trgm_gin";

-- DropIndex
DROP INDEX "contents_title_trgm_gin";

-- DropIndex
DROP INDEX "tags_name_trgm_gin";

-- AlterTable
ALTER TABLE "guide_details" ADD COLUMN     "before_after_examples" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "common_mistakes" JSONB NOT NULL DEFAULT '[]';
