/**
 * News, Macro and Event Intelligence Engine
 * 
 * Strict Principle:
 * - Distinguishes FACT from INTERPRETATION, POSSIBLE IMPACT, and OBSERVED MARKET REACTION.
 * - Maps macro/regulatory transmission mechanisms to affected sectors and stocks.
 * - Separates language intelligence from deterministic market calculations.
 */

import {
  NewsArticle,
  ExternalEvent,
  EventImpact,
  NewsImpactCategory,
  EventTransmissionDirection
} from '../../types/index.ts';
import { logger } from '../logger.ts';

export class NewsIntelligenceService {
  /**
   * Evaluates and classifies a news headline or event
   */
  public classifyImpact(headline: string, summary: string, sourceAuthority: string): NewsImpactCategory {
    const text = `${headline} ${summary} ${sourceAuthority}`.toUpperCase();

    // Critical systemic triggers in Kenya
    if (text.includes('CENTRAL BANK RATE') || text.includes('CBR') || text.includes('FINANCE ACT') || text.includes('CURRENCY DEPRECIATION')) {
      return 'POTENTIALLY_MARKET_MOVING';
    }

    if (text.includes('EARNINGS') || text.includes('DIVIDEND') || text.includes('PROFIT WARNING') || text.includes('RIGHTS ISSUE')) {
      return 'HIGH_IMPORTANCE';
    }

    if (text.includes('REGULATION') || text.includes('TAX') || text.includes('ACQUISITION') || text.includes('CEO')) {
      return 'RELEVANT';
    }

    if (text.includes('SPONSORSHIP') || text.includes('CSR') || text.includes('AWARDS')) {
      return 'LOW_IMPACT';
    }

    return 'INFORMATION';
  }

  /**
   * Generates sector & company transmission mapping for macro events
   */
  public generateEventImpacts(event: ExternalEvent): EventImpact[] {
    const impacts: EventImpact[] = [];
    const text = `${event.title} ${event.description}`.toUpperCase();

    // 1. Banking sector impact from CBK policy
    if (text.includes('CBK') || text.includes('CENTRAL BANK RATE') || text.includes('CBR')) {
      impacts.push({
        id: `imp-${event.id}-banking`,
        eventId: event.id,
        affectedTargetType: 'SECTOR',
        targetId: 'sec-banking',
        targetSymbolOrCode: 'BANKING',
        potentialPressure: 'MIXED',
        estimatedMagnitudePctMin: -2.0,
        estimatedMagnitudePctMax: 2.5,
        evidence: 'Changes to CBR influence treasury bill benchmark yields and commercial lending spread margins.',
        confidence: 0.85,
        provenance: 'ESTIMATE'
      });
    }

    // 2. Manufacturing & EABL excise duty transmission
    if (text.includes('EXCISE') || text.includes('ALCOHOL') || text.includes('MANUFACTURING TAX')) {
      impacts.push({
        id: `imp-${event.id}-eabl`,
        eventId: event.id,
        affectedTargetType: 'COMPANY',
        targetId: 'stk-eabl',
        targetSymbolOrCode: 'EABL',
        potentialPressure: 'NEGATIVE',
        estimatedMagnitudePctMin: -4.0,
        estimatedMagnitudePctMax: -1.0,
        evidence: 'Direct excise tax increments compress alcoholic beverage volume elasticity in Kenya.',
        confidence: 0.90,
        provenance: 'ESTIMATE'
      });
    }

    return impacts;
  }
}

export const newsIntelligenceService = new NewsIntelligenceService();
