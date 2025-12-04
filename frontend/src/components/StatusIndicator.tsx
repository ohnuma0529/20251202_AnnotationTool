import React from 'react';

interface StatusIndicatorProps {
    status: 'idle' | 'loading' | 'processing' | 'saving' | 'error';
    message?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, message }) => {
    if (status === 'idle') return null;

    let bgColor = 'bg-blue-600';
    let icon = (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    if (status === 'error') {
        bgColor = 'bg-red-600';
        icon = (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        );
    } else if (status === 'saving') {
        bgColor = 'bg-green-600';
    }

    const isWorking = status === 'loading' || status === 'processing' || status === 'saving';

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg flex items-center z-50 transition-all duration-300`}>
            {isWorking && icon}
            {status === 'error' && icon}
            <span className="font-medium">{message || status.toUpperCase()}</span>
        </div>
    );
};

export default StatusIndicator;
