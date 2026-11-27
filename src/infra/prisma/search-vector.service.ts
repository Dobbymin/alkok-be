import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SearchVectorService {
  constructor(private readonly prisma: PrismaService) {}

  async refresh(contentId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE contents c
      SET search_vector = (
        setweight(to_tsvector('simple', coalesce(c.title, '')), 'A') ||
        setweight(
          to_tsvector(
            'simple',
            coalesce(c.summary, '') || ' ' || coalesce(
              (SELECT string_agg(t.name, ' ')
               FROM content_tags ct
               JOIN tags t ON t.id = ct.tag_id
               WHERE ct.content_id = c.id),
              ''
            )
          ),
          'B'
        ) ||
        setweight(
          to_tsvector(
            'simple',
            coalesce((SELECT gd.markdown_body FROM guide_details gd WHERE gd.content_id = c.id), '') || ' ' ||
            coalesce((SELECT array_to_string(td.strengths, ' ') FROM tool_details td WHERE td.content_id = c.id), '') || ' ' ||
            coalesce((SELECT nd.work_impact FROM news_details nd WHERE nd.content_id = c.id), '') || ' ' ||
            coalesce((SELECT sd.overview || ' ' || sd.skill_slug || ' ' || sd.author_name || ' ' || array_to_string(sd.compatible_agents, ' ') || ' ' || array_to_string(sd.use_cases, ' ') FROM skill_details sd WHERE sd.content_id = c.id), '')
          ),
          'C'
        )
      )
      WHERE c.id = ${contentId}::uuid
    `;
  }
}
