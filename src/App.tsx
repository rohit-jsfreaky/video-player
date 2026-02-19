import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/app/providers/AppProvider';
import { router } from '@/app/router';
import './App.css';

const App = () => {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
};

export default App;
