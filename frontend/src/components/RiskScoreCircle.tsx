import React from 'react';

interface RiskScoreCircleProps {
  score: number;
  title: string;
  description: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RiskScoreCircle: React.FC<RiskScoreCircleProps> = ({
  score,
  title,
  description,
  color = 'primary',
  size = 'md',
}) => {
  // Calculate the circle's circumference and offset based on the score
  const radius = size === 'sm' ? 35 : size === 'md' ? 45 : 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color class based on score
  const getColorClass = (score: number) => {
    if (score >= 80) return 'text-green-500 stroke-green-500';
    if (score >= 60) return 'text-yellow-500 stroke-yellow-500';
    if (score >= 40) return 'text-orange-500 stroke-orange-500';
    return 'text-red-500 stroke-red-500';
  };

  const colorClass = getColorClass(score);
  const sizeClass = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  }[size];

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClass}`}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="fill-none stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className={`fill-none ${colorClass} transition-all duration-500 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${colorClass} font-bold text-${size === 'sm' ? 'xl' : size === 'md' ? '2xl' : '3xl'}`}>
            {score.toFixed(2)}
          </span>
        </div>
      </div>
      <h3 className="mt-3 font-medium text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mt-1">{description}</p>
    </div>
  );
};

export default RiskScoreCircle; 