import { Module } from '@nestjs/common';
import { ChurchesController } from './churches.controller';
import { InvitesController } from './invites.controller';
import { ChurchesService } from './churches.service';
import { CacheModule } from '../../core/cache/cache.module';
import { MailModule } from '../../core/mail/mail.module';

@Module({
  imports: [CacheModule, MailModule],
  controllers: [ChurchesController, InvitesController],
  providers: [ChurchesService],
  exports: [ChurchesService],
})
export class ChurchesModule {}
