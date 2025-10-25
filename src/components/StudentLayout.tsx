"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNavigationBar from '@/components/BottomNavigationBar';

const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 md:pb-8"> {/* Added pb-20 for bottom nav */}
        <Outlet /> {/* Renders the child routes */}
      </main>
      <BottomNavigationBar />
    </div>
  );
};

export default StudentLayout;