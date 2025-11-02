import { render } from '@testing-library/react';

// Mock Inertia's usePage hook
const mockPage = {
  props: {
    auth: {
      user: null,
    },
    flash: {},
    errors: {},
  },
  url: '/',
  component: 'TestComponent',
  version: '1',
};

// Create a custom render function that includes common providers
export function renderWithInertia(ui, options = {}) {
  const { pageProps = {}, ...renderOptions } = options;

  // Mock usePage hook
  jest.mock('@inertiajs/react', () => ({
    ...jest.requireActual('@inertiajs/react'),
    usePage: () => ({ props: { ...mockPage.props, ...pageProps } }),
    Head: ({ children }) => children,
    Link: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
  }));

  return render(ui, renderOptions);
}

// Helper to create a mock authenticated user
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2024-01-01T00:00:00.000000Z',
    role: 'gig_worker',
    profile_picture: null,
    ...overrides,
  };
}

// Helper to create a mock job
export function createMockJob(overrides = {}) {
  return {
    id: 1,
    title: 'Test Job',
    description: 'This is a test job description',
    budget: 1000,
    duration: 30,
    experience_level: 'intermediate',
    status: 'open',
    created_at: '2024-01-01T00:00:00.000000Z',
    employer: {
      id: 2,
      name: 'Employer User',
      email: 'employer@example.com',
    },
    ...overrides,
  };
}

// Helper to create a mock bid
export function createMockBid(overrides = {}) {
  return {
    id: 1,
    job_id: 1,
    worker_id: 1,
    bid_amount: 800,
    proposal_message: 'I am interested in this job',
    status: 'pending',
    created_at: '2024-01-01T00:00:00.000000Z',
    ...overrides,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithInertia as render };

