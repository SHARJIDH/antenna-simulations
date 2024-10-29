'use client';  // Add this at the top

import AntennaDiversitySimulation from '@/components/antenna-diversity-simulation';
// import TestChart from '@/components/test-chart';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-black">
      <AntennaDiversitySimulation />
      {/* <TestChart/> */}
    </main>
  );
}