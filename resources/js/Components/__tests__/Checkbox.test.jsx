import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('is unchecked by default', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('can be checked via checked prop', () => {
    render(<Checkbox checked onChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onChange handler when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('toggles checked state when clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('can be disabled', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Checkbox disabled onChange={handleChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('accepts custom className', () => {
    render(<Checkbox className="custom-checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-checkbox');
  });

  it('applies default styling classes', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('rounded');
    expect(checkbox).toHaveClass('border-gray-300');
    expect(checkbox).toHaveClass('text-indigo-600');
  });

  it('accepts name prop', () => {
    render(<Checkbox name="terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('name', 'terms');
  });

  it('accepts value prop', () => {
    render(<Checkbox value="accepted" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('value', 'accepted');
  });
});

