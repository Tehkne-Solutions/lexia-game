import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawn, setDrawn] = useState(false);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.strokeStyle = 'black';
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
                setDrawn(true);
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const validateDrawing = () => {
        if (drawn) {
            setValidated(true);
            // Play TTS for 'A'
            const utterance = new SpeechSynthesisUtterance('A');
            utterance.lang = 'pt-BR'; // Brazilian Portuguese
            speechSynthesis.speak(utterance);
            // Here, in full implementation, check if it's 'A' using HWR
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setDrawn(false);
            }
        }
    };

    return (
        <div className="app">
            <h1>Lexia Game</h1>
            {!validated ? (
                <div className="scene">
                    <p>O Guardião precisa de ajuda para ler o mapa. Desenhe a letra "A" para iluminar o caminho!</p>
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={300}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                    <div>
                        <button onClick={validateDrawing} disabled={!drawn}>Validar Desenho</button>
                        <button onClick={clearCanvas}>Limpar</button>
                    </div>
                </div>
            ) : (
                <div className="success">
                    <p>Parabéns! Você iluminou o caminho. O Guardião pode continuar!</p>
                    <p>🎉 Selo conquistado!</p>
                </div>
            )}
        </div>
    );
}

export default App;