import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackProvider } from './providers/paystack.provider';
import { StripeProvider } from './providers/stripe.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaystackProvider,
    StripeProvider,
    FlutterwaveProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
