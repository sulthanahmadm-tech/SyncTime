import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getAnalytics } from '../../lib/api';

export const CategoryChart = ({ weekStart }: { weekStart: string }) => {
  const [data, setData] = useState<{ nama_kategori: string, warna_hex: string, total_hours: number }[]>([]);

  useEffect(() => {
    getAnalytics(weekStart).then(setData).catch(console.error);
  }, [weekStart]);

  if (data.length === 0) {
    return <div className="text-gray-500 text-sm italic py-4 text-center">Belum ada data untuk minggu ini</div>;
  }

  return (
    <div className="h-64 w-full mt-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Distribusi Waktu (Jam)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total_hours"
            nameKey="nama_kategori"
            cx="50%"
            cy="50%"
            outerRadius={60}
            innerRadius={40}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.warna_hex} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`${value} Jam`, 'Durasi']} 
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
