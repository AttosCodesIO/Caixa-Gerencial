import { differenceInMonths, parseISO } from 'date-fns';
import { BcbSeriesResponse } from '../types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const calculateCorrection = (
  originalValue: number,
  factors: BcbSeriesResponse[],
  indexType: 'SELIC' | 'IPCA' | 'IGPM' | 'INCC',
  additionalInterestRate: number,
  startDateStr: string,
  endDateStr: string
) => {
  let correctedValue = originalValue;

  for (const factor of factors) {
    const taxa = parseFloat(factor.valor.replace(',', '.')) / 100;
    correctedValue = correctedValue * (1 + taxa);
  }

  // Juros adicionais de forma simples a.m. (geralmente usado 1% a.m em litígios)
  if (additionalInterestRate > 0) {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    const months = Math.max(0, differenceInMonths(end, start));
    const simpleInterest = (months * additionalInterestRate) / 100;
    correctedValue = correctedValue * (1 + simpleInterest);
  }

  const interestValue = correctedValue - originalValue;
  const totalPercentage = originalValue > 0 ? (interestValue / originalValue) * 100 : 0;

  return {
    correctedValue,
    interestValue,
    totalPercentage,
  };
};
