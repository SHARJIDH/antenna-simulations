'use client';  // Add this at the top

import AntennaSimulationOne from '@/components/allinOne';
// import { RayleighFadingSimulation,AntennaDiversitySimulationOne } from '@/components/allinOne';
import AntennaDiversitySimulation from '@/components/antenna-diversity-simulation';
// import TestChart from '@/components/test-chart';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-black">
      <AntennaDiversitySimulation />
      {/* <RayleighFadingSimulation/>
      <AntennaDiversitySimulationOne/> */}
      <AntennaSimulationOne/>
    </main>
  );
}