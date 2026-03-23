import { BcbSeriesResponse } from '../types';
import { format, parseISO } from 'date-fns';

const BCB_SERIES = {
  SELIC: 11,
  IPCA: 433,
  IGPM: 189,
  INCC: 192,
};

export async function fetchBcbData(
  indexType: keyof typeof BCB_SERIES,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<BcbSeriesResponse[]> {
  const seriesCode = BCB_SERIES[indexType];
  const start = format(parseISO(startDate), 'dd/MM/yyyy');
  const end = format(parseISO(endDate), 'dd/MM/yyyy');

  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?formato=json&dataInicial=${start}&dataFinal=${end}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return []; // No data for the period
      }
      throw new Error(`BCB API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BCB data', error);
    throw error;
  }
}
