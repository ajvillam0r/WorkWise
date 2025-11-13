import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploadInput from '../FileUploadInput';

describe('FileUploadInput', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    it('renders with label', () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                onChange={mockOnChange}
            />
        );
        expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    it('shows required indicator when required prop is true', () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                required={true}
                onChange={mockOnChange}
            />
        );
        expect(screen.getByText(/Upload File \*/)).toBeInTheDocument();
    });

    it('displays help text when provided', () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                helpText="Maximum file size is 5MB"
                onChange={mockOnChange}
            />
        );
        expect(screen.getByText('Maximum file size is 5MB')).toBeInTheDocument();
    });

    it('validates file size and shows error for oversized files', async () => {
        const { container } = render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                maxSize={1}
                onChange={mockOnChange}
            />
        );

        // Create a file larger than 1MB
        const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', {
            type: 'text/plain',
        });

        const input = container.querySelector('input[type="file"]');
        
        // Manually trigger the onChange with the file
        Object.defineProperty(input, 'files', {
            value: [largeFile],
            writable: false,
        });
        fireEvent.change(input);

        await waitFor(() => {
            expect(screen.getByText(/exceeds maximum allowed size/i)).toBeInTheDocument();
        });
        expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('validates file type and shows error for invalid types', async () => {
        const { container } = render(
            <FileUploadInput
                name="test-file"
                label="Upload Image"
                accept="image/*"
                onChange={mockOnChange}
            />
        );

        const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

        const input = container.querySelector('input[type="file"]');
        
        // Manually trigger the onChange with the file
        Object.defineProperty(input, 'files', {
            value: [textFile],
            writable: false,
        });
        fireEvent.change(input);

        await waitFor(() => {
            expect(screen.getByText(/File type not accepted/i)).toBeInTheDocument();
        });
        expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('accepts valid file and calls onChange', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <FileUploadInput
                name="test-file"
                label="Upload Image"
                accept="image/*"
                maxSize={5}
                onChange={mockOnChange}
            />
        );

        const imageFile = new File(['image content'], 'test.jpg', {
            type: 'image/jpeg',
        });

        const input = container.querySelector('input[type="file"]');
        await user.upload(input, imageFile);

        await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalledWith(imageFile);
        });
    });

    it('displays file name and size after selection', async () => {
        const imageFile = new File(['x'.repeat(1024)], 'photo.jpg', {
            type: 'image/jpeg',
        });

        render(
            <FileUploadInput
                name="test-file"
                label="Upload Image"
                accept="image/*"
                preview="image"
                value={imageFile}
                previewUrl="blob:http://localhost/test"
                onChange={mockOnChange}
            />
        );

        expect(screen.getByText('photo.jpg')).toBeInTheDocument();
        expect(screen.getByText(/KB/)).toBeInTheDocument();
    });

    it('shows image preview when preview prop is image', () => {
        const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        const previewUrl = 'blob:http://localhost/test';

        render(
            <FileUploadInput
                name="test-file"
                label="Upload Image"
                preview="image"
                value={imageFile}
                previewUrl={previewUrl}
                onChange={mockOnChange}
            />
        );

        const img = screen.getByAltText('Preview');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', previewUrl);
    });

    it('shows document icon when preview prop is document', () => {
        const pdfFile = new File(['pdf content'], 'document.pdf', {
            type: 'application/pdf',
        });

        render(
            <FileUploadInput
                name="test-file"
                label="Upload Document"
                preview="document"
                value={pdfFile}
                previewUrl="blob:http://localhost/test"
                onChange={mockOnChange}
            />
        );

        expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('clears file when clear button is clicked', async () => {
        const user = userEvent.setup();
        const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

        render(
            <FileUploadInput
                name="test-file"
                label="Upload Image"
                preview="image"
                value={imageFile}
                previewUrl="blob:http://localhost/test"
                onChange={mockOnChange}
            />
        );

        const clearButton = screen.getByTitle('Remove file');
        await user.click(clearButton);

        expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('displays error message when error prop is provided', () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                error="Upload failed. Please try again."
                onChange={mockOnChange}
            />
        );

        expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
    });

    it('shows loading state when loading prop is true', () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                loading={true}
                onChange={mockOnChange}
            />
        );

        expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('disables interaction when loading', async () => {
        const user = userEvent.setup();
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                loading={true}
                onChange={mockOnChange}
            />
        );

        const input = screen.getByLabelText('Upload File');
        expect(input).toBeDisabled();
    });

    it('handles drag and drop', async () => {
        render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                onChange={mockOnChange}
            />
        );

        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        const dropZone = screen.getByText(/Click to upload/i).closest('div');

        fireEvent.drop(dropZone, {
            dataTransfer: {
                files: [file],
            },
        });

        await waitFor(() => {
            expect(mockOnChange).toHaveBeenCalledWith(file);
        });
    });

    it('applies drag styling when dragging over', () => {
        const { container } = render(
            <FileUploadInput
                name="test-file"
                label="Upload File"
                onChange={mockOnChange}
            />
        );

        // Get the actual drop zone div (the one with border-dashed class)
        const dropZone = container.querySelector('.border-dashed');

        fireEvent.dragEnter(dropZone);
        expect(dropZone).toHaveClass('border-indigo-500');

        fireEvent.dragLeave(dropZone);
        expect(dropZone).not.toHaveClass('border-indigo-500');
    });
});
