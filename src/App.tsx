import React, { useState, useRef, useEffect } from 'react';
import { SpeakerHigh, MagicWand, Trash } from '@phosphor-icons/react';

export default function App() {
    const [currentLetter] = useState('A');
    const [word] = useState('Avião');
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [ink, setInk] = useState<number[][][]>([]); // Armazena os traços para a IA
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'pt-BR';
        window.speechSynthesis.speak(msg);
    };

    useEffect(() => {
        speak(`Desenhe a letra ${currentLetter}, de ${word}`);
    }, [currentLetter, word]);

    // Função para pegar a posição exata (Mouse ou Dedo)
    const getPos = (e: any) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Calcula a posição relativa ao tamanho interno do canvas
        return {
            x: (clientX - rect.left) * (canvasRef.current!.width / rect.width),
            y: (clientY - rect.top) * (canvasRef.current!.height / rect.height)
        };
    };

    const startDrawing = (e: any) => {
        const { x, y } = getPos(e);
        setIsDrawing(true);
        setHasContent(true);

        // Inicia novo traço: [[x], [y], [tempo]]
        setInk(prev => [...prev, [[x], [y], [Date.now()]]]);

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#4facfe';
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');

        ctx?.lineTo(x, y);
        ctx?.stroke();

        // Atualiza o último traço com novos pontos
        setInk(prev => {
            const newInk = [...prev];
            const last = newInk[newInk.length - 1];
            last[0].push(x);
            last[1].push(y);
            last[2].push(Date.now());
            return newInk;
        });
    };

    const stopDrawing = () => setIsDrawing(false);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px', backgroundColor: '#f0f9ff', minHeight: '100vh', fontFamily: 'sans-serif'
        }}>
            <h1 style={{ color: '#1e293b', marginBottom: '5px', fontSize: '2.5rem' }}>Letra {currentLetter}</h1>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '1.2rem' }}>{word}</p>

            <div style={{
                backgroundColor: 'white', borderRadius: '25px', padding: '10px',
                boxShadow: '0 15px 25px rgba(0,0,0,0.1)', border: '5px solid #4facfe'
            }}>
                <canvas
                    ref={canvasRef}
                    width={350}
                    height={350}
                    style={{ cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '25px', width: '350px' }}>
                <button
                    onClick={() => {
                        const ctx = canvasRef.current?.getContext('2d');
                        ctx?.clearRect(0, 0, 400, 400);
                        setHasContent(false);
                        setInk([]);
                    }}
                    style={{ flex: 1, padding: '15px', borderRadius: '15px', border: '2px solid #ef4444', color: '#ef4444', backgroundColor: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    <Trash size={24} />
                </button>

                <button
                    disabled={!hasContent || isProcessing}
                    style={{
                        flex: 3, padding: '15px', borderRadius: '15px', border: 'none',
                        background: hasContent ? 'linear-gradient(45deg, #4facfe, #00f2fe)' : '#cbd5e1',
                        color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                        boxShadow: hasContent ? '0 4px 10px rgba(79, 172, 254, 0.4)' : 'none'
                    }}
                >
                    <MagicWand size={24} style={{ marginRight: '8px' }} />
                    {isProcessing ? 'Mágica...' : 'AVALIAR'}
                </button>
            </div>

            <button
                onClick={() => speak(`${currentLetter} de ${word}`)}
                style={{ marginTop: '30px', background: '#fff', border: '2px solid #4facfe', borderRadius: '50%', width: '60px', height: '60px', color: '#4facfe', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <SpeakerHigh size={32} />
            </button>
        </div>
    );
}

