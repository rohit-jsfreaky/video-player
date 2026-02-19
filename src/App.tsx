import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/app/providers/AppProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
