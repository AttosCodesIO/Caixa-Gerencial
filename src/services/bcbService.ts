import { BcbSeriesResponse } from '../types';
import { format, parseISO, addYears, subDays, isAfter, min } from 'date-fns';

const BCB_SERIES = {
  SELIC: 11,
  IPCA: 433,
  IGPM: 189,
  INCC: 192,
};

// Busca um chunk único (até 1 ano) com retry
async function fetchBcbChunk(
  seriesCode: number,
  chunkStart: Date,
  chunkEnd: Date,
  attempt = 1,
): Promise<BcbSeriesResponse[]> {
  const start = format(chunkStart, 'dd/MM/yyyy');
  const end = format(chunkEnd, 'dd/MM/yyyy');
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?formato=json&dataInicial=${start}&dataFinal=${end}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return [];
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 800));
        return fetchBcbChunk(seriesCode, chunkStart, chunkEnd, attempt + 1);
      }
      throw new Error(`BCB API Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 800));
      return fetchBcbChunk(seriesCode, chunkStart, chunkEnd, attempt + 1);
    }
    console.error('Error fetching BCB data', error);
    throw error;
  }
}

// Divide o intervalo em chunks anuais para contornar o limite de registros da API do BCB
export async function fetchBcbData(
  indexType: keyof typeof BCB_SERIES,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): Promise<BcbSeriesResponse[]> {
  const seriesCode = BCB_SERIES[indexType];
  const end = parseISO(endDate);
  const allData: BcbSeriesResponse[] = [];

  let chunkStart = parseISO(startDate);

  while (!isAfter(chunkStart, end)) {
    const chunkEnd = min([subDays(addYears(chunkStart, 1), 1), end]);
    const chunk = await fetchBcbChunk(seriesCode, chunkStart, chunkEnd);
    allData.push(...chunk);
    chunkStart = addYears(chunkStart, 1);
  }

  return allData;
}
