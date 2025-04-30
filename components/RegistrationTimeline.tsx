import React from 'react';
import { Tooltip } from '@nextui-org/react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface RegistrationTimelineProps {
  currentStatus: string;
  className?: string;
}

const RegistrationTimeline: React.FC<RegistrationTimelineProps> = ({ 
  currentStatus, 
  className = "" 
}) => {
  // Define the timeline steps in order
  const timelineSteps = [
    { key: 'quotation review', label: 'Quotation Review' },
    { key: 'pending', label: 'Pending Payment' },
    { key: 'quotation accepted', label: 'Payment Submitted' },
    { key: 'waiting for approval', label: 'Processing' },
    { key: 'registered', label: 'Registered' }
  ];

  // Normalize the current status for matching
  const normalizedStatus = currentStatus.toLowerCase();
  
  // Find the current step index
  const currentStepIndex = timelineSteps.findIndex(step => 
    step.key === normalizedStatus
  );

  // Default to first step if status doesn't match any defined steps
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* The connecting line */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-default-100 z-0"></div>
        
        {/* Timeline steps */}
        {timelineSteps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isActive = index === activeIndex;
          
          return (
            <Tooltip 
              key={step.key}
              content={step.label}
              placement="top"
              delay={200}
              closeDelay={100}
            >
              <div className="z-10 relative flex items-center justify-center">
                <div 
                  className={`
                    w-3 h-3 rounded-full 
                    transition-all duration-300
                    ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${isCompleted ? 'bg-primary' : 'bg-default-200'}
                  `}
                ></div>
              </div>
            </Tooltip>
          );
        })}
      </div>
      
      {/* Current step label */}
      <div className="text-center text-xs text-primary-500 font-medium mt-4">
        <span className="px-2 py-1 bg-primary-50 rounded-full">
          {timelineSteps[activeIndex]?.label || 'Processing'}
        </span>
      </div>
    </div>
  );
};

export default RegistrationTimeline;
