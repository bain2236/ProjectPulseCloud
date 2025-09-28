import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfileCard from '../ProfileCard';
import { Profile } from '@/lib/types';

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
    expect(screen.getByText(mockProfile.bio)).toBeInTheDocument()
  })

  it('renders the profile location', () => {
    render(<ProfileCard profile={mockProfile} />)
    expect(screen.getByText(mockProfile.location)).toBeInTheDocument()
  })

  it('renders the profile website', () => {
    render(<ProfileCard profile={mockProfile} />)
    const websiteLink = screen.getByText(mockProfile.website);
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest('a')).toHaveAttribute('href', mockProfile.website);
  })

  it('renders the profile links', () => {
    render(<ProfileCard profile={mockProfile} />)
    const cvLink = screen.getByRole('link', { name: /CV/i });
    const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });

    expect(cvLink).toBeInTheDocument();
    expect(cvLink).toHaveAttribute('href', mockProfile.links[0].url);

    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute('href', mockProfile.links[1].url);
  })
})
