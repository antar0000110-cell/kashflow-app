import { Transaction, Agent } from '../types';

export interface AgentCurrencyVolume {
  agentId: string;
  agentName: string;
  baseCurrency: string;
  egpDepositVolume: number;
  egpWithdrawalVolume: number;
  egpTotalVolume: number;
  usdDepositVolume: number;
  usdWithdrawalVolume: number;
  usdTotalVolume: number;
  otherTotalVolume: number;
  grandTotalVolume: number;
  totalOrdersCount: number;
}

export interface CurrencyVolumeSummary {
  egp: {
    depositVolume: number;
    withdrawalVolume: number;
    totalVolume: number;
    count: number;
  };
  usd: {
    depositVolume: number;
    withdrawalVolume: number;
    totalVolume: number;
    count: number;
  };
  other: {
    depositVolume: number;
    withdrawalVolume: number;
    totalVolume: number;
    count: number;
  };
  byAgent: AgentCurrencyVolume[];
}

/**
 * Aggregates total transaction liquidity volume by currency (USDT vs USD) per agent.
 * Allows administrators and financial reports to inspect volume breakdown per currency.
 */
export function aggregateVolumeByCurrency(
  depositHistory: Transaction[],
  withdrawalHistory: Transaction[],
  agents: Agent[]
): CurrencyVolumeSummary {
  const summary: CurrencyVolumeSummary = {
    egp: { depositVolume: 0, withdrawalVolume: 0, totalVolume: 0, count: 0 },
    usd: { depositVolume: 0, withdrawalVolume: 0, totalVolume: 0, count: 0 },
    other: { depositVolume: 0, withdrawalVolume: 0, totalVolume: 0, count: 0 },
    byAgent: [],
  };

  const allProcessed = [...depositHistory, ...withdrawalHistory].filter(
    (t) => t.status === 'Approved' || (t.status as string) === 'Completed'
  );

  summary.byAgent = agents.map((agent) => {
    const agentTxs = allProcessed.filter(
      (t) => t.subagentId === agent.id || t.processedBy === agent.name || t.subagentName === agent.name
    );

    let egpDepVol = 0;
    let egpWdlVol = 0;
    let usdDepVol = 0;
    let usdWdlVol = 0;
    let otherVol = 0;

    agentTxs.forEach((tx) => {
      const cur = (tx.currency || agent.currency || 'USDT').toUpperCase();
      const amt = tx.amount || 0;

      if (cur === 'EGP') {
        if (tx.type === 'deposit') {
          egpDepVol += amt;
          summary.egp.depositVolume += amt;
        } else {
          egpWdlVol += amt;
          summary.egp.withdrawalVolume += amt;
        }
        summary.egp.totalVolume += amt;
        summary.egp.count += 1;
      } else if (cur === 'USD' || cur === 'USDT') {
        if (tx.type === 'deposit') {
          usdDepVol += amt;
          summary.usd.depositVolume += amt;
        } else {
          usdWdlVol += amt;
          summary.usd.withdrawalVolume += amt;
        }
        summary.usd.totalVolume += amt;
        summary.usd.count += 1;
      } else {
        otherVol += amt;
        if (tx.type === 'deposit') {
          summary.other.depositVolume += amt;
        } else {
          summary.other.withdrawalVolume += amt;
        }
        summary.other.totalVolume += amt;
        summary.other.count += 1;
      }
    });

    const egpTotal = egpDepVol + egpWdlVol;
    const usdTotal = usdDepVol + usdWdlVol;
    const grandTotal = egpTotal + usdTotal + otherVol;

    return {
      agentId: agent.id,
      agentName: agent.name,
      baseCurrency: agent.currency || 'USDT',
      egpDepositVolume: egpDepVol,
      egpWithdrawalVolume: egpWdlVol,
      egpTotalVolume: egpTotal,
      usdDepositVolume: usdDepVol,
      usdWithdrawalVolume: usdWdlVol,
      usdTotalVolume: usdTotal,
      otherTotalVolume: otherVol,
      grandTotalVolume: grandTotal,
      totalOrdersCount: agentTxs.length,
    };
  });

  return summary;
}
