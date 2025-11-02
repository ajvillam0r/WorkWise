import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('renders an input element', () => {
    render(<TextInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies default type as text', () => {
    render(<TextInput />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('accepts custom type prop', () => {
    render(<TextInput type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('accepts value prop', () => {
    render(<TextInput value="test value" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  it('calls onChange handler when value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<TextInput onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts custom className', () => {
    render(<TextInput className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('applies default styling classes', () => {
    render(<TextInput />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border-gray-300');
  });

  it('focuses input when isFocused is true', () => {
    render(<TextInput isFocused />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  it('exposes focus method via ref', () => {
    const ref = createRef();
    render(<TextInput ref={ref} />);
    
    ref.current.focus();
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  it('accepts placeholder prop', () => {
    render(<TextInput placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<TextInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});

