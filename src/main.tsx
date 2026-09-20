import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AppLoader } from './components/common/AppLoader';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLoader />
  </StrictMode>,
);

