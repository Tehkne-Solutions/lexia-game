import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <span className="text-8xl">🦉</span>
                <h1 className="font-display text-4xl text-primary">Opa!</h1>
                <p className="font-body text-lg text-muted-foreground">
                    A Corujinha não encontrou esta página...
                </p>
                
                {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                    <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="text-sm font-body text-muted-foreground">
                            Página <strong>"{pageName}"</strong> não existe.
                        </p>
                    </div>
                )}
                
                <button 
                    onClick={() => window.location.href = '/'} 
                    className="inline-flex items-center px-6 py-3 font-display text-lg text-primary-foreground 
                        bg-primary rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
                >
                    🏠 Voltar ao Início
                </button>
            </div>
        </div>
    )
}