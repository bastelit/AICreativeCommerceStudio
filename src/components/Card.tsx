// src/components/Card.jsx
import React from 'react';

// 1. Define a 'type' for the component's props.
// This tells TypeScript what kind of data to expect for each prop.
type CardProps = {
  title: string;
  icon: React.ReactNode;
  step: number;
  children: React.ReactNode;
};

// 2. Apply the type to your component using React.FC (Functional Component).
const Card: React.FC<CardProps> = ({ title, icon, step, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-6 border-b border-gray-200">
        <h3 className="flex items-center text-lg font-semibold text-gray-800">
          <span className="flex items-center justify-center w-8 h-8 mr-4 bg-indigo-100 text-indigo-600 rounded-full font-bold">{step}</span>
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;