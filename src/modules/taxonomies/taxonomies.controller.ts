import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaxonomiesService } from './taxonomies.service';

@ApiTags('taxonomies')
@Controller('taxonomies')
export class TaxonomiesController {
  constructor(private readonly taxonomiesService: TaxonomiesService) {}

  @Get()
  @ApiOperation({ operationId: 'getTaxonomies', summary: '업무 도메인·AI 용도·인기 태그 조회' })
  getTaxonomies() {
    return this.taxonomiesService.getTaxonomies();
  }
}
