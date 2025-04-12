import React from 'react';

// Basic mock Button component
export const Button = ({ 
  className, 
  variant = 'default', 
  size = 'default', 
  asChild = false,
  children,
  ...props 
}) => {
  const Component = asChild ? React.Children.only(children).type : 'button';
  
  return (
    <Component
      className={`storybook-button ${variant} ${size} ${className || ''}`}
      {...props}
    >
      {asChild ? React.Children.only(children).props.children : children}
    </Component>
  );
};

// Mock ButtonProps for better mocking
export const ButtonVariants = {
  default: 'default',
  destructive: 'destructive',
  outline: 'outline',
  secondary: 'secondary',
  ghost: 'ghost',
  link: 'link',
};

export default Button; 