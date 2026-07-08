import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, subMonths, addMonths, subYears, addYears, parseISO, isValid } from 'date-fns';
import {
    getTransactions,
    getPayees,
    getProjects,
    getClassifications,
    getBalance,
    deleteTransaction,
} from '../lib/api';
import { Transaction, Payee, Project, Classification, DateFilterState, DateFilterMode, DatePresetKey } from '../types';
import { resolveDateRange, validateDateFilter } from '../utils/dateFilter';


export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [balanceData, setBalanceData] = useState<Record<string, unknown> | null>(null);

    // Persistência do filtro na URL. `searchParams` já reflete a URL de carregamento
    // desde o primeiro render, então os estados abaixo são hidratados de forma "lazy"
    // (sem efeito pós-montagem) para evitar um fetch inicial com valores padrão
    // seguido de um segundo fetch corrigido.
    const [searchParams, setSearchParams] = useSearchParams();
    const initialMode: DateFilterMode = (searchParams.get('mode') as DateFilterMode | null) ?? 'mes';

    const [currentDate, setCurrentDate] = useState(() => {
        if (initialMode === 'mes') {
            const vm = searchParams.get('viewMode');
            const resolvedViewMode = vm === 'year' ? 'year' : 'month';
            const dataParam = searchParams.get('data');
            if (dataParam) {
                const parsed =
                    resolvedViewMode === 'year' ? parseISO(`${dataParam}-01-01`) : parseISO(`${dataParam}-01`);
                if (isValid(parsed)) return parsed;
            }
        }
        return new Date();
    });
    const [viewMode, setViewMode] = useState<'month' | 'year'>(() =>
        searchParams.get('viewMode') === 'year' ? 'year' : 'month',
    );

    // Filtro de datas (seletor de período no topo da página)
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>(initialMode);
    const [selectedDay, setSelectedDay] = useState(() => {
        if (initialMode === 'dia') {
            const dia = searchParams.get('dia');
            if (dia && isValid(parseISO(dia))) return dia;
        }
        return format(new Date(), 'yyyy-MM-dd');
    });
    const [periodStart, setPeriodStart] = useState(() =>
        initialMode === 'periodo' ? searchParams.get('inicio') || '' : '',
    );
    const [periodEnd, setPeriodEnd] = useState(() =>
        initialMode === 'periodo' ? searchParams.get('fim') || '' : '',
    );
    const [activePreset, setActivePreset] = useState<DatePresetKey | null>(() => {
        if (initialMode === 'periodo') {
            const preset = searchParams.get('preset') as DatePresetKey | null;
            return preset && preset !== 'personalizado' ? preset : null;
        }
        return null;
    });
    const [dateFilterError, setDateFilterError] = useState<string | null>(null);

    // Filtros de coluna (client-side, aplicados sobre transactions já buscadas)
    const [filterDay, setFilterDay] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [filterPayee, setFilterPayee] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterClassification, setFilterClassification] = useState('');
    const [filterAmount, setFilterAmount] = useState('');

    const localizacao = 'Brasília - DF';

    const dateFilterState: DateFilterState = useMemo(
        () => ({
            mode: dateFilterMode,
            selectedDay,
            periodStart,
            periodEnd,
            activePreset,
            monthDate: currentDate,
            monthViewMode: viewMode,
        }),
        [dateFilterMode, selectedDay, periodStart, periodEnd, activePreset, currentDate, viewMode],
    );

    const handleDateFilterChange = (next: DateFilterState) => {
        setDateFilterMode(next.mode);
        setSelectedDay(next.selectedDay);
        setPeriodStart(next.periodStart);
        setPeriodEnd(next.periodEnd);
        setActivePreset(next.activePreset);
        setViewMode(next.monthViewMode);
    };

    const dateRange = useMemo(() => resolveDateRange(dateFilterState), [dateFilterState]);

    const fetchData = async () => {
        const validationError = validateDateFilter(dateFilterState);
        setDateFilterError(validationError);
        if (validationError) {
            setTransactions([]);
            setBalanceData(null);
            return;
        }

        const [txns, balance] = await Promise.all([getTransactions(dateRange), getBalance(dateRange)]);
        setTransactions(txns);
        setBalanceData(balance);
    };

    // Listas de apoio (favorecidos/projetos/classificações) só precisam ser buscadas
    // uma vez — não dependem do período filtrado.
    useEffect(() => {
        getPayees().then(setPayees);
        getProjects().then(setProjects);
        getClassifications().then(setClassifications);
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange.dataInicio, dateRange.dataFim]);

    // Escreve o filtro ativo na URL a cada mudança (inclui a primeira renderização,
    // o que é inofensivo pois o estado já nasce hidratado a partir da própria URL).
    useEffect(() => {
        const params: Record<string, string> = { mode: dateFilterMode };
        if (dateFilterMode === 'dia') {
            params.dia = selectedDay;
        } else if (dateFilterMode === 'periodo') {
            params.inicio = periodStart;
            params.fim = periodEnd;
            if (activePreset) params.preset = activePreset;
        } else {
            params.viewMode = viewMode;
            params.data = viewMode === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'yyyy-MM');
        }
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFilterMode, selectedDay, periodStart, periodEnd, activePreset, viewMode, currentDate]);

    const handlePrev = () => {
        setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subYears(currentDate, 1));
    };

    const handleNext = () => {
        setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addYears(currentDate, 1));
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir este lançamento?')) {
            await deleteTransaction(id);
            fetchData();
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const filteredTransactions = transactions.filter((t) => {
        let match = true;
        if (filterDay || filterMonth || filterYear) {
            const [y, m, d] = t.date.split('-');
            if (filterYear && filterYear !== y) match = false;
            if (filterMonth && filterMonth !== m) match = false;
            if (filterDay && filterDay !== d) match = false;
        }
        if (filterDescription && !t.description.toLowerCase().includes(filterDescription.toLowerCase()))
            match = false;
        if (filterPayee) {
            const payeeName = t.payee_name || '';
            if (!payeeName.toLowerCase().includes(filterPayee.toLowerCase())) match = false;
        }
        if (filterProject) {
            const projectName = t.project_name || '';
            if (!projectName.toLowerCase().includes(filterProject.toLowerCase())) match = false;
        }
        if (filterClassification) {
            const className = t.classification_name || '';
            if (!className.toLowerCase().includes(filterClassification.toLowerCase())) match = false;
        }
        if (filterAmount) {
            const amountStr = Math.abs(t.amount).toString();
            const formattedAmount = formatCurrency(Math.abs(t.amount)).replace(/[R$\s]/g, '');
            if (!amountStr.includes(filterAmount) && !formattedAmount.includes(filterAmount)) match = false;
        }
        return match;
    });

    const clearFilters = () => {
        setFilterDay('');
        setFilterMonth('');
        setFilterYear('');
        setFilterDescription('');
        setFilterPayee('');
        setFilterProject('');
        setFilterClassification('');
        setFilterAmount('');
    };

    return {
        transactions,
        payees,
        projects,
        classifications,
        currentDate,
        setCurrentDate,
        viewMode,
        setViewMode,
        balanceData,
        localizacao,

        // Filtro de datas (novo)
        dateFilterState,
        dateFilterError,
        handleDateFilterChange,

        // Filters
        filterDay, setFilterDay,
        filterMonth, setFilterMonth,
        filterYear, setFilterYear,
        filterDescription, setFilterDescription,
        filterPayee, setFilterPayee,
        filterProject, setFilterProject,
        filterClassification, setFilterClassification,
        filterAmount, setFilterAmount,

        filteredTransactions,
        clearFilters,

        // Actions
        fetchData,
        handlePrev,
        handleNext,
        handleDelete,
        formatCurrency,
    };
}
