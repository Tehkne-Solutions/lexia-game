import { useState } from 'react';

function App() {
    const [currentLetter, setCurrentLetter] = useState('A');

    return React.createElement('div', { style: { padding: '20px', fontFamily: 'Arial, sans-serif' } },
        React.createElement('h1', null, 'Lexia Game - Test'),
        React.createElement('p', null, 'Current Letter: ', React.createElement('strong', null, currentLetter)),
        React.createElement('button', { onClick: () => setCurrentLetter('B') }, 'Next Letter')
    );
}

export default App;
