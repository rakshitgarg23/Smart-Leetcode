import { useMemo } from 'react';

const COLOR_MAP = {
  'green': 'bg-green-500',
  'greenish-yellow': 'bg-lime-400',
  'yellow': 'bg-yellow-400',
  'red': 'bg-red-500',
};

const getTooltipText = (color, totalSubmissions) => {
  const count = totalSubmissions || 0;
  const submissionsText = `${count} submission${count !== 1 ? 's' : ''}`;
  let statusText = 'No activity';
  
  if (color === 'green') statusText = 'Flawless (0 hints)';
  else if (color === 'greenish-yellow') statusText = 'Accepted (1 hint)';
  else if (color === 'yellow') statusText = 'Accepted (2-3 hints)';
  else if (color === 'red') statusText = 'Struggled (4+ hints or not accepted)';

  return count > 0 ? `${statusText} • ${submissionsText}` : statusText;
};

const Heatmap = ({ data }) => {
  // Generate the last 365 days
  const days = useMemo(() => {
    const dataMap = new Map();
    if (data) {
      data.forEach(item => dataMap.set(item.date, item));
    }

    const today = new Date();
    const result = [];
    
    // Create an array of exactly 365 days ending on today
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = dataMap.get(dateStr);
      result.push({
        date: dateStr,
        color: dayData?.color || null,
        totalSubmissions: dayData?.totalSubmissions || 0
      });
    }
    return result;
  }, [data]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Contribution Heatmap</h3>
      
      <div className="overflow-x-auto pb-4 pt-8">
        <div 
          className="grid gap-1"
          style={{
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gridAutoFlow: 'column',
            gridAutoColumns: 'min-content'
          }}
        >
          {days.map((day, idx) => {
            const bgClass = day.color ? COLOR_MAP[day.color] : 'bg-gray-700';
            const tooltipText = `${day.date}: ${getTooltipText(day.color, day.totalSubmissions)}`;
            
            return (
              <div 
                key={day.date}
                className={`w-4 h-4 rounded-sm cursor-pointer hover:opacity-75 transition-opacity ${bgClass} group relative`}
              >
                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-gray-200 text-xs py-1 px-2 rounded whitespace-nowrap border border-gray-600 shadow-xl">
                    {tooltipText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end space-x-3 text-sm text-gray-400">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-gray-700"></div>
        <div className="w-4 h-4 rounded-sm bg-red-500" title="Struggled"></div>
        <div className="w-4 h-4 rounded-sm bg-yellow-400" title="2 Hints"></div>
        <div className="w-4 h-4 rounded-sm bg-lime-400" title="1 Hint"></div>
        <div className="w-4 h-4 rounded-sm bg-green-500" title="Flawless"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
