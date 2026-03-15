import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfileCard from '../ProfileCard';
import { Profile } from '@/lib/types';
import React from 'react';
import { axe } from 'jest-axe';


describe('ProfileCard', () => {
  const mockProfile: Profile = {
    slug: "alex-bainbridge",
    displayName: "Alex Bainbridge",
    public: true,
    theme: "neon-dark",
    createdAt: "2025-09-18T00:00:00Z",
    bio: "Full-stack engineer passionate about building beautiful, accessible experiences.",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200",
    location: "United Kingdom",
    website: "https://alex.dev",
    links: [
      {
        label: "CV",
        url: "https://github.com/your-username/your-cv-repo"
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/your-profile/"
      }
    ]
  };

  it('renders the profile display name', () => {
    render(<ProfileCard profile={mockProfile} />)
    expect(screen.getByText(mockProfile.displayName)).toBeInTheDocument()
  })

  it('renders the profile bio', () => {
    render(<ProfileCard profile={mockProfile} />)
    expect(screen.getByText(mockProfile.bio!)).toBeInTheDocument()
  })

  it('renders the profile location', () => {
    render(<ProfileCard profile={mockProfile} />)
    expect(screen.getByText(mockProfile.location!)).toBeInTheDocument()
  })

  it('renders the profile website', () => {
    render(<ProfileCard profile={mockProfile} />)
    const websiteLink = screen.getByText(mockProfile.website!);
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest('a')).toHaveAttribute('href', mockProfile.website);
  })

  it('renders icon buttons and shows a tooltip on hover', async () => {
    render(<ProfileCard profile={mockProfile} />);

    // Check for each link via its accessible name (aria-label)
    mockProfile.links?.forEach(link => {
      const linkEl = screen.getByLabelText(link.label!);
      expect(linkEl).toBeInTheDocument();
      expect(linkEl).toHaveAttribute('href', link.url);
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<ProfileCard profile={mockProfile} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
})
