import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import Login from './Login';
import * as AuthContext from '../lib/AuthContext';
import { getMockAuthContext } from '../utils/testFactories';

// Fazemos um mock global do módulo de Autenticação para não batermos na API do Supabase real
vi.mock('../lib/AuthContext', async () => {
    const actual = await vi.importActual('../lib/AuthContext');
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(actual as any),
        useAuth: vi.fn(),
    };
});

describe('Componente de Autenticação (Login)', () => {
    const mockSignIn = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Injetamos a Factory que retorna o signIn falso sempre que a página chamar o useAuth()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (AuthContext.useAuth as unknown as any).mockReturnValue(
            getMockAuthContext({ signIn: mockSignIn })
        );
    });

    describe('Renderização e Comportamento Visual', () => {
        it('deve esconder e mostrar a senha se o botão de Olho for pressionado', () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('seu@email.com');
            const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

            expect(emailInput).toBeInTheDocument();
            expect(passwordInput).toBeInTheDocument();

            // Inicialmente é do tipo "password" (escondido)
            expect(passwordInput.type).toBe('password');

            // Encontra e clica no botão com comportamento de view (não possui d-id mas está adjacente, podemos procurar globalmente por button com svg)
            // Como não criamos um testId, podemos buscar pelo tipo de botão na árvore (só há dois: submit e o de ver senha)
            const buttons = screen.getAllByRole('button');
            const toggleHideBtn = buttons.find(b => (b as HTMLButtonElement).type === 'button');

            if (toggleHideBtn) {
                fireEvent.click(toggleHideBtn);
                // Após clicar, a senha vira string visível
                expect(passwordInput.type).toBe('text');

                fireEvent.click(toggleHideBtn);
                // Após clicar de novo, esconde novamente
                expect(passwordInput.type).toBe('password');
            }
        });

        it('deve desabilitar o botão e mostrar Loading ao tentar submeter', async () => {
            mockSignIn.mockResolvedValueOnce({ error: null }); // Mock que simula que a chamada na rede demorará (promessa não resolvida se pendermos, mas como é síncrono no test environment, vamos confiar no estado imediatamente setado)
            renderWithProviders(<Login />);

            // O botão de Submit é do `type=submit` e possui texto "Entrar" inicialmente.
            const submitBtn = screen.getByRole('button', { name: /entrar/i });

            // Simulando preenchimento do Form (é required nativo do HTML)
            fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'teste@attos.com' } });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'minhasenha123' } });

            fireEvent.click(submitBtn);

            // Espera-se que o próprio botão exiba o texto de Loading "Entrando..."
            expect(screen.getByText(/entrando\.\.\./i)).toBeInTheDocument();
            expect(submitBtn).toBeDisabled();
        });
    });

    describe('Regras de Tratamento de Erro (Mocking)', () => {
        it('deve disparar erro visual em caso de senha incorreta enviada pela Fake API', async () => {
            mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
            renderWithProviders(<Login />);

            fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'teste@attos.com' } });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senhainvalida' } });

            fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

            // Aguarda até que o componente detecte o erro na Promise
            await waitFor(() => {
                expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
            });
        });
    });
});
