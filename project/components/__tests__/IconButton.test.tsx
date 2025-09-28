import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IconButton from '../IconButton';
import { FileText } from 'lucide-react';

describe('IconButton', () => {
  const mockProps = {
    href: 'https://example.com',
    label: 'Test Button',
    icon: FileText,
  };

  it('renders a link with the correct href', () => {
    render(<IconButton {...mockProps} />);
    const link = screen.getByRole('link', { name: /Test Button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', mockProps.href);
  });

  it('renders the label and icon', () => {
    render(<IconButton {...mockProps} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
    // Check if the icon's parent container is there
    const icon = document.querySelector('.lucide-file-text');
    expect(icon).toBeInTheDocument();
  });
});
