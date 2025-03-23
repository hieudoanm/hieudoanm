import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CountriesResolver } from './countries.resolver';
import { CountriesService } from './countries.service';

@Module({
  imports: [HttpModule],
  providers: [CountriesService, CountriesResolver],
})
export class CountriesModule {}
