import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function FallbackView2D() {
  const { 
    uavTrueState, uavSecurityState, targetAltitude, setTargetAltitude, 
    activeAttack, setActiveAttack, memoryCapacity, memorySize 
  } = useAppStore();

  const [announcement, setAnnouncement] = useState('');

  // Announce security events to screen readers
  useEffect(() => {
    if (uavSecurityState.underAttack) {
      setAnnouncement(`ALERT: Cyber-physical anomaly detected. Type: ${uavSecurityState.attackType}. Mitigation active.`);
    } else {
      setAnnouncement(`Status nominal. Altitude ${uavTrueState?.position.z.toFixed(2) || 0} meters.`);
    }
  }, [uavSecurityState.underAttack, uavSecurityState.attackType]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-zinc-900 text-zinc-100 min-h-screen">
      <header>
        <h1 className="text-3xl font-bold border-b border-zinc-700 pb-2">Research Dashboard (High-Contrast / Non-Visual Mirror)</h1>
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </header>

      <section aria-labelledby="uav-section">
        <h2 id="uav-section" className="text-xl font-semibold mb-4">6-DOF UAV Telemetry & Security</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-800 p-6 rounded-lg shadow-md border border-zinc-700">
            <h3 className="font-bold mb-3 text-zinc-300">Kinematic State</h3>
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Current UAV Position and Velocity</caption>
              <tbody>
                <tr className="border-b border-zinc-700">
                  <th scope="row" className="py-2">Altitude (Z)</th>
                  <td className="py-2 tabular-nums">{uavTrueState?.position.z.toFixed(2) || '0.00'} m</td>
                </tr>
                <tr className="border-b border-zinc-700">
                  <th scope="row" className="py-2">Velocity (Z)</th>
                  <td className="py-2 tabular-nums">{uavTrueState?.velocity.z.toFixed(2) || '0.00'} m/s</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-800 p-6 rounded-lg shadow-md border border-zinc-700">
            <h3 className="font-bold mb-3 text-zinc-300">Security EKF Status</h3>
            <table className="w-full text-left border-collapse">
               <caption className="sr-only">Security and Spoofing Detection Status</caption>
               <tbody>
                 <tr className="border-b border-zinc-700">
                  <th scope="row" className="py-2">Threat Level</th>
                  <td className="py-2">
                    {uavSecurityState.underAttack 
                      ? <span className="text-red-400 font-bold">CRITICAL ({uavSecurityState.attackType})</span>
                      : <span className="text-green-400">NOMINAL</span>}
                  </td>
                </tr>
                <tr className="border-b border-zinc-700">
                  <th scope="row" className="py-2">Anomaly Score</th>
                  <td className="py-2 tabular-nums">{uavSecurityState.anomalyScore.toFixed(3)}</td>
                </tr>
               </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button 
            className="px-6 py-3 bg-zinc-100 text-zinc-900 font-bold rounded min-w-[200px] hover:bg-zinc-300 focus:outline-none focus:ring-4 focus:ring-blue-500"
            onClick={() => setTargetAltitude(targetAltitude + 5)}
            aria-label={`Increase target altitude by 5 meters. Current is ${targetAltitude}`}
          >
            Ascend (+5m)
          </button>
          
          <button 
            className="px-6 py-3 bg-red-800 text-white font-bold rounded min-w-[200px] hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-blue-500"
            onClick={() => setActiveAttack(activeAttack === 'NONE' ? 'GPS_DRIFT' : 'NONE')}
            aria-pressed={activeAttack === 'GPS_DRIFT'}
          >
            {activeAttack === 'GPS_DRIFT' ? 'Neutralize GPS Drift' : 'Inject GPS Drift'}
          </button>
        </div>
      </section>

      <section aria-labelledby="memory-section" className="mt-12">
        <h2 id="memory-section" className="text-xl font-semibold mb-4">Algorithmic Memory Allocation</h2>
        <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
           <p className="text-lg">
             <span className="font-bold">Allocated Block Capacity:</span> {memoryCapacity} elements
           </p>
           <p className="text-lg mt-2">
             <span className="font-bold">Used Size:</span> {memorySize} elements
           </p>
           
           <div className="w-full bg-zinc-900 h-6 mt-4 rounded overflow-hidden border border-zinc-600" role="progressbar" aria-label="Memory Allocation Progress" aria-valuenow={(memorySize/memoryCapacity)*100} aria-valuemin={0} aria-valuemax={100}>
             <div className="bg-blue-500 h-full" style={{ width: `${(memorySize/memoryCapacity)*100}%` }}></div>
           </div>
        </div>
      </section>
    </div>
  );
}
