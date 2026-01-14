/**
 * RTB Controller - OpenRTB API Endpoints
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RtbService, BidRequest, BidResponse } from './rtb.service';

@Controller('rtb')
export class RtbController {
  constructor(private readonly rtbService: RtbService) {}

  @Post('bid')
  @HttpCode(HttpStatus.OK)
  async handleBidRequest(@Body() request: BidRequest): Promise<BidResponse> {
    return this.rtbService.processBidRequest(request);
  }

  @Post('auction')
  @HttpCode(HttpStatus.OK)
  async runAuction(@Body() request: BidRequest) {
    const result = await this.rtbService.conductAuction(request);

    return {
      auctionId: result.auctionId,
      winner: result.winner
        ? {
            campaignId: result.winner.campaignId,
            adId: result.winner.adId,
            winningPrice: result.winner.price,
          }
        : null,
      totalBids: result.allBids.length,
      secondPrice: result.secondPrice,
    };
  }
}

