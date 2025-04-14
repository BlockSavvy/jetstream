import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { 
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';

/**
 * The Accordion component is used to display collapsible content panels.
 * It's useful for grouping and hiding content to make interfaces more compact.
 */
const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'radio',
      options: ['single', 'multiple'],
      description: 'Controls whether one or multiple items can be opened at once',
    },
    collapsible: {
      control: 'boolean',
      description: 'When type is "single", allows closing content when clicking the trigger for an open item',
    },
    defaultValue: {
      control: 'text',
      description: 'The value of the item to expand by default (controlled)',
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default accordion with single selection mode
 */
export const SingleSelection: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the other components.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'single',
    collapsible: true,
  },
};

/**
 * Accordion with multiple selection mode
 */
export const MultipleSelection: Story = {
  render: () => (
    <Accordion type="multiple" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          This is the first section content. Multiple sections can be open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>
          This is the second section content. Try opening multiple sections.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third section</AccordionTrigger>
        <AccordionContent>
          This is the third section content. Each section can be opened independently.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'multiple',
  },
};

/**
 * Accordion with default open item
 */
export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-2" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          This is the first section content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second section (default open)</AccordionTrigger>
        <AccordionContent>
          This section is open by default because we set defaultValue="item-2".
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third section</AccordionTrigger>
        <AccordionContent>
          This is the third section content.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'single',
    collapsible: true,
    defaultValue: 'item-2',
  },
};

/**
 * Accordion with custom styling
 */
export const CustomStyling: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1" className="border-b-0 mb-2">
        <AccordionTrigger className="bg-blue-100 dark:bg-blue-900/30 rounded-md px-4 py-3 hover:no-underline hover:bg-blue-200 dark:hover:bg-blue-900/50">
          Custom styled trigger
        </AccordionTrigger>
        <AccordionContent className="px-4">
          This accordion has custom styling applied to the triggers and items.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="border-b-0 mb-2">
        <AccordionTrigger className="bg-purple-100 dark:bg-purple-900/30 rounded-md px-4 py-3 hover:no-underline hover:bg-purple-200 dark:hover:bg-purple-900/50">
          Another custom trigger
        </AccordionTrigger>
        <AccordionContent className="px-4">
          You can customize the appearance to match your design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" className="border-b-0">
        <AccordionTrigger className="bg-green-100 dark:bg-green-900/30 rounded-md px-4 py-3 hover:no-underline hover:bg-green-200 dark:hover:bg-green-900/50">
          Yet another custom trigger
        </AccordionTrigger>
        <AccordionContent className="px-4">
          The styling is very flexible using Tailwind CSS classes.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'single',
    collapsible: true,
  },
};

/**
 * Accordion with nested content
 */
export const NestedContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section with list</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc pl-5 space-y-1">
            <li>First item in the list</li>
            <li>Second item in the list</li>
            <li>Third item with some <a href="#" className="text-blue-500 hover:underline">nested link</a></li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section with form elements</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-md" placeholder="Enter your email" />
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Submit</button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  args: {
    type: 'single',
    collapsible: true,
  },
}; 