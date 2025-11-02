import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimaryButton from '../PrimaryButton';

describe('PrimaryButton', () => {
  it('renders with children text', () => {
    render(<PrimaryButton>Click Me</PrimaryButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies disabled attribute when disabled prop is true', () => {
    render(<PrimaryButton disabled>Disabled Button</PrimaryButton>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('applies opacity class when disabled', () => {
    render(<PrimaryButton disabled>Disabled Button</PrimaryButton>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toHaveClass('opacity-25');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick}>Click Me</PrimaryButton>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(
      <PrimaryButton disabled onClick={handleClick}>
        Disabled Button
      </PrimaryButton>
    );
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('accepts custom className', () => {
    render(<PrimaryButton className="custom-class">Button</PrimaryButton>);
    const button = screen.getByRole('button', { name: /button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('applies default styling classes', () => {
    render(<PrimaryButton>Styled Button</PrimaryButton>);
    const button = screen.getByRole('button', { name: /styled button/i });
    expect(button).toHaveClass('bg-gray-800');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('rounded-md');
  });
});

