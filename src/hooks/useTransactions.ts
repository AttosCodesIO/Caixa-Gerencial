import { useState, useEffect } from 'react';
import { format, subMonths, addMonths, subYears, addYears } from 'date-fns';
import {
    getTransactions,
    getPayees,
    getProjects,
    getClassifications,
    getBalance,
    deleteTransaction,
} from '../lib/api';
import { Transaction, Payee, Project, Classification } from '../types';


export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [classifications, setClassifications] = useState<Classification[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [balanceData, setBalanceData] = useState<Record<string, unknown> | null>(null);

    // Filtros
    const [filterDay, setFilterDay] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [filterPayee, setFilterPayee] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterClassification, setFilterClassification] = useState('');
    const [filterAmount, setFilterAmount] = useState('');

    const localizacao = 'Brasília - DF';

    const periodStr = viewMode === 'month' ? format(currentDate, 'yyyy-MM') : format(currentDate, 'yyyy');

    const fetchData = async () => {
        const [txns, balance] = await Promise.all([getTransactions(periodStr), getBalance(periodStr)]);
        setTransactions(txns);
        setBalanceData(balance);
    };

    useEffect(() => {
        fetchData();
        getPayees().then(setPayees);
        getProjects().then(setProjects);
        getClassifications().then(setClassifications);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodStr]);

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
