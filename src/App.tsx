import React from 'react';
import { UnifiedMapContainer } from './components/UnifiedMapContainer';

export const App: React.FC = () => {
  return (
    <main className="w-screen h-screen">
      <UnifiedMapContainer />
    </main>
  );
};

export default App;