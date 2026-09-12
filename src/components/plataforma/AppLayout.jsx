import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

// Adaptado de `AdminLayout.jsx` del proyecto anterior (idéntico, solo se le
// quitó el prop `isAdmin` que Header nunca llegó a usar).
const AppLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
