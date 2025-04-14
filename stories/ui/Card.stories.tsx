import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Card component for containing content and actions in a box.
 * Provides consistent styling and layout for card-based UIs.
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with title, description, content and footer
 */
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with form-like structure
 */
export const SignUpCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="name">Name</label>
            <input id="name" placeholder="Your name" className="p-2 border rounded-md" />
          </div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="email">Email</label>
            <input id="email" placeholder="Your email" className="p-2 border rounded-md" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Submit</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with minimal styling, just content
 */
export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>This is a simple card with only content and no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card used as a notification or alert
 */
export const NotificationCard: Story = {
  render: () => (
    <Card className="w-[350px] border-blue-500 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-700">Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-blue-600">This is an informational notification card.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="text-blue-600 border-blue-600">Dismiss</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with image
 */
export const MediaCard: Story = {
  render: () => (
    <Card className="w-[350px] overflow-hidden">
      <div className="h-[200px] bg-gray-300 flex items-center justify-center">
        <span className="text-gray-500">Image Placeholder</span>
      </div>
      <CardHeader>
        <CardTitle>Media Card</CardTitle>
        <CardDescription>Card with image/media content</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card includes an image or media content at the top.</p>
      </CardContent>
      <CardFooter>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  ),
}; 