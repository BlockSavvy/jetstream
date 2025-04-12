import React from 'react';

// Add React to window globally
if (typeof window !== 'undefined') {
  window.React = React;
}

// Add a decorator to inject React into the component's scope
export const withReactDecorator = (Story) => {
  return (
    <React.Fragment>
      <Story />
    </React.Fragment>
  );
};

// Mock Next.js router
export const withRouter = (Story) => {
  return (
    <div>
      <Story />
    </div>
  );
};

// Process env variables 
export const processEnvFix = () => {
  if (typeof window !== 'undefined') {
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  }
}

// Call the process env fix
processEnvFix();

export { React }; 