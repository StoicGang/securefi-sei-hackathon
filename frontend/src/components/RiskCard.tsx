import React from 'react';
import { BarChart2, MessageSquare, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskCardProps {
  title: string;
  type: 'contract' | 'liquidity' | 'sentiment';
  score: number;
  insights: string[];
}

const RiskCard: React.FC<RiskCardProps> = ({ title, type, score, insights }) => {
  // Determine risk level and color based on score
  let riskLevel: string;
  let colorClass: string;
  let Icon: React.ElementType;
  
  if (score >= 75) {
    riskLevel = 'Low Risk';
    colorClass = 'text-risk-low';
  } else if (score >= 50) {
    riskLevel = 'Moderate Risk';
    colorClass = 'text-risk-medium';
  } else {
    riskLevel = 'High Risk';
    colorClass = 'text-risk-high';
  }
  
  // Determine icon based on type
  switch (type) {
    case 'contract':
      Icon = Shield;
      break;
    case 'liquidity':
      Icon = BarChart2;
      break;
    case 'sentiment':
      Icon = MessageSquare;
      break;
    default:
      Icon = Shield;
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 rounded-full bg-${type === 'contract' ? 'defi-blue' : type === 'liquidity' ? 'defi-teal' : 'defi-purple'}/10 flex items-center justify-center mr-3`}>
          <Icon className={`h-5 w-5 text-${type === 'contract' ? 'defi-blue' : type === 'liquidity' ? 'defi-teal' : 'defi-purple'}`} />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground/70">Risk Score</span>
          <span className={`font-medium ${colorClass}`}>
            {score}/100
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${
              score >= 75 
                ? 'bg-risk-low' 
                : score >= 50 
                  ? 'bg-risk-medium' 
                  : 'bg-risk-high'
            } rounded-full`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <div className="mt-1 text-right">
          <span className={`text-xs font-medium ${colorClass}`}>{riskLevel}</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-3">Key Insights</h4>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <div className="mt-0.5 mr-2">
                {score >= 75 ? (
                  <CheckCircle className="h-4 w-4 text-risk-low" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-risk-medium" />
                )}
              </div>
              <span className="text-sm">{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RiskCard;