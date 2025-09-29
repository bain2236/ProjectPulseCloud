import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IconButton from '../IconButton';
import { FileText } from 'lucide-react';
import { axe } from 'jest-axe';

describe('IconButton', () => {
  const mockProps = {
    href: 'https://example.com',
    label: 'Test Button',
    icon: FileText,
  };

  it('renders an accessible link with an aria-label and correct href', () => {
    render(<IconButton {...mockProps} />);
    const link = screen.getByLabelText(mockProps.label);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', mockProps.href);
  });

  it('renders the icon', () => {
    render(<IconButton {...mockProps} />);
    const link = screen.getByLabelText(mockProps.label);
    // Check that the SVG is rendered within the link
    const icon = link.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<IconButton {...mockProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
